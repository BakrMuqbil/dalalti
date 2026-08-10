import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createAuthToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const phone =
      typeof body.phone === "string"
        ? body.phone.trim()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    if (!phone || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "رقم الهاتف وكلمة المرور مطلوبان",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        phone,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "بيانات الدخول غير صحيحة",
        },
        { status: 401 }
      );
    }

    const validPassword = await verifyPassword(
      password,
      user.passwordHash
    );

    if (!validPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "بيانات الدخول غير صحيحة",
        },
        { status: 401 }
      );
    }

    const token = await createAuthToken({
      userId: user.id,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
      },
    });

    response.cookies.set("dalalti_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء تسجيل الدخول",
      },
      { status: 500 }
    );
  }
}