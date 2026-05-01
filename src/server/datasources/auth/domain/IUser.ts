import type { ObjectId } from "mongodb";

import type { Role } from "@/server/shared/auth";

/** Usuario habilitado para acceder al admin. Almacenado en MongoDB (`users`). */
export interface IUser {
  /** ObjectId nativo de MongoDB. Opcional al crear, presente al leer. */
  _id?: ObjectId;
  /** Email del usuario — identificador único y login. Lowercase. */
  email: string;
  /** Nombre visible del usuario. */
  name: string;
  /** Rol — `admin` (full) o `editor` (sin alta de usuarios). */
  role: Role;
  /** Si el usuario puede acceder al panel. */
  active: boolean;
  /** Fecha de creación. */
  createdAt: Date;
}
