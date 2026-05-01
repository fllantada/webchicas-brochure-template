import { z } from "zod";

export const requestCodeSchema = z.object({
  email: z.string().email("Email inválido").toLowerCase(),
});

export type RequestCodeInput = z.infer<typeof requestCodeSchema>;
