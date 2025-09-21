// Derived runtime capability flags.
// This centralizes interpretation of environment for feature gating
// (e.g., enabling transactional investment completion when a direct
// Postgres connection string is available).

import { EnvValidationResult, validateEnv } from "./env-check";

let cached: EnvValidationResult | null = null;

export function getCapabilities() {
  if (!cached) {
    cached = validateEnv();
  }
  return cached.capabilities;
}

export function hasTransactionalCompletions() {
  return getCapabilities().transactionalCompletions;
}

export function hasDirectDb() {
  return getCapabilities().canDirectDb;
}

export function hasServiceRole() {
  return getCapabilities().hasServiceRole;
}
