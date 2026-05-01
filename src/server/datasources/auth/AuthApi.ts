import { addHours } from "date-fns";
import jwt from "jsonwebtoken";

import { ApiError } from "@/server/shared/ApiError";
import { getJwtSecret, Role } from "@/server/shared/auth";
import { EmailService } from "@/server/shared/emailService/EmailService";

import { AuthRepository } from "./AuthRepository";
import { generateCode } from "./domain/generateCode";
import { ILoginCode } from "./domain/ILoginCode";

const JWT_EXPIRATION = "30d";
const RATE_LIMIT_WINDOW_MIN = 15;
const RATE_LIMIT_MAX = 10;

interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

/** Magic link auth — genera códigos, los envía por email, verifica y emite JWT. */
export class AuthApi {
  private repository: AuthRepository;
  private emailService: EmailService;

  constructor() {
    this.repository = new AuthRepository();
    this.emailService = new EmailService();
  }

  /** Genera un código de 6 chars, lo persiste y lo envía por email. */
  async requestCode(email: string): Promise<void> {
    const user = await this.repository.findUserByEmail(email);

    if (!user) {
      throw ApiError.notFound("Email no registrado");
    }
    if (!user.active) {
      throw ApiError.forbidden("Usuario desactivado");
    }

    const windowStart = new Date(
      Date.now() - RATE_LIMIT_WINDOW_MIN * 60 * 1000,
    );
    const recentCount = await this.repository.countRecentCodes(
      email,
      windowStart,
    );
    if (recentCount >= RATE_LIMIT_MAX) {
      throw ApiError.badRequest(
        "Demasiados intentos. Esperá unos minutos antes de reintentar.",
      );
    }

    const code = generateCode();
    const record: ILoginCode = {
      code,
      email,
      createdAt: new Date(),
      expiresAt: addHours(new Date(), 1),
      used: false,
    };

    await this.repository.saveLoginCode(record);
    await this.emailService.sendLoginCode(email, code);
  }

  /** Verifica el código (válido = existe + no expirado) y retorna JWT firmado. */
  async verifyCode(email: string, code: string): Promise<string> {
    const valid = await this.repository.findValidCode(email, code);
    if (!valid) {
      throw ApiError.unauthorized("Código inválido o expirado");
    }

    const user = await this.repository.findUserByEmail(email);
    if (!user || !user.active) {
      throw ApiError.forbidden("Usuario no activo");
    }

    const payload: JwtPayload = {
      userId: user._id?.toString() ?? "",
      email: user.email,
      name: user.name,
      role: user.role,
    };

    return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRATION });
  }

  /** Verifica la firma del JWT y retorna el payload. */
  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, getJwtSecret()) as JwtPayload;
    } catch {
      throw ApiError.unauthorized("Token inválido o expirado");
    }
  }
}
