import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Prisma } from "@/app/generated/prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  handleApiError,
  errorResponse,
  successResponse,
} from "@/lib/api-response";
import { applyRateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { publicCreateOrderSchema } from "@/lib/validation/store";

const phoneQuerySchema = z.object({
  phone: z.string().min(1).max(20),
});

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `#DL-${timestamp}${random}`;
}

/* ============================================================
   GET — List customer orders by phone
   ============================================================ */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const reqHeaders = await headers();
  const rateLimitResponse = applyRateLimit(
    reqHeaders,
    rateLimitPresets.publicRead,
  );
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone") || "";

    const parsed = phoneQuerySchema.safeParse({ phone });
    if (!parsed.success) {
      return errorResponse("رقم الهاتف مطلوب", 400);
    }

    const store = await prisma.store.findUnique({
      where: { slug, status: "ACTIVE" },
      select: { id: true },
    });

    if (!store) {
      return errorResponse("المتجر غير موجود", 404);
    }

    const customer = await prisma.customer.findFirst({
      where: {
        storeId: store.id,
        phone: parsed.data.phone,
      },
      select: { id: true, name: true, phone: true, address: true },
    });

    if (!customer) {
      return NextResponse.json({ success: true, customer: null, orders: [] });
    }

    const orders = await prisma.order.findMany({
      where: {
        customerId: customer.id,
        storeId: store.id,
      },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
            variant: { select: { color: true, size: true } },
          },
        },
      },
    });

    const formattedOrders = orders.map((order) => ({
      id: order.id,
      orderNumber: order.id.slice(0, 8).toUpperCase(),
      status: order.status,
      totalAmount: order.totalAmount.toString(),
      createdAt: order.createdAt.toISOString(),
      itemCount: order.items.length,
      items: order.items.map((item) => ({
        id: item.id,
        productName: item.product.name,
        variantLabel:
          [item.variant?.color, item.variant?.size]
            .filter(Boolean)
            .join(" / ") || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
      })),
    }));

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
      },
      orders: formattedOrders,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/* ============================================================
   POST — Create customer order
   ============================================================ */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const reqHeaders = await headers();
  const rateLimitResponse = applyRateLimit(
    reqHeaders,
    rateLimitPresets.publicOrder,
  );
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { slug } = await params;
    const rawBody = await request.json();

    const parsed = publicCreateOrderSchema.safeParse(rawBody);
    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message || "بيانات الطلب غير صالحة";
      return errorResponse(message, 400);
    }

    const { customerName, customerPhone, customerAddress, notes, items, shippingCity, shippingDistrict, shippingAddress, shippingNotes } =
      parsed.data;

    // 1. Verify store exists and is ACTIVE
    const store = await prisma.store.findUnique({
      where: { slug, status: "ACTIVE" },
      select: { id: true, name: true },
    });

    if (!store) {
      return errorResponse("المتجر غير موجود أو غير نشط", 404);
    }

    // 2. Validate each item: product belongs to store, variant belongs to product, availability
    const validatedItems: Array<{
      productId: string;
      variantId: string | null;
      quantity: number;
      unitPrice: number;
      productName: string;
    }> = [];

    for (const item of items) {
      const product = await prisma.product.findFirst({
        where: {
          id: item.productId,
          storeId: store.id,
          status: "ACTIVE",
        },
        select: { id: true, name: true, price: true, availability: true },
      });

      if (!product) {
        return errorResponse(
          `المنتج ${item.productId} غير موجود في المتجر`,
          400,
        );
      }

      if (product.availability !== "AVAILABLE") {
        return errorResponse(`المنتج ${product.name} غير متوفر حالياً`, 400);
      }

      let unitPrice = product.price.toNumber();

      if (item.variantId) {
        const variant = await prisma.productVariant.findFirst({
          where: {
            id: item.variantId,
            productId: product.id,
          },
          select: {
            id: true,
            price: true,
            availability: true,
            color: true,
            size: true,
          },
        });

        if (!variant) {
          return errorResponse(
            `الخيار المحدد للمنتج ${product.name} غير موجود`,
            400,
          );
        }

        if (variant.availability !== "AVAILABLE") {
          return errorResponse(
            `الخيار المحدد للمنتج ${product.name} غير متوفر`,
            400,
          );
        }

        unitPrice = (variant.price ?? product.price).toNumber();
      }

      validatedItems.push({
        productId: product.id,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice,
        productName: product.name,
      });
    }

    // 3. Calculate totals server-side
    const totalAmount = validatedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    // 4. Find or create customer using transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let customerRecord = await tx.customer.findFirst({
        where: {
          storeId: store.id,
          phone: customerPhone,
        },
        select: { id: true, name: true, phone: true },
      });

      if (!customerRecord) {
        customerRecord = await tx.customer.create({
          data: {
            storeId: store.id,
            name: customerName,
            phone: customerPhone,
            address: customerAddress || null,
          },
        });
      } else {
        customerRecord = await tx.customer.update({
          where: { id: customerRecord.id },
          data: {
            name: customerName,
            address: customerAddress || null,
          },
        });
      }

      // 5. Create order with items and shipping snapshot
      const order = await tx.order.create({
        data: {
          storeId: store.id,
          customerId: customerRecord.id,
          status: "NEW",
          totalAmount: totalAmount,
          notes: notes || null,

          // Checkout 2 — Order Shipping Snapshot
          shippingCity: shippingCity || null,
          shippingDistrict: shippingDistrict || null,
          shippingAddress: shippingAddress || null,
          shippingNotes: shippingNotes || null,

          items: {
            create: validatedItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.unitPrice * item.quantity,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: { select: { name: true } },
              variant: { select: { color: true, size: true } },
            },
          },
          customer: true,
        },
      });

      return { order, customer: customerRecord };
    });

    return successResponse(
      {
        order: {
          id: result.order.id,
          orderNumber: result.order.id.slice(0, 8).toUpperCase(),
          status: result.order.status,
          totalAmount: result.order.totalAmount.toString(),
          items: result.order.items.map((item) => ({
            id: item.id,
            productName: item.product.name,
            variantLabel:
              [item.variant?.color, item.variant?.size]
                .filter(Boolean)
                .join(" / ") || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toString(),
          })),
          customer: {
            id: result.customer.id,
            name: result.customer.name,
            phone: result.customer.phone,
          },

          // Checkout 2 — Shipping Snapshot
          shipping: {
            city: result.order.shippingCity,
            district: result.order.shippingDistrict,
            address: result.order.shippingAddress,
            notes: result.order.shippingNotes,
          },

          createdAt: result.order.createdAt.toISOString(),
        },
      },
      "تم إنشاء الطلب بنجاح",
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
