import { redirect } from "next/navigation";

/** `/admin` → siempre login. La protección la hace cada página interna. */
export default function AdminPage() {
  redirect("/admin/login");
}
