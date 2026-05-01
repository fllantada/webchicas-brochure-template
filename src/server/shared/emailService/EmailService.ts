import sgMail, { MailDataRequired } from "@sendgrid/mail";

import { logger } from "../logger";

import {
  buildLoginCodeEmail,
  LoginCodeBranding,
} from "./templates/loginCode.template";

/**
 * Branding del cliente — leído de env vars para que el template sea agnóstico.
 * Cada cliente setea estas vars con sus valores; defaults conservadores acá.
 */
function getBranding(): LoginCodeBranding {
  return {
    brandName: process.env.BRAND_NAME || "Admin",
    primaryColor: process.env.BRAND_PRIMARY_COLOR || "#0D6666",
    logoUrl: process.env.BRAND_LOGO_URL,
  };
}

/** Envío de emails transaccionales con SendGrid. Lazy-inicializa la API key. */
export class EmailService {
  private initialized = false;
  private from = "";
  private fromName = "";

  private ensureConfigured(): void {
    if (this.initialized) return;

    const apiKey = (process.env.SENDGRID_API_KEY ?? "").trim();
    const from = (process.env.SENDGRID_FROM_EMAIL ?? "").trim();

    if (!apiKey) throw new Error("SENDGRID_API_KEY no configurada");
    if (!from) throw new Error("SENDGRID_FROM_EMAIL no configurada");

    this.from = from;
    this.fromName = process.env.BRAND_NAME || "Admin";
    sgMail.setApiKey(apiKey);
    this.initialized = true;
  }

  /** Envía el email de magic link al usuario. */
  async sendLoginCode(to: string, code: string): Promise<void> {
    this.ensureConfigured();

    const branding = getBranding();
    const html = buildLoginCodeEmail({ code, email: to, branding });

    const msg: MailDataRequired = {
      to,
      from: { name: this.fromName, email: this.from },
      subject: `Tu enlace de acceso · ${branding.brandName}`,
      html,
      text: `Tu acceso a ${branding.brandName}\n\nIngresá con este código: ${code}\n\nO abrí este enlace:\n${process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"}/admin/login?email=${encodeURIComponent(to)}&code=${code}\n\nVence en 1 hora. Si no pediste este acceso, ignorá este email.`,
    };

    try {
      await sgMail.send(msg);
      console.log(`[EmailService] Magic link enviado a ${to}`);
    } catch (error: unknown) {
      const sgError = error as {
        message?: string;
        code?: number;
        response?: { body?: unknown };
      };
      logger.error("EmailService: SendGrid error enviando magic link", {
        to,
        message: sgError.message,
        code: sgError.code,
        responseBody: sgError.response?.body,
      });
      throw error;
    }
  }
}
