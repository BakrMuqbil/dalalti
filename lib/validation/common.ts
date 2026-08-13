import { z } from "zod";

/**
 * مخططات مشتركة تُستخدم عبر جميع واجهات API.
 */

export const cuidSchema = z.string().cuid({ message: "معرف غير صالح" });

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export const searchSchema = z.object({
  q: z.string().trim().max(200).optional(),
});

export const phoneSchema = z
  .string()
  .min(1, "رقم الهاتف مطلوب")
  .max(20, "رقم الهاتف طويل جداً");

export const passwordSchema = z
  .string()
  .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
  .max(128, "كلمة المرور طويلة جداً");

export const slugSchema = z
  .string()
  .min(1, "الرابط مطلوب")
  .max(100, "الرابط طويل جداً")
  .regex(/^[a-z0-9-]+$/, "الرابط يجب أن يحتوي على أحرف إنجليزية وأرقام وشرطات فقط");

export const nameSchema = z
  .string()
  .min(1, "الاسم مطلوب")
  .max(200, "الاسم طويل جداً");

export const optionalNameSchema = z
  .string()
  .max(200, "الاسم طويل جداً")
  .transform((v) => v.trim() || null)
  .nullable();

export const priceSchema = z.coerce
  .number()
  .finite()
  .min(0, "السعر يجب أن يكون 0 أو أكثر")
  .max(999999999, "السعر كبير جداً");

export const emailSchema = z
  .string()
  .email("البريد الإلكتروني غير صالح")
  .max(254)
  .or(z.literal(""))
  .transform((v) => v || null)
  .nullable();

export const descriptionSchema = z
  .string()
  .max(2000, "الوصف طويل جداً")
  .transform((v) => v.trim() || null)
  .nullable();

export const urlSchema = z
  .string()
  .url("الرابط غير صالح")
  .max(2048, "الرابط طويل جداً");
