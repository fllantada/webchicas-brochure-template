import { requestCode } from "@/server/application/auth/requestCode";
import { verifyCode } from "@/server/application/auth/verifyCode";
import { verifyToken } from "@/server/application/auth/verifyToken";
import { AuthApi } from "@/server/datasources/auth/AuthApi";
import { requestCodeSchema } from "@/server/datasources/auth/schemas/request-code.schema";
import { verifyCodeSchema } from "@/server/datasources/auth/schemas/verify-code.schema";
import { ApiError } from "@/server/shared/ApiError";

/** Entry point HTTP para autenticación. Valida inputs y delega a application use cases. */
export class AuthController {
  private authApi = new AuthApi();

  async requestCode(email: string): Promise<{ message: string }> {
    const parsed = requestCodeSchema.safeParse({ email });
    if (!parsed.success) {
      throw ApiError.badRequest(parsed.error.issues[0].message);
    }
    await requestCode({ authApi: this.authApi }, { email: parsed.data.email });
    return { message: "Código enviado" };
  }

  async verifyCode(email: string, code: string): Promise<{ token: string }> {
    const parsed = verifyCodeSchema.safeParse({ email, code });
    if (!parsed.success) {
      throw ApiError.badRequest(parsed.error.issues[0].message);
    }
    const token = await verifyCode(
      { authApi: this.authApi },
      { email: parsed.data.email, code: parsed.data.code },
    );
    return { token };
  }

  verifyToken(token: string) {
    return verifyToken({ authApi: this.authApi }, { token });
  }
}
