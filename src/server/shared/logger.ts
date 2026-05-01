import { Logtail } from "@logtail/node";

/**
 * Logger BetterStack (Logtail) — agency-level "WebChicas" source.
 * Cada cliente se diferencia por metadata `source` (shena, picturepar, etc.)
 *
 * En serverless (Vercel), la función puede terminar antes de que el SDK envíe
 * el batch — por eso `flush()` es OBLIGATORIO después de cada call para
 * garantizar entrega. Si no se awaitea, los logs llegan vacíos o no llegan.
 *
 * En desarrollo: solo console (no envía a BetterStack).
 */
const isProd = process.env.NODE_ENV === "production";
const token = process.env.LOGTAIL_TOKEN;
const host = process.env.LOGTAIL_HOST;

const remote =
  isProd && token && host
    ? new Logtail(token, {
        endpoint: host,
        sendLogsToConsoleOutput: true,
        sendLogsToBetterStack: true,
      })
    : null;

// Cada cliente se identifica por LOGTAIL_SOURCE (slug del proyecto, ej. "shena", "picturepar").
// En BetterStack se filtra por este campo para ver logs de un cliente específico.
const PROJECT_TAG = { source: process.env.LOGTAIL_SOURCE || "unknown" };

type LogContext = Record<string, unknown>;

function merge(ctx?: LogContext): LogContext {
  return { ...PROJECT_TAG, ...ctx };
}

async function send(
  level: "info" | "warn" | "error",
  message: string,
  context?: LogContext,
): Promise<void> {
  if (!remote) {
    const fn = level === "info" ? console.log : level === "warn" ? console.warn : console.error;
    fn(`[${level.toUpperCase()}] ${message}`, context ?? "");
    return;
  }
  remote[level](message, merge(context));
  await remote.flush();
}

export const logger = {
  info: (msg: string, ctx?: LogContext) => send("info", msg, ctx),
  warn: (msg: string, ctx?: LogContext) => send("warn", msg, ctx),
  error: (msg: string, ctx?: LogContext) => send("error", msg, ctx),
};
