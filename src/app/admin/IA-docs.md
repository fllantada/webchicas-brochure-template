# IA-docs — Admin UX/UI

> El admin es para clientes **NO técnicos** (peluqueros, restauranteros, esteticistas, fotógrafos). Cualquier mejora que hagamos al admin debe seguir estas guidelines — son lo que separa un panel "que funciona" de uno que el cliente realmente usa.

## Por qué importa la UX del admin

El cliente toca el admin desde el celular en su negocio (entre clientes, en la cocina, en el salón). Si tarda en cargar, si no se ve bien en mobile, si los inputs no son obvios, **NO LO USA** — y volvemos al modelo viejo de "cliente nos manda WhatsApp con cambios y los hacemos nosotros". Eso destruye la propuesta del template autoadministrable.

## Reglas permanentes (no negociables)

### 1. Mobile-first SIEMPRE — y validar en desktop también

- Diseñar primero para `xs/sm` (375px), después escalar a `md/lg` (1024px+)
- **Validar visualmente en ambos** después de cada cambio. No alcanza con que funcione en una.
- Para validar usar `/visual-test` (Storybook-like) o screenshots Playwright a 375x667 + 1440x900
- Inputs `font-size: 16px` mínimo (iOS bloquea zoom auto si es menor)
- Touch targets >= 44x44px (Apple HIG, también Android)

### 2. Lo que ve el cliente, NO lo que ve el dev

- **Evitar jerga técnica**: "Categoría" no "Slug", "Cómo se llama" no "Title", "Lo que verá el cliente" no "Description".
- **Live preview** siempre que se pueda — el cliente debería ver "así se va a mostrar en la web" antes de guardar.
- **Esconder campos de ingeniería** (durationMinutes, order, slug, _id) cuando no aporten valor al cliente. Si necesita ordenar, drag-and-drop > input numérico.
- **Sin enums sin label**: si hay `category: "facial" | "corporal"` interno, mostrar "Facial" / "Corporal" en la UI.

### 3. Feedback inmediato

- Sticky save bar (fija abajo) cuando hay cambios — el cliente sabe siempre que tiene cambios sin guardar.
- isDirty state visible. Nunca dejar al cliente preguntándose "¿se guardó?".
- Errores de validación pegados al campo, no al final del form.
- Toasts de éxito BREVES (2s), errores SIN auto-dismiss.

### 4. Cookie persistente para login

Magic link es para entrar la primera vez. Después, cookie de 30 días — el cliente NO debería loguearse cada vez. Patrón validado en `darmas-app`.

### 5. Bilingüe ES/EN como primera clase

- Inputs lado a lado para ES y EN cuando hay `LocalizedText`
- Si EN está vacío, mostrar warning suave ("Sin traducción") pero permitir guardar
- NUNCA auto-traducir con Google — el cliente decide cuándo poblar EN

### 6. Polirrubrismo: esconder lo que no se usa

El template es **multi-rubro** (resto, estética, peluquería, construcción, fotografía...). Cada cliente activa solo los módulos que le sirven. La UI debe **esconder dinámicamente** lo que el cliente no usa — sino el panel se llena de tabs vacías y confunde.

**Patrón obligatorio**: cada link/sección/módulo del admin debe checkear `hasAny*Items()` (helper en cada `Mongo*Repo`) antes de renderizarse.

```ts
// Server Component (admin/_ui/AdminSidebar) lee el estado:
const [hasMenu, hasPrices] = await Promise.all([
  hasAnyMenuItems(),
  hasAnyPrices(),
]);

// Pasa a CC solo los items que aplican:
const items = [
  { label: "Inicio", href: "/admin/dashboard", show: true },
  { label: "Imágenes", href: "/admin/media", show: true },
  { label: "Contacto", href: "/admin/contact", show: true },
  hasMenu && { label: "Menú", href: "/admin/menu", show: true },
  hasPrices && { label: "Precios", href: "/admin/prices", show: true },
].filter(Boolean);
```

**Inverso**: si un módulo está vacío hoy pero el cliente lo va a usar, hay que tener un punto de entrada para crear el primer item (típicamente desde Dashboard, no desde sidebar). Cuando crea el primer registro, el link aparece en sidebar automáticamente al siguiente render.

**Aplica también a**:
- CTAs de "ver todos los X" en Dashboard (esconder si no hay X)
- Links del Footer/Header del sitio público (`/carta`, `/tarifas`) que dependen de qué módulos tiene activos el cliente
- Schema.org JSON-LD: si hay menu_items → `@type: Restaurant + hasMenu`. Si hay prices estética → `@type: BeautySalon`. Si nada → `@type: LocalBusiness` genérico.

**Anti-patrón**: dejar links estáticos hardcoded apuntando a páginas vacías. Es la diferencia entre admin "que se siente hecho para mí" vs "que parece un template genérico".

**Sub-regla — no exponer links a páginas que no existen** (capitalizado 2026-05-02):

Tener datos en Mongo (`hasAny*Items()`) no garantiza que la admin UI esté implementada. Antes de mostrar un link en sidebar/dashboard, validar **dos** flags:

