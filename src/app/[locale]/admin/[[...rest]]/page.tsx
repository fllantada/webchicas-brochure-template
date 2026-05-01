import { redirect } from "next/navigation";

/** Catch-all: si alguien entra a /es/admin/* o /en/admin/*, mandalo al admin (sin locale). */
export default function LocaleAdminCatchAll() {
  redirect("/admin/login");
}
