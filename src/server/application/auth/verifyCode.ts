import { AuthApi } from "@/server/datasources/auth/AuthApi";

type Deps = { authApi: AuthApi };
type Input = { email: string; code: string };

/** Use case: verificar código y emitir JWT. */
export async function verifyCode(deps: Deps, input: Input): Promise<string> {
  return deps.authApi.verifyCode(input.email, input.code);
}
