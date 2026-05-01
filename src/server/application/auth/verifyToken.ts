import { AuthApi } from "@/server/datasources/auth/AuthApi";

type Deps = { authApi: AuthApi };
type Input = { token: string };

/** Use case: verificar firma de un JWT y retornar payload. */
export function verifyToken(deps: Deps, input: Input) {
  return deps.authApi.verifyToken(input.token);
}
