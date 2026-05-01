"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import Cropper, { Area } from "react-easy-crop";

import type {
  ImageQuality,
  MediaCategory,
} from "@/server/datasources/media/domain/IMedia";

import {
  replaceFromExistingAction,
  replaceImageAction,
  reprocessQualityAction,
  updateMetaAction,
} from "../../actions";
import { cropImage } from "./cropImage";

interface LibraryItem {
  key: string;
  label: string;
  thumbUrl: string;
}

interface Props {
  mediaKey: string;
  category: MediaCategory;
  altEs: string;
  altEn: string;
  quality: ImageQuality;
  previewUrl: string;
  width: number;
  height: number;
  libraryItems: LibraryItem[];
}

const QUALITY_OPTIONS: { value: ImageQuality; label: string; hint: string }[] = [
  {
    value: "standard",
    label: "Estándar (recomendado)",
    hint: "Optimizado para web. Carga rápido. Para servicios, galería, OG.",
  },
  {
    value: "high",
    label: "Alta",
    hint: "Más detalle. ~2× peso. Para hero principal y fotos destacadas.",
  },
  {
    value: "max",
    label: "Máxima",
    hint: "Resolución original. ~5× peso. Solo para fotos premium.",
  },
];

type ChangeMode = null | "upload" | "library";

/**
 * Form de edición — preview + alt es/en + botón "Cambiar imagen" que despliega
 * 2 tabs: subir archivo (con cropper + rotación) o elegir de la biblioteca.
 */
