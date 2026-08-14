import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-response";
import { SECURE_COOKIE_OPTIONS } from "@/lib/csrf";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "تم تسجيل الخروج",
  });

  response.cookies.set("dalalti_session", "", {
    ...SECURE_COOKIE_OPTIONS,
    maxAge: 0,
    expires: new Date(0),
  });

  response.cookies.set("dalalti_csrf", "", {
    ...SECURE_COOKIE_OPTIONS,
    httpOnly: false,
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
