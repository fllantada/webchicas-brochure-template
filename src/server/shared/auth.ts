import jwt from "jsonwebtoken";

import { ApiError } from "./ApiError";

export type Role = "admin" | "editor";

/** Datos del usuario autenticado, extraídos del JWT. */
export interface AdminUser {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

/** Payload del JWT de sesión admin. */
interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("[Auth] JWT_SECRET no configurada");
  }
  return secret;
}

/** Lee el token de la cookie `admin_token` del header Cookie. */
function getTokenFromCookie(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)admin_token=([^;]*)/);
  return match ? match[1] : null;
}

/**
 * Verifica el JWT de un Request.
 * Busca primero en `Authorization` header, luego en cookie `admin_token`.
 * Retorna los datos del usuario o lanza `ApiError.unauthorized`.
 */
export function withAuth(request: Request): AdminUser {
  const authHeader = request.headers.get("authorization");
  const token =
    (authHeader && authHeader.split(" ")[1]) || getTokenFromCookie(request);

  if (!token) {
    throw ApiError.unauthorized("Token requerido");
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
    return {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "TokenExpiredError") {
      throw ApiError.unauthorized("Token expirado");
    }
    throw ApiError.unauthorized("Token inválido");
  }
}

/** Verifica auth y que el usuario tenga uno de los roles permitidos. */
export function withRole(request: Request, roles: Role[]): AdminUser {
  const user = withAuth(request);
  if (!roles.includes(user.role)) {
    throw ApiError.forbidden(
      `Rol '${user.role}' no tiene acceso a este recurso`,
    );
  }
  return user;
}
