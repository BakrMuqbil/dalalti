import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-response";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "تم تسجيل الخروج",
  });

  response.cookies.set("dalalti_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    expires: new Date(0),
    path: "/",
  });

  return response;
}