```ts
import { ADMIN_UI_AVAILABLE } from "@/app/admin/_ui/availableModules";

const showMenu = hasAnyMenuItems() && ADMIN_UI_AVAILABLE.menu;
const showPrices = hasAnyPrices() && ADMIN_UI_AVAILABLE.prices;
```

`ADMIN_UI_AVAILABLE` es una constante explícita en `_ui/availableModules.ts` que indica si la página `/admin/{module}` está construida. Cuando se implemente la UI CRUD del módulo, switchear a `true`.

**Por qué la doble validación**: el backend de un módulo puede estar listo (modelo + repo + script seed) y la página pública (`/carta`, `/tarifas`) renderizando, pero la admin UI puede no existir aún. Mostrar el link al cliente → 404. Falla del principio "no exponer cocina sin terminar".

Bug detectado por el user durante smoke test cuerno-autoadministrable (2026-05-02): hicimos backend + página pública + flag polirrubrico de Menu, pero no construimos `/admin/menu/page.tsx`. Cliente clickeó "Menú" en sidebar → 404. Capitalizado con `ADMIN_UI_AVAILABLE`.

### 7. Simetría admin ↔ visible (YAGNI / KISS / UX-first)

> **Regla canónica del user (2026-05-02)**: "no pones a autoadministrar algo que no está visible".

Cada campo del admin debe **mapearse a algo visible en el sitio público**. Si el cliente carga un dato y nunca se ve, el campo es ruido — y peor, hace que el cliente piense "completé el formulario pero no aparece nada, ¿está roto?". Los clientes brochure son NO-técnicos y **se marean fácil**: cada input, cada label, cada sección que no entienden los desconcentra.

**Aplicación**:
- Antes de agregar un campo a un `Repo` o un input al admin → verificar que algún componente del sitio público lo renderice. Si no, el campo no va.
- Si el sitio renderiza un campo condicional (`{contact.X && <Foo />}`), el admin SÍ debe permitir cargarlo. Pero si el campo NO está renderizado en ningún lado, NO va al admin.
- Inverso: si en el sitio se renderiza algo hardcoded (sin venir de admin), o se mueve a admin o se acepta que NO es editable por el cliente. **No dejar campos zombie del modelo que nadie llena ni renderiza.**

**Aplicación retroactiva** del bug detectado con `IContact.social` (2026-05-02): agregamos 6 redes (`tripadvisor`, `tiktok`, `twitter`, `linkedin`, `youtube`, `googleBusiness`) al modelo + admin **antes** de agregarlas al Footer/Header del sitio público. Resultado: el cliente entra a /admin/contact, ve 6 inputs nuevos, los completa, no se ven nada. Disconnect.

**Fix correcto**: revertir a las 3 que SÍ se renderizan (`facebook`, `instagram`, `tripadvisor`). Si después un cliente real necesita TikTok, agregar TikTok al footer + al modelo + al admin **a la vez**. YAGNI.

### Filosofía operativa

- **YAGNI** (You Aren't Gonna Need It): no agregar campos/módulos/secciones para casos hipotéticos. Solo cuando un cliente real lo pide.
- **KISS** (Keep It Simple, Stupid): el admin debe tener el **mínimo** de inputs para que el cliente complete su sitio. Cada input extra suma fricción.
- **UX/UI first**: cuando hay tradeoff entre código limpio y experiencia del cliente NO-técnico, gana el cliente. El admin está hecho **para él**, no para nosotros.
- **El cliente se marea fácil**: si una sección tiene >5 inputs, dividirla. Si un input necesita explicación, repensarlo. Si hay un dropdown con más de 7 opciones, agrupar.

### 8. Performance

- Server Components donde se pueda (admin pages típicamente lo son)
- No bundle gigante en el admin — Tailwind tree-shake + componentes dinámicos
- React.cache() en lecturas Mongo del request (ya implementado en MongoContactRepo)

## Anti-patrones a evitar

- ❌ Modal sobre modal (el cliente se pierde)
- ❌ Form gigante de 30 campos en una pantalla
- ❌ Borrar sin confirmación → soft-delete (`active=false`) o confirmación explícita
- ❌ Estado oculto: si una imagen está procesándose, mostrarlo (loading, no silencio)
- ❌ Términos en inglés sin necesidad (Save → Guardar, Cancel → Cancelar, Edit → Editar)
- ❌ Iconos sin label (al menos en mobile)

## Validación tras cualquier cambio al admin

```
[ ] npm run build sin errores
[ ] Visual mobile (375x667) — flujo entero (login → dashboard → editar → guardar)
[ ] Visual desktop (1440x900) — idem
[ ] Touch targets >= 44px en mobile
[ ] Inputs >= 16px para evitar iOS zoom
[ ] Sin jerga técnica en labels
[ ] Live preview funcionando si aplica
[ ] Save bar sticky cuando isDirty
```

## Cuando se rebrandea el cliente

Re-validar todo lo de arriba con la paleta nueva. Especialmente: contraste WCAG AA (4.5:1 para texto, 3:1 para componentes). Las paletas de marca a veces tienen colores hermosos pero ilegibles en hover/focus state.
