import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { AuthController } from "@/server/controllers/auth/AuthController";
import { ApiError, handleApiError } from "@/server/shared/ApiError";

const bodySchema = z.object({
  email: z.string().email("Email inválido"),
});

const controller = new AuthController();

export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      throw ApiError.badRequest(parsed.error.issues[0].message);
    }
    const result = await controller.requestCode(parsed.data.email);
    return NextResponse.json(result);
  } catch (error) {
    return await handleApiError(error);
  }
}
