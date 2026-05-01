"use server";

import { AuthController } from "@/server/controllers/auth/AuthController";

const controller = new AuthController();

/** Server Action: solicita un magic link al email del usuario. */
export async function requestCode(
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await controller.requestCode(email);
    return { ok: true };
  } catch (error: unknown) {
    console.error("[requestCode] Error:", error);
    const message =
      error instanceof Error ? error.message : "Error al enviar el código";
    return { ok: false, error: message };
  }
}
