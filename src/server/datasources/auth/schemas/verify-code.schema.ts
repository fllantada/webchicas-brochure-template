import { z } from "zod";

export const verifyCodeSchema = z.object({
  email: z.string().email("Email inválido").toLowerCase(),
  code: z
    .string()
    .length(6, "El código debe tener 6 caracteres")
    .toUpperCase(),
});

export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;
