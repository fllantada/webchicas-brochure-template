import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getAdminUser } from "@/lib/auth";

import { AutoVerifyView } from "./components/AutoVerifyView";
import { LoginForm } from "./components/LoginForm";

/** Página de login. Si ya hay sesión válida, redirige directo al dashboard
 *  para evitar que el usuario tenga que pedir un nuevo magic link cada vez. */
export default async function LoginPage() {
  const user = await getAdminUser();
  if (user) redirect("/admin/dashboard");

  return (
    <Suspense fallback={<AutoVerifyView />}>
      <LoginForm />
    </Suspense>
  );
}
