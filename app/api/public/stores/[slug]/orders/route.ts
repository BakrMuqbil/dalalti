import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Prisma } from "@/app/generated/prisma/client";
import { randomBytes } from "node:crypto";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { handleApiError, errorResponse, successResponse } from "@/lib/api-response";
import { applyRateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { publicCreateOrderSchema } from "@/lib/validation/store";

const phoneQuerySchema = z.object({ phone: z.string().trim().min(1).max(20) });

function generateOrderNumber(id: string): string {
  return `#DL-${id.slice(0, 8).toUpperCase()}`;
}

function generatePublicAccessToken(): string {
  return randomBytes(32).toString("hex");
}

/* GET — Customer order lookup */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const reqHeaders = await headers();
  const rateLimitResponse = applyRateLimit(reqHeaders, rateLimitPresets.publicRead);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { slug } = await params;
    const phone = new URL(request.url).searchParams.get("phone") || "";
    const parsed = phoneQuerySchema.safeParse({ phone });
    if (!parsed.success) return errorResponse("رقم الهاتف مطلوب", 400);

    const store = await prisma.store.findUnique({
      where: { slug, status: "ACTIVE" },
      select: { id: true },
    });
    if (!store) return errorResponse("المتجر غير موجود", 404);

    const customer = await prisma.customer.findFirst({
      where: { storeId: store.id, phone: parsed.data.phone },
      select: { id: true, name: true, phone: true, email: true, address: true },
    });

    if (!customer) return NextResponse.json({ success: true, customer: null, orders: [] });

    const orders = await prisma.order.findMany({
      where: { customerId: customer.id, storeId: store.id },
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

    return NextResponse.json({
      success: true,
      customer,
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: generateOrderNumber(order.id),
        status: order.status,
        totalAmount: order.totalAmount.toString(),
        createdAt: order.createdAt.toISOString(),
        itemCount: order.items.length,
        items: order.items.map((item) => ({
          id: item.id,
          productName: item.product.name,
          variantLabel: [item.variant?.color, item.variant?.size].filter(Boolean).join(" / ") || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
        })),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/* POST — Create a complete public customer order */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const reqHeaders = await headers();
  const rateLimitResponse = applyRateLimit(reqHeaders, rateLimitPresets.publicOrder);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { slug } = await params;
    const parsed = publicCreateOrderSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(parsed.error.issues[0]?.message || "بيانات الطلب غير صالحة", 400);
    }

    const {
      customerName, customerPhone, customerEmail,
      shippingCity, shippingArea, shippingAddress, shippingNotes,
      deliveryMethod, paymentMethod, notes, items,
    } = parsed.data;

    const store = await prisma.store.findUnique({
      where: { slug, status: "ACTIVE" },
      select: { id: true, name: true },
    });
    if (!store) return errorResponse("المتجر غير موجود أو غير نشط", 404);

    const validatedItems: Array<{ productId: string; variantId: string | null; quantity: number; unitPrice: number }> = [];

    for (const item of items) {
      const product = await prisma.product.findFirst({
        where: { id: item.productId, storeId: store.id, status: "ACTIVE" },
        select: { id: true, name: true, price: true, availability: true },
      });
      if (!product) return errorResponse("أحد المنتجات غير موجود في هذا المتجر", 400);
      if (product.availability !== "AVAILABLE") return errorResponse(`المنتج ${product.name} غير متوفر حالياً`, 400);

      let unitPrice = product.price.toNumber();
      if (item.variantId) {
        const variant = await prisma.productVariant.findFirst({
          where: { id: item.variantId, productId: product.id },
          select: { id: true, price: true, availability: true },
        });
        if (!variant) return errorResponse(`الخيار المحدد للمنتج ${product.name} غير موجود`, 400);
        if (variant.availability !== "AVAILABLE") return errorResponse(`الخيار المحدد للمنتج ${product.name} غير متوفر`, 400);
        unitPrice = (variant.price ?? product.price).toNumber();
      }

      validatedItems.push({ productId: product.id, variantId: item.variantId, quantity: item.quantity, unitPrice });
    }

    const subtotal = validatedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const shippingFee = 0;
    const totalAmount = subtotal + shippingFee;
    const publicAccessToken = generatePublicAccessToken();

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let customerRecord = await tx.customer.findFirst({
        where: { storeId: store.id, phone: customerPhone },
        select: { id: true, name: true, phone: true },
      });

      if (!customerRecord) {
        customerRecord = await tx.customer.create({
          data: {
            storeId: store.id,
            name: customerName,
            phone: customerPhone,
            email: customerEmail || null,
            address: `${shippingCity} - ${shippingArea} - ${shippingAddress}`,
            notes: shippingNotes || notes || null,
          },
        });
      } else {
        customerRecord = await tx.customer.update({
          where: { id: customerRecord.id },
          data: {
            name: customerName,
            email: customerEmail !== undefined ? customerEmail : undefined,
            address: `${shippingCity} - ${shippingArea} - ${shippingAddress}`,
            notes: shippingNotes || notes || null,
          },
        });
      }

      const order = await tx.order.create({
        data: {
          storeId: store.id,
          customerId: customerRecord.id,
          status: "NEW",
          totalAmount,
          notes: notes || null,
          shippingCity,
          shippingArea,
          shippingAddress,
          shippingNotes: shippingNotes || null,
          deliveryMethod,
          paymentMethod,
          shippingFee,
          publicAccessToken,
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
          items: { include: { product: { select: { name: true } }, variant: { select: { color: true, size: true } } } },
        },
      });

      return { order, customer: customerRecord };
    });

    return successResponse({
      order: {
        id: result.order.id,
        orderNumber: generateOrderNumber(result.order.id),
        status: result.order.status,
        subtotal: subtotal.toFixed(2),
        shippingFee: shippingFee.toFixed(2),
        totalAmount: result.order.totalAmount.toString(),
        deliveryMethod,
        paymentMethod,
        items: result.order.items.map((item) => ({
          id: item.id,
          productName: item.product.name,
          variantLabel: [item.variant?.color, item.variant?.size].filter(Boolean).join(" / ") || null,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
        })),
        customer: { id: result.customer.id, name: result.customer.name, phone: result.customer.phone },
        createdAt: result.order.createdAt.toISOString(),
        accessToken: publicAccessToken,
      },
    }, "تم إنشاء الطلب بنجاح", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
