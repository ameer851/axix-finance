import { describe, expect, it } from "vitest";
import { financialLedger } from "../server/financialLedger";

// NOTE: These tests assume an isolated test database or mocked Supabase layer.
// They focus on the structure of verifyLedger rather than real persistence when not available.

describe("financialLedger.verifyLedger (structure)", () => {
  it("returns shape with ok boolean", async () => {
    // If supabase RPC not available, method will fallback gracefully.
    const result = await (financialLedger as any).verifyLedger({ sample: 1 });
    expect(result).toHaveProperty("ok");
    expect(result).toHaveProperty("checked");
  });
});
