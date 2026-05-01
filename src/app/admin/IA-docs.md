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

### 7. Performance

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
