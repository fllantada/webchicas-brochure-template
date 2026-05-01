import { getCollection } from "@/server/shared/MongoService";

import { ILoginCode } from "./domain/ILoginCode";
import { IUser } from "./domain/IUser";

/** Acceso a datos de auth en MongoDB (`users`, `login_codes`). */
export class AuthRepository {
  /** Busca un usuario por email en `users`. */
  async findUserByEmail(email: string): Promise<IUser | null> {
    const collection = await getCollection<IUser>("users");
    return collection.findOne({ email }) as Promise<IUser | null>;
  }

  /** Inserta un nuevo código de login en `login_codes`. */
  async saveLoginCode(record: ILoginCode): Promise<void> {
    const collection = await getCollection<ILoginCode>("login_codes");
    await collection.insertOne({ ...record });
  }

  /**
   * Busca un código válido (existe, no expirado). NO bloquea si ya fue usado —
   * el mismo código sirve hasta que expira para soportar abrir el link en
   * múltiples dispositivos. Marca `used: true` + `lastUsedAt` para auditoría.
   */
  async findValidCode(
    email: string,
    code: string,
  ): Promise<ILoginCode | null> {
    const collection = await getCollection<ILoginCode>("login_codes");
    return collection.findOneAndUpdate(
      {
        email,
        code,
        expiresAt: { $gt: new Date() },
      },
      { $set: { used: true, lastUsedAt: new Date() } },
      { returnDocument: "after" },
    ) as Promise<ILoginCode | null>;
  }

  /** Cuenta códigos generados para un email desde una fecha dada (rate-limit). */
  async countRecentCodes(email: string, since: Date): Promise<number> {
    const collection = await getCollection<ILoginCode>("login_codes");
    return collection.countDocuments({
      email,
      createdAt: { $gte: since },
    });
  }
}
