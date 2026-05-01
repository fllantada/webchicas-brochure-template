import { randomInt } from "crypto";

/** Caracteres permitidos. Excluye ambiguos (I, L, O, 0). */
const CHARACTERS = "ABCDEFHJKMNPQRSTUVWXYZ123456789";

/** Genera un código alfanumérico de 6 caracteres con `crypto.randomInt`. */
export function generateCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CHARACTERS.charAt(randomInt(CHARACTERS.length));
  }
  return code;
}
