import { redirect } from "next/navigation";

import { getAdminUser } from "@/lib/auth";
import { getContact } from "@/server/datasources/contact/MongoContactRepo";

import { ContactEditor } from "./components/ContactEditor";

/** Página admin para editar todos los datos de contacto del sitio. */
export default async function ContactAdminPage() {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  const contact = await getContact();

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-4xl p-6 md:p-8">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-widest text-muted">
            Admin · Contacto
          </p>
          <h1 className="font-heading text-3xl md:text-4xl text-ink mt-1">
            Datos de contacto
          </h1>
          <p className="text-sm text-muted mt-2 max-w-2xl">
            Estos datos aparecen en el footer, la página de contacto, los enlaces
            de WhatsApp y los CTAs de reserva. Cambiarlos acá los actualiza en
            todo el sitio.
          </p>
        </header>

        <ContactEditor initial={JSON.parse(JSON.stringify(contact))} />
      </div>
    </div>
  );
}
