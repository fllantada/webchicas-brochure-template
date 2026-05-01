import { notFound, redirect } from "next/navigation";

import { getAdminUser } from "@/lib/auth";
import {
  getMediaByKey,
  listMedia,
} from "@/server/datasources/media/MediaApi";

import { MediaEditForm } from "./components/MediaEditForm";

interface Props {
  params: Promise<{ key: string }>;
}

/** Detalle + form de edición de una imagen específica. */
export default async function MediaEditPage({ params }: Props) {
  const { key } = await params;

  const user = await getAdminUser();
  if (!user) redirect("/admin/login");

  const media = await getMediaByKey(key);
  if (!media) notFound();

  const allMedia = await listMedia();
  const otherMedias = allMedia
    .filter((m) => m.key !== media.key)
    .map((m) => ({
      key: m.key,
      label: m.label || m.key,
      thumbUrl: m.variants.webp.thumb,
    }));

  return (
    <div className="min-h-screen bg-bg p-6 md:p-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <a
            href="/admin/media"
            className="text-sm text-muted hover:text-accent"
          >
            ← Imágenes
          </a>
          <h1 className="mt-3 font-heading text-3xl text-ink">
            {media.label || media.key}
          </h1>
        </header>

        <MediaEditForm
          mediaKey={media.key}
          category={media.category}
          altEs={media.alt.es}
          altEn={media.alt.en}
          quality={media.quality ?? "standard"}
          previewUrl={media.variants.webp.card}
          width={media.width}
          height={media.height}
          libraryItems={otherMedias}
        />
      </div>
    </div>
  );
}
