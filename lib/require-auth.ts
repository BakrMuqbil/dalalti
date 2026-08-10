import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth";

export async function requireAuth() {
  const cookieStore = await cookies();

  const token = cookieStore.get("dalalti_session")?.value;

  if (!token) {
    return null;
  }

  try {
    return await verifyAuthToken(token);
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const auth = await requireAuth();

  if (!auth || auth.role !== "ADMIN") {
    return null;
  }

  return auth;
}
export async function requireStoreOwner() {
  const auth = await requireAuth();

  if (!auth || auth.role !== "STORE_OWNER") {
    return null;
  }

  return auth;
}