export function MediaEditForm({
  mediaKey,
  category,
  altEs: initialAltEs,
  altEn: initialAltEn,
  quality: initialQuality,
  previewUrl,
  width,
  height,
  libraryItems,
}: Props) {
  const router = useRouter();
  const [altEs, setAltEs] = useState(initialAltEs);
  const [altEn, setAltEn] = useState(initialAltEn);
  const [quality, setQuality] = useState<ImageQuality>(initialQuality);
  const [changeMode, setChangeMode] = useState<ChangeMode>(null);

  // Upload + cropper state
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [pendingFile, setPendingFile] = useState<Blob | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);

  // Library state
  const [pendingSourceKey, setPendingSourceKey] = useState<string | null>(null);

  const [qualityModalOpen, setQualityModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const aspect = width / height;

  function onFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setImgSrc(URL.createObjectURL(f));
    setRotation(0);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    setPendingFile(null);
    setPendingPreview(null);
    setMessage(null);
  }

  const onCropComplete = useCallback(
    (_: Area, area: Area) => setCroppedAreaPixels(area),
    [],
  );

  async function applyCrop() {
    if (!imgSrc || !croppedAreaPixels) return;
    setSubmitting(true);
    try {
      const blob = await cropImage(imgSrc, croppedAreaPixels, rotation);
      setPendingFile(blob);
      setPendingPreview(URL.createObjectURL(blob));
      setImgSrc(null);
      setQualityModalOpen(true);
    } catch (e) {
      setMessage({
        kind: "error",
        text: e instanceof Error ? e.message : "Error al recortar",
      });
    }
    setSubmitting(false);
  }

  function pickFromLibrary(sourceKey: string) {
    const lib = libraryItems.find((l) => l.key === sourceKey);
    setPendingSourceKey(sourceKey);
    setPendingPreview(lib?.thumbUrl ?? null);
    setPendingFile(null);
    setMessage(null);
    setQualityModalOpen(true);
  }

  function cancelChange() {
    setChangeMode(null);
    setImgSrc(null);
    setPendingFile(null);
    setPendingPreview(null);
    setPendingSourceKey(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    let response;
    if (pendingFile) {
      const fd = new FormData();
      fd.set("file", pendingFile, "upload.jpg");
      fd.set("key", mediaKey);
      fd.set("altEs", altEs);
      fd.set("altEn", altEn);
      fd.set("category", category);
      fd.set("quality", quality);
      response = await replaceImageAction(fd);
    } else if (pendingSourceKey) {
      response = await replaceFromExistingAction(
        mediaKey,
        pendingSourceKey,
        quality,
      );
      if (response.success) {
        const meta = await updateMetaAction(mediaKey, {
          altEs,
          altEn,
          category,
        });
        if (!meta.success) response = meta;
      }
    } else if (qualityChanged) {
      // Solo cambió calidad → reprocesar la imagen actual con el nuevo preset.
      response = await reprocessQualityAction(mediaKey, quality);
      if (response.success) {
        const meta = await updateMetaAction(mediaKey, {
          altEs,
          altEn,
          category,
        });
        if (!meta.success) response = meta;
      }
    } else {
      response = await updateMetaAction(mediaKey, { altEs, altEn, category });
    }

    setSubmitting(false);

    if (!response.success) {
      setMessage({ kind: "error", text: response.error ?? "Error" });
      return;
    }

    setMessage({ kind: "success", text: "Cambios guardados" });
    cancelChange();
    router.refresh();
  }

  const showPreview = pendingPreview ?? previewUrl;

  // Hay cambios pendientes? → habilita el botón Guardar.
  const qualityChanged = quality !== initialQuality;
  const isDirty =
    altEs !== initialAltEs ||
    altEn !== initialAltEn ||
    qualityChanged ||
    pendingFile !== null ||
    pendingSourceKey !== null;

  return (
    <form onSubmit={handleSave}>
      {/* Sticky action bar arriba */}
      <div className="sticky top-0 md:top-0 z-20 -mx-6 md:-mx-8 mb-6 px-6 md:px-8 py-3 bg-bg/95 backdrop-blur-sm border-b border-border flex items-center justify-between gap-3">
        <p
          className={`min-w-0 flex-1 text-sm truncate ${
            message?.kind === "success"
              ? "text-accent"
              : message?.kind === "error"
              ? "text-red-600"
              : "text-muted"
          }`}
        >
          {message?.text}
        </p>
        <div className="flex gap-2 shrink-0">
          <a
            href="/admin/media"
            className="px-4 py-2 text-sm text-muted hover:text-accent"
          >
            Cancelar
          </a>
          <button
            type="submit"
            disabled={submitting || !isDirty}
            className="rounded-md bg-accent px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
            title={isDirty ? "Guardar cambios" : "No hay cambios pendientes"}
          >
            {submitting ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Preview compacto */}
        <div
          className="rounded-lg overflow-hidden border border-border bg-surface flex items-center justify-center"
          style={{ maxHeight: "320px" }}
        >
          <Image
            src={showPreview}
            alt={altEs || mediaKey}
            width={width}
            height={height}
            sizes="(min-width: 768px) 768px, 100vw"
            className="max-h-[320px] w-auto h-auto object-contain"
            unoptimized={!!pendingPreview}
          />
        </div>

        {/* Cambiar imagen */}
        {!changeMode && (
          <button
            type="button"
            onClick={() => setChangeMode("upload")}
            className="w-full rounded-md border border-dashed border-border bg-surface px-4 py-4 text-sm text-ink hover:border-accent hover:text-accent transition-colors"
          >
            Cambiar imagen
          </button>
        )}

        {changeMode && (
          <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
            {/* Tabs */}
            <div className="flex gap-2 border-b border-border">
              <TabButton
                active={changeMode === "upload"}
                onClick={() => setChangeMode("upload")}
              >
                Subir archivo
              </TabButton>
              <TabButton
                active={changeMode === "library"}
                onClick={() => setChangeMode("library")}
              >
                De la biblioteca
              </TabButton>
              <button
                type="button"
                onClick={cancelChange}
                className="ml-auto text-sm text-muted hover:text-accent px-3 py-2"
              >
                Cerrar
              </button>
            </div>

            {/* Tab: Subir archivo */}
            {changeMode === "upload" && (
              <div className="space-y-3">
                {!imgSrc && !pendingFile && (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onFileChosen}
                    className="block w-full text-sm text-ink file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-accent file:text-white hover:file:bg-accent-hover file:cursor-pointer"
                  />
                )}

                {imgSrc && (
                  <>
                    <div className="relative h-[360px] bg-ink rounded-md overflow-hidden">
                      <Cropper
                        image={imgSrc}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={aspect}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onRotationChange={setRotation}
                        onCropComplete={onCropComplete}
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-xs text-muted">Zoom</span>
                        <input
                          type="range"
                          min={1}
                          max={3}
                          step={0.05}
                          value={zoom}
                          onChange={(e) => setZoom(Number(e.target.value))}
                          className="w-full accent-accent"
                        />
                      </label>
                      <label className="block">
                        <span className="text-xs text-muted">
                          Rotación · {rotation}°
                        </span>
                        <div className="flex gap-2 items-center mt-1">
                          <button
                            type="button"
                            onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                            className="px-3 py-1.5 text-sm border border-border rounded hover:border-accent hover:text-accent"
                            aria-label="Rotar 90° izquierda"
                          >
                            ↺
                          </button>
                          <button
                            type="button"
                            onClick={() => setRotation((r) => (r + 90) % 360)}
                            className="px-3 py-1.5 text-sm border border-border rounded hover:border-accent hover:text-accent"
                            aria-label="Rotar 90° derecha"
                          >
                            ↻
                          </button>
                          <input
                            type="range"
                            min={0}
                            max={359}
                            step={1}
                            value={rotation}
                            onChange={(e) => setRotation(Number(e.target.value))}
                            className="flex-1 accent-accent"
                          />
                        </div>
                      </label>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setImgSrc(null)}
                        className="px-4 py-2 text-sm text-muted hover:text-accent"
                      >
                        Volver a elegir archivo
                      </button>
                      <button
                        type="button"
                        onClick={applyCrop}
                        disabled={submitting}
                        className="px-4 py-2 text-sm font-medium border border-accent text-accent rounded hover:bg-accent hover:text-white disabled:opacity-60"
                      >
                        {submitting ? "Procesando..." : "Confirmar recorte"}
                      </button>
                    </div>
                  </>
                )}

                {pendingFile && (
                  <p className="text-sm text-accent">
                    ✓ Imagen lista. Apretá <strong>Guardar</strong> arriba para
                    aplicar.
                  </p>
                )}
              </div>
            )}

            {/* Tab: Biblioteca */}
            {changeMode === "library" && (
              <div>
                {libraryItems.length === 0 ? (
                  <p className="text-sm text-muted py-4">
                    No hay otras imágenes en la biblioteca todavía.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[400px] overflow-y-auto">
                    {libraryItems.map((item) => {
                      const selected = pendingSourceKey === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => pickFromLibrary(item.key)}
                          className={`relative aspect-square rounded border overflow-hidden transition-all ${
                            selected
                              ? "border-accent ring-2 ring-accent"
                              : "border-border hover:border-accent"
                          }`}
                          title={item.label}
                        >
                          <img
                            src={item.thumbUrl}
                            alt={item.label}
                            className="w-full h-full object-cover"
                          />
                          {selected && (
                            <span className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                              <span className="bg-accent text-white text-xs px-2 py-0.5 rounded">
                                Elegida
                              </span>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                {pendingSourceKey && (
                  <p className="text-sm text-accent mt-3">
                    ✓ Imagen elegida. Apretá <strong>Guardar</strong> arriba
                    para aplicar.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Alt ES */}
        <div className="space-y-2">
          <label htmlFor="altEs" className="text-sm font-medium text-ink">
            Texto alternativo (ES){" "}
            <span className="text-xs text-muted">— SEO y accesibilidad</span>
          </label>
          <input
            id="altEs"
            type="text"
            value={altEs}
            onChange={(e) => setAltEs(e.target.value)}
            required
            className="w-full rounded-md border border-border bg-bg px-3 py-2.5 text-base text-ink focus:border-accent focus:outline-none"
          />
        </div>

        {/* Alt EN */}
        <div className="space-y-2">
          <label htmlFor="altEn" className="text-sm font-medium text-ink">
            Texto alternativo (EN)
          </label>
          <input
            id="altEn"
            type="text"
            value={altEn}
            onChange={(e) => setAltEn(e.target.value)}
            className="w-full rounded-md border border-border bg-bg px-3 py-2.5 text-base text-ink focus:border-accent focus:outline-none"
          />
        </div>

      </div>

      {/* Modal de calidad — aparece al confirmar imagen nueva */}
      {qualityModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4"
          onClick={() => setQualityModalOpen(false)}
        >
          <div
            className="bg-bg rounded-lg max-w-md w-full p-6 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p className="text-xs uppercase tracking-widest text-accent">
                Paso 2 de 2
              </p>
              <h2 className="font-heading text-xl text-ink mt-1">
                ¿Qué calidad necesitás?
              </h2>
              <p className="text-sm text-muted mt-2">
                Más calidad = imagen más nítida pero página más pesada. Para la
                mayoría de las fotos, la estándar es ideal.
              </p>
            </div>

            <div className="space-y-2">
              {QUALITY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex gap-3 items-start rounded-md border p-3 cursor-pointer transition-colors ${
                    quality === opt.value
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-accent/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="quality-modal"
                    value={opt.value}
                    checked={quality === opt.value}
                    onChange={() => setQuality(opt.value)}
                    className="mt-1 accent-accent"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-ink">
                      {opt.label}
                    </span>
                    <span className="block text-xs text-muted mt-0.5">
                      {opt.hint}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setQualityModalOpen(false)}
                className="px-4 py-2 text-sm text-muted hover:text-accent"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => setQualityModalOpen(false)}
                className="rounded-md bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
        active
          ? "text-accent border-accent"
          : "text-muted border-transparent hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
