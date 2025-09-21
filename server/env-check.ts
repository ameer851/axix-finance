/* Environment variable validation */
import { log } from "./logger";

interface EnvSpec {
  key: string;
  required: boolean;
  description: string;
  pattern?: RegExp;
  example?: string;
}

const SPECS: EnvSpec[] = [
  {
    key: "SUPABASE_URL",
    required: true,
    description: "Supabase project REST URL",
    pattern: /^https?:\/\//i,
  },
  {
    key: "SUPABASE_ANON_KEY",
    required: true,
    description: "Supabase anon public API key",
    pattern: /\w{10,}/,
  },
  {
    key: "SUPABASE_JWT_SECRET",
    required: true,
    description: "JWT signing secret for auth validation",
    pattern: /.{20,}/,
  },
  {
    key: "SUPABASE_SERVICE_ROLE_KEY",
    required: false,
    description:
      "Supabase service role key (required in production for admin + privileged server tasks)",
    pattern: /\w{20,}/,
  },
  {
    key: "SUPABASE_DB_URL",
    required: false,
    description:
      "Direct Postgres connection string (enables transactional operations & hash-anchored ledger integrity checks)",
    pattern: /^postgresql:\/\//i,
  },
  {
    key: "DATABASE_URL",
    required: false,
    description:
      "Fallback / legacy direct Postgres connection string (alternative to SUPABASE_DB_URL)",
    pattern: /^postgresql:\/\//i,
  },
  {
    key: "RESEND_API_KEY",
    required: false,
    description: "Resend email API key (emails disabled if missing)",
  },
  {
    key: "EMAIL_FROM",
    required: false,
    description: "Default From email address",
  },
  {
    key: "NODE_ENV",
    required: true,
    description: "Execution environment",
    pattern: /^(development|production|test)$/,
  },
  { key: "PORT", required: false, description: "HTTP server port" },
  {
    key: "LOG_LEVEL",
    required: false,
    description: "Logger verbosity (debug,info,warn,error)",
    pattern: /^(debug|info|warn|error)$/,
  },
  {
    key: "FLY_APP_NAME",
    required: false,
    description: "Fly deployment app name",
  },
];

export interface EnvValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  summary: Record<string, string>;
  capabilities: {
    hasServiceRole: boolean;
    canDirectDb: boolean; // direct pg connection for transactions
    transactionalCompletions: boolean; // investment completion in a DB tx
  };
}

export function validateEnv(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const summary: Record<string, string> = {};

  for (const spec of SPECS) {
    const raw = process.env[spec.key];
    if (!raw) {
      if (spec.required) {
        errors.push(`Missing required env: ${spec.key} (${spec.description})`);
        summary[spec.key] = "MISSING";
      } else {
        warnings.push(
          `Optional env not set: ${spec.key} (${spec.description})`
        );
        summary[spec.key] = "unset";
      }
      continue;
    }
    if (spec.pattern && !spec.pattern.test(raw)) {
      errors.push(`Env ${spec.key} failed pattern validation`);
    }
    summary[spec.key] = "OK";
  }

  // Production stricter checks
  const isProd = process.env.NODE_ENV === "production";
  if (isProd) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      errors.push(
        "In production SUPABASE_SERVICE_ROLE_KEY must be set for admin and privileged operations"
      );
    }
    if (!process.env.SUPABASE_DB_URL && !process.env.DATABASE_URL) {
      warnings.push(
        "No direct DB connection string (SUPABASE_DB_URL or DATABASE_URL) set — falling back to Supabase client only; transactional investment completions disabled"
      );
    }
  }

  const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const canDirectDb = !!(
    process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  );
  const transactionalCompletions = canDirectDb; // simple mapping (future: feature flag)

  const result: EnvValidationResult = {
    ok: errors.length === 0,
    errors,
    warnings,
    summary,
    capabilities: {
      hasServiceRole,
      canDirectDb,
      transactionalCompletions,
    },
  };

  if (!result.ok) {
    log.error("ENV validation failed", {
      errors,
      summary,
      capabilities: result.capabilities,
    });
  } else {
    log.info("ENV validation passed", {
      summary,
      warnings,
      capabilities: result.capabilities,
    });
  }
  return result;
}
