import Image from "next/image";
import Link from "next/link";

import type { IMedia, MediaCategory } from "@/server/datasources/media/domain/IMedia";

interface Props {
  items: IMedia[];
}

const CATEGORY_LABELS: Record<MediaCategory, string> = {
  hero: "Hero",
  service: "Servicios",
  gallery: "Galería",
  about: "Sobre nosotros",
  og: "Redes sociales (OG)",
  other: "Otras",
};

const CATEGORY_ORDER: MediaCategory[] = [
  "hero",
  "service",
  "gallery",
  "about",
  "og",
  "other",
];

/** Grid de imágenes agrupadas por categoría. */
export function MediaGrid({ items }: Props) {
  const grouped = groupByCategory(items);

  return (
    <div className="space-y-12">
      {CATEGORY_ORDER.filter((cat) => grouped[cat]?.length).map((cat) => (
        <section key={cat}>
          <h2 className="font-heading text-xl text-ink mb-4">
            {CATEGORY_LABELS[cat]}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {grouped[cat]!.map((m) => (
              <Link
                key={m.key}
                href={`/admin/media/${m.key}`}
                className="group relative block overflow-hidden rounded-lg border border-border bg-surface transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={m.variants.webp.thumb}
                    alt={m.alt.es}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                    className="object-cover"
                    placeholder={m.blurDataURL ? "blur" : "empty"}
                    blurDataURL={m.blurDataURL}
                  />
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-ink truncate">
                    {m.label || m.key}
                  </p>
                  <p className="text-xs text-muted truncate mt-1">
                    {m.alt.es || "—"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function groupByCategory(items: IMedia[]): Partial<Record<MediaCategory, IMedia[]>> {
  return items.reduce(
    (acc, m) => {
      (acc[m.category] ??= []).push(m);
      return acc;
    },
    {} as Partial<Record<MediaCategory, IMedia[]>>,
  );
}
