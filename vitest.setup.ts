// Basic mocks for Supabase client used in unit tests
import { vi } from "vitest";

vi.stubGlobal("fetch", (...args: any[]) =>
  (globalThis as any).fetch?.(...args)
);
