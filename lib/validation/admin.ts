import { z } from "zod";
import {
  nameSchema,
  phoneSchema,
  passwordSchema,
  cuidSchema,
  paginationSchema,
  searchSchema,
} from "./common";

/* ── Create Store (Admin) ── */
export const adminCreateStoreSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: z.string().email().max(254).or(z.literal("")).transform((v) => v || null).nullable().optional(),
  password: passwordSchema,
  storeName: nameSchema,
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  planId: cuidSchema,
});

/* ── Update Store (Admin) ── */
export const adminUpdateStoreSchema = z.object({
  name: nameSchema.optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(2000).transform((v) => v.trim() || null).nullable().optional(),
  logoUrl: z.string().url().max(2048).nullable().optional(),
  phone: z.string().max(20).transform((v) => v.trim() || null).nullable().optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  ownerName: nameSchema.optional(),
  ownerPhone: z.string().max(20).transform((v) => v.trim() || null).nullable().optional(),
  ownerEmail: z.string().email().max(254).or(z.literal("")).transform((v) => v || null).nullable().optional(),
  newPassword: passwordSchema.optional(),
  action: z.enum([
    "SUSPEND_STORE",
    "ACTIVATE_STORE",
    "CANCEL_SUBSCRIPTION",
    "ACTIVATE_SUBSCRIPTION",
    "EXTEND_SUBSCRIPTION",
    "CHANGE_PLAN",
  ]).optional(),
  days: z.coerce.number().int().min(1).max(3650).optional(),
  planId: cuidSchema.optional(),
});

/* ── Store List Query ── */
export const adminStoreListSchema = z.object({
  search: z.string().trim().max(200).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED"]).optional(),
  subscriptionStatus: z.enum(["ACTIVE", "EXPIRED", "CANCELLED"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

/* ── Plan ── */
export const updatePlanSchema = z.object({
  name: nameSchema.optional(),
  billingPeriod: z.enum(["MONTHLY", "YEARLY"]).optional(),
  price: z.coerce.number().finite().min(0).optional(),
  isActive: z.boolean().optional(),
});
