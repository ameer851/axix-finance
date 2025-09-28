// Basic mocks for Supabase client used in unit tests
import { vi } from "vitest";

vi.stubGlobal("fetch", (...args: any[]) =>
  (globalThis as any).fetch?.(...args)
);

// Provide safe defaults for environment variables during tests
process.env.SUPABASE_URL ||= "http://localhost:54321";
process.env.SUPABASE_ANON_KEY ||= "test_anon_key";
process.env.SUPABASE_SERVICE_ROLE_KEY ||= "test_service_role_key";
process.env.SUPABASE_JWT_SECRET ||= "test_jwt_secret";
// Optional email-related envs to silence noisy warnings
process.env.EMAIL_FROM ||= "test@example.com";
