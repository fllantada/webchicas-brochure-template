"use client";

/** Loading view mientras se auto-verifica el código del magic link. */
export function AutoVerifyView() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
        <p className="text-sm text-muted">Verificando enlace...</p>
      </div>
    </div>
  );
}
