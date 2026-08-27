import { z } from "zod";
import {
  nameSchema,
  optionalNameSchema,
  priceSchema,
  descriptionSchema,
  cuidSchema,
  idSchema,
  emailSchema,
  paginationSchema,
  searchSchema,
} from "./common";

/* ── Product ── */

export const productAvailability = z.enum(["AVAILABLE", "UNAVAILABLE"]);

export const productStatus = z.enum(["ACTIVE", "INACTIVE"]);

export const createProductSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  price: priceSchema,
  availability: productAvailability.default("AVAILABLE"),
  status: productStatus.default("ACTIVE"),

  /**
   * Product.categoryId في Prisma هو UUID.
   */
  categoryId: idSchema.nullable().default(null),
});

export const updateProductSchema = z.object({
  name: nameSchema.optional(),
  description: descriptionSchema.optional(),
  price: priceSchema.optional(),
  availability: productAvailability.optional(),
  status: productStatus.optional(),

  /**
   * Product.categoryId في Prisma هو UUID.
   */
  categoryId: idSchema.nullable().optional(),
});

export const productQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),

  /**
   * categoryId في Prisma هو UUID.
   */
  categoryId: idSchema.optional(),

  availability: productAvailability.optional(),
  status: productStatus.optional(),

  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/* ── Category ── */

export const createCategorySchema = z.object({
  name: nameSchema,

  /**
   * Category.parentId في Prisma هو UUID.
   */
  parentId: idSchema.nullable().default(null),
});

export const updateCategorySchema = z.object({
  name: nameSchema.optional(),

  /**
   * Category.parentId في Prisma هو UUID.
   */
  parentId: idSchema.nullable().optional(),

  imageUrl: z.string().url().max(2048).nullable().optional(),
});

/* ── Customer ── */

export const createCustomerSchema = z.object({
  name: nameSchema,
  phone: z.string().min(1).max(20),
  email: emailSchema.optional(),
  address: optionalNameSchema,
  notes: z
    .string()
    .max(2000)
    .transform((v) => v.trim() || null)
    .nullable()
    .optional(),
});

export const updateCustomerSchema = z.object({
  name: nameSchema.optional(),
  phone: z.string().min(1).max(20).optional(),
  email: emailSchema.optional(),
  address: optionalNameSchema.optional(),
  notes: z
    .string()
    .max(2000)
    .transform((v) => v.trim() || null)
    .nullable()
    .optional(),
});

export const customerQuerySchema = searchSchema.merge(paginationSchema);

/* ── Order ── */

export const orderStatus = z.enum([
  "NEW",
  "CONFIRMED",
  "PROCESSING",
  "READY",
  "DELIVERED",
  "CANCELLED",
]);

export const orderItemSchema = z.object({
  /**
   * OrderItem.productId في Prisma هو UUID.
   */
  productId: idSchema,

  /**
   * OrderItem.variantId في Prisma هو UUID.
   */
  variantId: idSchema.nullable().default(null),

  quantity: z.number().int().min(1).max(1000),
});

export const createOrderSchema = z.object({
  /**
   * Order.customerId في Prisma هو UUID.
   */
  customerId: idSchema,

  notes: z
    .string()
    .max(2000)
    .transform((v) => v.trim() || null)
    .nullable()
    .optional(),

  items: z.array(orderItemSchema).min(1, "عناصر الطلب مطلوبة"),
});

export const updateOrderSchema = z.object({
  status: orderStatus.optional(),

  notes: z
    .string()
    .max(2000)
    .transform((v) => v.trim() || null)
    .nullable()
    .optional(),
});

export const orderQuerySchema = z.object({
  status: orderStatus.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

/* ── Public Order (Customer Checkout) ── */

export const publicOrderItemSchema = z.object({
  /**
   * Public checkout يستخدم UUIDs.
   */
  productId: idSchema,
  variantId: idSchema.nullable().default(null),

  quantity: z.number().int().min(1).max(1000),
});

export const publicCreateOrderSchema = z.object({
  customerName: z.string().trim().min(1, "الاسم الكامل مطلوب").max(200),

  customerPhone: z.string().trim().min(1, "رقم الهاتف مطلوب").max(20),

  customerEmail: emailSchema.optional(),

  shippingCity: z.string().trim().min(1, "المحافظة / المدينة مطلوبة").max(120),

  shippingArea: z.string().trim().min(1, "المنطقة / الحي مطلوب").max(160),

  shippingAddress: z.string().trim().min(1, "العنوان بالتفصيل مطلوب").max(500),

  shippingNotes: z
    .string()
    .max(1000)
    .transform((v) => v.trim() || null)
    .nullable()
    .optional(),

  deliveryMethod: z.literal("DELIVERY").default("DELIVERY"),

  paymentMethod: z.literal("CASH_ON_DELIVERY").default("CASH_ON_DELIVERY"),

  notes: z
    .string()
    .max(2000)
    .transform((v) => v.trim() || null)
    .nullable()
    .optional(),

  items: z.array(publicOrderItemSchema).min(1, "عناصر الطلب مطلوبة"),
});

/* ── Product Variant ── */

export const createVariantSchema = z.object({
  color: z
    .string()
    .max(100)
    .transform((v) => v.trim() || null)
    .nullable()
    .default(null),

  size: z
    .string()
    .max(100)
    .transform((v) => v.trim() || null)
    .nullable()
    .default(null),

  price: priceSchema.nullable().default(null),

  availability: productAvailability.default("AVAILABLE"),
});

export const updateVariantSchema = z.object({
  color: z
    .string()
    .max(100)
    .transform((v) => v.trim() || null)
    .nullable()
    .optional(),

  size: z
    .string()
    .max(100)
    .transform((v) => v.trim() || null)
    .nullable()
    .optional(),

  price: z.coerce.number().finite().min(0).nullable().optional(),

  availability: productAvailability.optional(),
});

/* ── Product Image ── */

export const createProductImageSchema = z.object({
  imageUrl: z.string().url("رابط الصورة غير صالح").max(2048),

  sortOrder: z.coerce.number().int().min(0).default(0),

  isPrimary: z.boolean().default(false),
});

export const updateProductImageSchema = z.object({
  imageUrl: z.string().url().max(2048).optional(),

  sortOrder: z.coerce.number().int().min(0).optional(),

  isPrimary: z.boolean().optional(),
});

export const deleteProductImageSchema = z.object({
  /**
   * ProductImage.id في Prisma هو UUID.
   */
  imageId: idSchema,
});

/* ── Store Settings ── */

export const updateStoreSchema = z.object({
  name: nameSchema.optional(),

  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/)
    .optional(),

  description: descriptionSchema.optional(),

  phone: z
    .string()
    .max(20)
    .transform((v) => v.trim() || null)
    .nullable()
    .optional(),

  logoUrl: z.string().url().max(2048).nullable().optional(),
});

/* ── Store Theme ── */

const hexColorSchema = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, "قيمة اللون يجب أن تكون بصيغة Hex مثل #7A5C3E");

export const updateStoreThemeSchema = z.object({
  primaryColor: hexColorSchema,
  secondaryColor: hexColorSchema,
  accentColor: hexColorSchema,
  backgroundColor: hexColorSchema,
  textColor: hexColorSchema,
});
