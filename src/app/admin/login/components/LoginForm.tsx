"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios, { AxiosError } from "axios";

import { requestCode } from "../actions";
import { AutoVerifyView } from "./AutoVerifyView";

type Step = "email" | "code" | "auto";

const REDIRECT_AFTER_LOGIN = "/admin/dashboard";

/** Form de magic link — 2 pasos (email → code). Auto-verifica si vienen ?email&code en URL. */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paramEmail = searchParams.get("email");
  const paramCode = searchParams.get("code");
  const shouldAutoVerify = !!(paramEmail && paramCode);

  const [step, setStep] = useState<Step>(shouldAutoVerify ? "auto" : "email");
  const [email, setEmail] = useState(paramEmail || "");
  const [code, setCode] = useState(paramCode || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(shouldAutoVerify);

  useEffect(() => {
    if (!shouldAutoVerify) return;
    axios
      .post("/api/login", { email: paramEmail, code: paramCode })
      .then(() => router.push(REDIRECT_AFTER_LOGIN))
      .catch((err: unknown) => {
        const message =
          err instanceof AxiosError
            ? err.response?.data?.error
            : "Código inválido o expirado";
        setError(message || "Código inválido o expirado");
        setStep("code");
        setLoading(false);
      });
  }, [shouldAutoVerify, paramEmail, paramCode, router]);

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await requestCode(email);

    if (result.ok) {
      setStep("code");
    } else {
      setError(result.error || "Error al enviar el código");
    }

    setLoading(false);
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await axios.post("/api/login", { email, code });
      router.push(REDIRECT_AFTER_LOGIN);
    } catch (err: unknown) {
      const message =
        err instanceof AxiosError
          ? err.response?.data?.error
          : "Código inválido o expirado";
      setError(message || "Código inválido o expirado");
    }

    setLoading(false);
  }

  if (step === "auto") {
    return <AutoVerifyView />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-bg p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl text-ink mb-2">{process.env.NEXT_PUBLIC_BRAND_NAME || "Admin"}</h1>
          <p className="text-sm text-muted">
            {step === "email"
              ? "Ingresá tu email para recibir un enlace de acceso."
              : `Te enviamos un enlace a ${email}.`}
          </p>
        </div>

        {step === "email" ? (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-base text-ink placeholder:text-muted focus:border-accent focus:outline-none"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Enviando..." : "Enviar enlace"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <input
              type="text"
              placeholder="ABCDEF"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.toUpperCase().slice(0, 6))
              }
              maxLength={6}
              required
              autoFocus
              inputMode="text"
              className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-center text-2xl tracking-[0.4em] text-ink focus:border-accent focus:outline-none"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Verificando..." : "Verificar"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError("");
              }}
              className="w-full py-2 text-sm text-muted transition-colors hover:text-accent"
            >
              Cambiar email
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-muted">
          El enlace vence en 1 hora.
        </p>
      </div>
    </div>
  );
}
