import type { Area } from "react-easy-crop";

/** Carga una image source (URL o data URI) en un HTMLImageElement. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Aplica crop + rotación a una imagen y retorna un Blob JPEG de alta calidad
 * listo para subir al server (que lo procesará con sharp para generar variantes).
 */
export async function cropImage(
  src: string,
  area: Area,
  rotation: number,
): Promise<Blob> {
  const img = await loadImage(src);

  // Lienzo intermedio rotado
  const rotRad = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rotRad));
  const cos = Math.abs(Math.cos(rotRad));
  const rotatedW = img.width * cos + img.height * sin;
  const rotatedH = img.width * sin + img.height * cos;

  const rotatedCanvas = document.createElement("canvas");
  rotatedCanvas.width = rotatedW;
  rotatedCanvas.height = rotatedH;
  const rctx = rotatedCanvas.getContext("2d");
  if (!rctx) throw new Error("No 2d context");

  rctx.translate(rotatedW / 2, rotatedH / 2);
  rctx.rotate(rotRad);
  rctx.drawImage(img, -img.width / 2, -img.height / 2);

  // Lienzo final = el área cropeada del rotado
  const out = document.createElement("canvas");
  out.width = area.width;
  out.height = area.height;
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("No 2d context");

  ctx.drawImage(
    rotatedCanvas,
    area.x, area.y, area.width, area.height,
    0, 0, area.width, area.height,
  );

  return new Promise<Blob>((resolve, reject) => {
    out.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob falló"))),
      "image/jpeg",
      0.95,
    );
  });
}
