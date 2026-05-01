import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

import { getJwtSecret, type AdminUser, type Role } from "@/server/shared/auth";

const COOKIE_NAME = "admin_token";

/** Lee el token de la cookie admin_token. */
export async function getToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

/**
 * Lee el token y VERIFICA la firma con jwt.verify (no solo parsea base64).
 * Retorna AdminUser si la firma es válida y el token no expiró, null en cualquier
 * otro caso. Usar en pages/Server Components para gating.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
    return {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };
  } catch {
    return null;
  }
}

/** Payload del JWT de sesión admin (espejo del lado server). */
interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
  iat: number;
  exp: number;
}
