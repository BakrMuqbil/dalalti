import { z } from "zod";
import { phoneSchema, passwordSchema } from "./common";

export const loginSchema = z.object({
  phone: phoneSchema,
  password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
