import { SignJWT, jwtVerify } from "jose";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not defined");
  }
  return new TextEncoder().encode(secret);
}

export type AuthPayload = {
  userId: string;
  role: "ADMIN" | "STORE_OWNER";
};

export async function createAuthToken(payload: AuthPayload) {
  return new SignJWT({
    userId: payload.userId,
    role: payload.role,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, getSecretKey());

  return {
    userId: payload.userId as string,
    role: payload.role as AuthPayload["role"],
  };
}
