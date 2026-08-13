import { z } from "zod";
import {
  nameSchema,
  optionalNameSchema,
  priceSchema,
  descriptionSchema,
  cuidSchema,
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
  categoryId: z.string().cuid().nullable().default(null),
});

export const updateProductSchema = z.object({
  name: nameSchema.optional(),
  description: descriptionSchema.optional(),
  price: priceSchema.optional(),
  availability: productAvailability.optional(),
  status: productStatus.optional(),
  categoryId: z.string().cuid().nullable().optional(),
});

export const productQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  categoryId: z.string().cuid().optional(),
  availability: productAvailability.optional(),
  status: productStatus.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

/* ── Category ── */
export const createCategorySchema = z.object({
  name: nameSchema,
  parentId: z.string().cuid().nullable().default(null),
});

export const updateCategorySchema = z.object({
  name: nameSchema.optional(),
  parentId: z.string().cuid().nullable().optional(),
  imageUrl: z.string().url().max(2048).nullable().optional(),
});

/* ── Customer ── */
export const createCustomerSchema = z.object({
  name: nameSchema,
  phone: z.string().min(1).max(20),
  address: optionalNameSchema,
  notes: z.string().max(2000).transform((v) => v.trim() || null).nullable().optional(),
});

export const updateCustomerSchema = z.object({
  name: nameSchema.optional(),
  phone: z.string().min(1).max(20).optional(),
  address: optionalNameSchema.optional(),
  notes: z.string().max(2000).transform((v) => v.trim() || null).nullable().optional(),
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
  productId: z.string().cuid(),
  variantId: z.string().cuid().nullable().default(null),
  quantity: z.number().int().min(1).max(1000),
});

export const createOrderSchema = z.object({
  customerId: cuidSchema,
  notes: z.string().max(2000).transform((v) => v.trim() || null).nullable().optional(),
  items: z.array(orderItemSchema).min(1, "عناصر الطلب مطلوبة"),
});

export const updateOrderSchema = z.object({
  status: orderStatus.optional(),
  notes: z.string().max(2000).transform((v) => v.trim() || null).nullable().optional(),
});

export const orderQuerySchema = z.object({
  status: orderStatus.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

/* ── Variant ── */
export const createVariantSchema = z.object({
  color: z.string().max(100).transform((v) => v.trim() || null).nullable().default(null),
  size: z.string().max(100).transform((v) => v.trim() || null).nullable().default(null),
  price: priceSchema.nullable().default(null),
  availability: productAvailability.default("AVAILABLE"),
});

export const updateVariantSchema = z.object({
  color: z.string().max(100).transform((v) => v.trim() || null).nullable().optional(),
  size: z.string().max(100).transform((v) => v.trim() || null).nullable().optional(),
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
  imageId: cuidSchema,
});

/* ── Store Settings ── */
export const updateStoreSchema = z.object({
  name: nameSchema.optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  description: descriptionSchema.optional(),
  phone: z.string().max(20).transform((v) => v.trim() || null).nullable().optional(),
  logoUrl: z.string().url().max(2048).nullable().optional(),
});
