import type { ObjectId } from "mongodb";

import { LOCALES, type Locale } from "@/i18n/locales";

/** Texto bilingüe — un campo por idioma soportado en el sitio. */
export type LocalizedText = Record<Locale, string>;

/** Item de horario. Día y horas son bilingües (ej "Lunes" / "Monday"). */
export interface ScheduleItem {
  /** ID estable para reordenar/editar (uuid). */
  id: string;
  /** Label del día o rango de días. */
  label: LocalizedText;
  /** Rango horario o "Cerrado". */
  hours: LocalizedText;
}

/**
 * Datos de contacto del negocio. Single document (key = "main").
 * Toda la información que aparece duplicada en el sitio (footer, contacto,
 * navbar, página servicios) lee desde acá.
 */
export interface IContact {
  _id?: ObjectId;
  /** Discriminator estable. Siempre "main" — un único contacto por sitio. */
  key: "main";

  /** Teléfono visible (formato display, ej "971 728 253"). */
  phone: string;
  /** Teléfono en formato E.164 sin signos para tel: y wa.me (ej "34971728253"). */
  phoneRaw: string;

  /** WhatsApp en formato E.164 sin signos (ej "34971728253"). */
  whatsapp: string;

  /** Email principal del negocio. */
  email: string;

  /** Calle + número. Bilingüe por si la traducción cambia (ej "C/ Rubí 8 bajos"). */
  addressStreet: LocalizedText;
  /** Ciudad / código postal. Bilingüe ("Ciudad, 00000"). */
  addressCity: LocalizedText;

  /** URL completa de embed de Google Maps (paste desde "Compartir > Insertar mapa"). */
  mapEmbedUrl: string;

  /** Items de horario, ordenados como aparecen en el sitio. */
  schedule: ScheduleItem[];

  /**
   * URLs de redes que el sitio público RENDERIZA. Vacío = no se muestra.
   *
   * YAGNI/KISS — solo agregar campos cuando un cliente real los necesite Y
   * el footer/header los renderice. Agregar un campo "por si acaso" + admin
   * que pide al cliente cargar algo que nunca se ve es anti-UX (regla
   * IA-docs admin §7: simetría admin↔visible).
   */
  social: {
    /** URL de Facebook page. */
    facebook: string;
    /** URL de Instagram. */
    instagram: string;
    /** URL de TripAdvisor (alta señal para gastronomía/turismo). */
    tripadvisor: string;
  };

  /** URL externa a Booksy (botón "Reservar"). Si está vacío, ocultar CTAs. */
  booksyUrl: string;

  updatedAt: Date;
}

/**
 * Versión sin _id ni Date — la que se pasa a Client Components serializada.
 * El layout lee IContact del server, lo serializa con JSON.parse(JSON.stringify),
 * y lo pasa a los componentes (footer/header/etc).
 */
export type PlainContact = Omit<IContact, "_id" | "updatedAt">;

/** Texto bilingüe con cada idioma vacío. Útil para forms nuevos / fallbacks. */
export const EMPTY_LOCALIZED: LocalizedText = LOCALES.reduce(
  (acc, l) => ({ ...acc, [l]: "" }),
  {} as LocalizedText,
);

/**
 * Esqueleto del documento de contacto cuando aún no se cargó nada.
 * Se devuelve desde getContact() como default para que el frontend nunca
 * crashee por nulls — el admin puede llenarlo después.
 */
export const EMPTY_CONTACT: IContact = {
  key: "main",
  phone: "",
  phoneRaw: "",
  whatsapp: "",
  email: "",
  addressStreet: { ...EMPTY_LOCALIZED },
  addressCity: { ...EMPTY_LOCALIZED },
  mapEmbedUrl: "",
  schedule: [],
  social: {
    facebook: "",
    instagram: "",
    tripadvisor: "",
  },
  booksyUrl: "",
  updatedAt: new Date(0),
};
