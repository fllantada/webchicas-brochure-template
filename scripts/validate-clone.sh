#!/bin/bash
# validate-clone.sh — validators ejecutables que decide si Fase 3 del /migrate
# está cerrada. Convierte los validators del § Regla Maestra de /migrate skill
# y de /web-clone SKILL.md en exit codes.
#
# Uso: bash scripts/validate-clone.sh
# Exit:
#   0  → todos los checks pasan, Fase 3 OK
#   ≠0 → al menos un check falló (n = cantidad de fails)
#
# Idempotente, sin side effects (solo lee).
#
# Validators (CRITICOS para que el cliente vea SU sitio, no el template):
#   1. messages/{es,en}.json no contiene defaults del template ("Bienvenidos", "Welcome")
#   2. globals.css no contiene paleta default del template (#F5F2EC, #0D6666)
#   3. npm run build pasa
#   4. Mongo: contact tiene phone, menu/prices tiene items según industria
#      (delegado a scripts/validate-mongo.ts)
#
# Lo que NO valida (delegado al orquestador /migrate):
#   - Visual diff vs screenshot original (requiere playwright + comparación visual)
#   - Deploy reachable (requiere URL de Vercel)
#   - OG images peso < 300KB (validator de /web-deploy, no de /web-clone)

set -uo pipefail
cd "$(dirname "$0")/.."

fail=0
ok() { echo "  [OK  ] $1"; }
err() { echo "  [FAIL] $1"; fail=$((fail + 1)); }

echo "[validate-clone] checking $(pwd)"

# ── Validator 1: copy del template en messages ──────────────────────────────
echo ""
echo "[1/4] messages/{es,en}.json no contiene defaults del template"
for locale_file in src/messages/es.json src/messages/en.json; do
  if [ ! -f "$locale_file" ]; then
    err "$locale_file no existe"
    continue
  fi
  # Defaults conocidos del template — si están en hero_title, copy no migrado
  if grep -qE '"hero_title": "(Bienvenidos|Welcome)"' "$locale_file"; then
    err "$locale_file tiene hero_title default ('Bienvenidos'/'Welcome')"
  elif grep -qE '"brand_name": "(Bienvenidos|Welcome)"' "$locale_file"; then
    err "$locale_file tiene brand_name default ('Bienvenidos'/'Welcome')"
  else
    ok "$locale_file tiene copy del cliente"
  fi
done

# ── Validator 2: paleta del template en globals.css ─────────────────────────
echo ""
echo "[2/4] globals.css no contiene paleta default del template"
if grep -qE '#F5F2EC|#0D6666' src/app/globals.css; then
  err "globals.css contiene paleta default (#F5F2EC bg / #0D6666 accent) — correr 'npx tsx scripts/apply-brand.ts'"
else
  ok "globals.css con paleta del cliente"
fi

# ── Validator 3: build local pasa ────────────────────────────────────────────
echo ""
echo "[3/4] npm run build"
if npm run build > /tmp/validate-clone-build.log 2>&1; then
  ok "npm run build OK"
else
  err "npm run build falló — ver /tmp/validate-clone-build.log"
fi

# ── Validator 4: Mongo collections tienen contenido del cliente ─────────────
echo ""
echo "[4/4] Mongo: contact + (menu|prices) según industria"
if [ ! -f "scripts/validate-mongo.ts" ]; then
  err "scripts/validate-mongo.ts no existe"
elif npx tsx scripts/validate-mongo.ts; then
  : # validate-mongo imprime sus propios OK/FAIL
else
  fail=$((fail + 1))
fi

# ── Resultado ───────────────────────────────────────────────────────────────
echo ""
if [ $fail -eq 0 ]; then
  echo "[validate-clone] ALL OK — Fase 3 cerrada"
  exit 0
fi
echo "[validate-clone] $fail check(s) FALLARON — Fase 3 NO cerrada"
exit $fail
