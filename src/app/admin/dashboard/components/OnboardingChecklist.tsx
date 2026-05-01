import { getContact } from "@/server/datasources/contact/MongoContactRepo";
import { listMedia } from "@/server/datasources/media/MediaApi";
import { hasAnyMenuItems } from "@/server/datasources/menu/MongoMenuRepo";
import { hasAnyPrices } from "@/server/datasources/prices/MongoPriceRepo";

interface ChecklistItem {
  /** Pregunta concreta en lenguaje del cliente (NO técnico). */
  question: string;
  /** Path del admin donde completarlo. */
  href: string;
  /** Si está OK o pendiente. */
  done: boolean;
  /** Categoría visible para que el cliente entienda qué grupo es. */
  category: string;
}

/**
 * Checklist de tareas del onboarding del admin.
 *
 * Por qué: el cliente NO-técnico abre /admin por primera vez y ve 3 cards
 * grandes "Imágenes / Contacto / Precios" sin guía de qué hacer primero.
 * Este componente le dice "tu sitio está X% listo, te falta esto":
 *
 * - ¿Subiste hero (foto principal)?
 * - ¿Cargaste teléfono + email + dirección?
 * - ¿Pusiste horario?
 * - ¿Hay precios/menú según industria?
 *
 * SC: lee Mongo + Blob, calcula progreso, renderiza. No hay CC porque la
 * lista es pasiva (solo links a /admin/X).
 */
export async function OnboardingChecklist() {
  const [contact, media, hasMenu, hasPrices] = await Promise.all([
    getContact(),
    listMedia(),
    hasAnyMenuItems(),
    hasAnyPrices(),
  ]);

  const heroMedia = media.find((m) => m.key === "hero-main");
  const hasHero = !!heroMedia;
  const hasPhone = !!contact.phone;
  const hasEmail = !!contact.email;
  const hasAddress = !!contact.addressStreet?.es;
  const hasSchedule = (contact.schedule?.length ?? 0) > 0;
  const hasContent = hasMenu || hasPrices;

  const items: ChecklistItem[] = [
    {
      category: "Marca",
      question: "Subiste la foto principal (hero)",
      href: "/admin/media",
      done: hasHero,
    },
    {
      category: "Contacto",
      question: "Teléfono visible",
      href: "/admin/contact",
      done: hasPhone,
    },
    {
      category: "Contacto",
      question: "Email visible",
      href: "/admin/contact",
      done: hasEmail,
    },
    {
      category: "Contacto",
      question: "Dirección física",
      href: "/admin/contact",
      done: hasAddress,
    },
    {
      category: "Contacto",
      question: "Horarios de atención",
      href: "/admin/contact",
      done: hasSchedule,
    },
    {
      category: "Contenido",
      question:
        "Cargaste menú/carta o lista de precios (lo que aplique a tu negocio)",
      href: hasMenu
        ? "/admin/menu"
        : hasPrices
          ? "/admin/prices"
          : "/admin/contact",
      done: hasContent,
    },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const totalCount = items.length;
  const percent = Math.round((doneCount / totalCount) * 100);
  const isComplete = doneCount === totalCount;

  if (isComplete) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 mb-6">
        <p className="text-sm text-muted">
          ✓ Tu sitio está completo. Si querés cambiar algo, usá las secciones
          de abajo.
        </p>
      </div>
    );
  }

  return (
    <section
      className="rounded-2xl border border-border bg-surface p-6 mb-6"
      aria-labelledby="onboarding-title"
    >
      <header className="mb-4">
        <h2
          id="onboarding-title"
          className="font-heading text-xl text-ink mb-1"
        >
          Lo que falta para que tu sitio esté listo
        </h2>
        <p className="text-sm text-muted">
          {doneCount} de {totalCount} completadas — {percent}%
        </p>
        <div
          className="mt-3 h-2 w-full rounded-full bg-bg overflow-hidden"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progreso del onboarding"
        >
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </header>

      <ul className="space-y-2.5">
        {items.map((item, idx) => (
          <li key={idx}>
            {item.done ? (
              <div className="flex items-start gap-3 text-sm text-muted">
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full bg-accent text-white text-xs flex items-center justify-center mt-0.5"
                  aria-hidden
                >
                  ✓
                </span>
                <span className="line-through">{item.question}</span>
              </div>
            ) : (
              <a
                href={item.href}
                className="flex items-start gap-3 text-sm text-ink hover:text-accent transition-colors group"
              >
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-border group-hover:border-accent mt-0.5 transition-colors"
                  aria-hidden
                />
                <span className="flex-1">
                  <span className="text-xs uppercase tracking-wider text-muted block mb-0.5">
                    {item.category}
                  </span>
                  {item.question}
                  <span className="ml-2 text-xs text-accent">→ completar</span>
                </span>
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
