/**
 * Genera UUID v4. Wrapper sobre crypto.randomUUID() (disponible nativo en
 * browsers modernos y Node 18+) — un único punto de import para que sea
 * fácil mockear en tests si hace falta.
 */
export function randomUUID(): string {
  return crypto.randomUUID();
}
