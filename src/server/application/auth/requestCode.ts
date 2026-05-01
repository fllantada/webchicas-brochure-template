import { AuthApi } from "@/server/datasources/auth/AuthApi";

type Deps = { authApi: AuthApi };
type Input = { email: string };

/** Use case: solicitar magic link para un email. */
export async function requestCode(deps: Deps, input: Input): Promise<void> {
  return deps.authApi.requestCode(input.email);
}
