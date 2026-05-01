/** Código de magic link enviado por email. Almacenado en MongoDB (`login_codes`). */
export interface ILoginCode {
  /** Código alfanumérico de 6 caracteres. Sin caracteres ambiguos (I, L, O, 0). */
  code: string;
  /** Email del usuario que solicitó el código. Lowercase. */
  email: string;
  /** Fecha de creación del código. */
  createdAt: Date;
  /** Fecha de expiración (1 hora después de creación). */
  expiresAt: Date;
  /** Si el código ya fue consumido al menos una vez (no bloquea reuso). */
  used: boolean;
  /** Última vez que el código fue verificado. Para auditoría. */
  lastUsedAt?: Date;
}
