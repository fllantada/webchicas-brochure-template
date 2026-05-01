import { NextResponse } from "next/server";

import { logger } from "./logger";

/**
 * Error HTTP tipado.
 * `code` y `payload` son extensiones opcionales para que el frontend pueda
 * diferenciar casos programáticamente (no solo por mensaje).
 */
export class ApiError extends Error {
  public statusCode: number;
  /** Código simbólico estable que el frontend chequea (no es la URL ni el msg). */
  public code?: string;
  /** Datos extra para que el frontend resuelva el next step. */
  public payload?: Record<string, unknown>;

  constructor(
    statusCode: number,
    message: string,
    code?: string,
    payload?: Record<string, unknown>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiError";
    this.code = code;
    this.payload = payload;
  }

  static badRequest(message: string) {
    return new ApiError(400, message);
  }

  static unauthorized(message: string = "No autorizado") {
    return new ApiError(401, message);
  }

  static forbidden(message: string = "Acceso denegado") {
    return new ApiError(403, message);
  }

  static notFound(message: string = "No encontrado") {
    return new ApiError(404, message);
  }

  static conflict(message: string) {
    return new ApiError(409, message);
  }

  static preconditionFailed(
    message: string,
    code?: string,
    payload?: Record<string, unknown>,
  ) {
    return new ApiError(412, message, code, payload);
  }

  static internal(message: string = "Error interno del servidor") {
    return new ApiError(500, message);
  }
}

/**
 * Convierte errores a NextResponse JSON.
 * Usar en Route Handlers: `catch (error) { return handleApiError(error); }`
 */
export async function handleApiError(error: unknown): Promise<NextResponse> {
  if (error instanceof ApiError) {
    const body: Record<string, unknown> = { error: error.message };
    if (error.code) body.code = error.code;
    if (error.payload) body.payload = error.payload;
    return NextResponse.json(body, { status: error.statusCode });
  }
  await logger.error("API: error inesperado", {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  return NextResponse.json(
    { error: "Error interno del servidor" },
    { status: 500 },
  );
}
