/*
 Structured logger utility.
 Provides leveled logging with consistent shape, correlation IDs, and error normalization.
*/
import util from "util";

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: any;
}

interface LogEntry {
  ts: string; // ISO timestamp
  level: LogLevel; // log level
  msg: string; // message
  ctx?: LogContext; // optional structured context
  err?: {
    name?: string;
    message?: string;
    stack?: string;
    code?: any;
  };
  cid?: string; // correlation id
}

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const ACTIVE_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "info";

function shouldLog(level: LogLevel) {
  return LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[ACTIVE_LEVEL];
}

function normalizeError(err: any) {
  if (!err) return undefined;
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
      // @ts-ignore
      code: err.code,
    };
  }
  if (typeof err === "object") {
    return {
      name: err.name || "Error",
      message: err.message || util.inspect(err),
      // @ts-ignore
      stack: err.stack,
      // @ts-ignore
      code: err.code,
    };
  }
  return { name: "Error", message: String(err) };
}

function emit(entry: LogEntry) {
  try {
    const line = JSON.stringify(entry);
    if (entry.level === "error") {
      // eslint-disable-next-line no-console
      console.error(line);
    } else if (entry.level === "warn") {
      // eslint-disable-next-line no-console
      console.warn(line);
    } else if (entry.level === "info") {
      // eslint-disable-next-line no-console
      console.log(line);
    } else {
      // debug
      // eslint-disable-next-line no-console
      console.debug(line);
    }
  } catch (e) {
    // fallback
    // eslint-disable-next-line no-console
    console.log("LOG_FALLBACK", entry.level, entry.msg);
  }
}

function base(
  level: LogLevel,
  msg: string,
  ctx?: LogContext,
  err?: any,
  cid?: string
) {
  if (!shouldLog(level)) return;
  const entry: LogEntry = {
    ts: new Date().toISOString(),
    level,
    msg,
  };
  if (cid) entry.cid = cid;
  if (ctx && Object.keys(ctx).length) entry.ctx = ctx;
  const normErr = normalizeError(err);
  if (normErr) entry.err = normErr;
  emit(entry);
}

export const log = {
  debug: (msg: string, ctx?: LogContext) => base("debug", msg, ctx),
  info: (msg: string, ctx?: LogContext) => base("info", msg, ctx),
  warn: (msg: string, ctx?: LogContext) => base("warn", msg, ctx),
  error: (msg: string, err?: any, ctx?: LogContext) =>
    base("error", msg, ctx, err),
  withCid(cid: string) {
    return {
      debug: (msg: string, ctx?: LogContext) =>
        base("debug", msg, ctx, undefined, cid),
      info: (msg: string, ctx?: LogContext) =>
        base("info", msg, ctx, undefined, cid),
      warn: (msg: string, ctx?: LogContext) =>
        base("warn", msg, ctx, undefined, cid),
      error: (msg: string, err?: any, ctx?: LogContext) =>
        base("error", msg, ctx, err, cid),
    };
  },
};

export type { LogContext, LogLevel };
