import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { AuthController } from "@/server/controllers/auth/AuthController";
import { ApiError, handleApiError } from "@/server/shared/ApiError";

const bodySchema = z.object({
  email: z.string().email("Email inválido"),
  code: z.string().min(1, "code es requerido"),
});

const controller = new AuthController();
const COOKIE_NAME = "admin_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      throw ApiError.badRequest(parsed.error.issues[0].message);
    }
    const { email, code } = parsed.data;
    const { token } = await controller.verifyCode(email, code);

    const response = NextResponse.json({ ok: true });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: COOKIE_MAX_AGE,
    });
    return response;
  } catch (error) {
    return await handleApiError(error);
  }
}
