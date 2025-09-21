import { beforeEach, describe, expect, it, vi } from "vitest";
import * as svc from "../server/investmentService";

vi.mock("../server/supabase", async () => {
  const mock = await import("./__mocks__/supabase");
  return mock as any;
});

import {
  getTable,
  resetMockDb,
  seedTransaction,
  seedUser,
} from "./__mocks__/supabase";

describe("createInvestmentFromTransaction", () => {
  beforeEach(() => {
    resetMockDb();
  });

  it("fails when transaction not found", async () => {
    const res = await svc.createInvestmentFromTransaction(999, "starter");
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Transaction not found/);
  });

  it("fails if amount outside plan bounds", async () => {
    const user = seedUser({ id: 1, balance: "0" });
    seedTransaction({
      id: 10,
      user_id: user.id,
      amount: "5",
      status: "completed",
      created_at: new Date().toISOString(),
    });
    const res = await svc.createInvestmentFromTransaction(10, "starter");
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Amount is not within plan limits/);
  });

  it("creates investment for valid transaction", async () => {
    const user = seedUser({ id: 2, balance: "0" });
    seedTransaction({
      id: 11,
      user_id: user.id,
      amount: "200",
      status: "completed",
      created_at: new Date().toISOString(),
    });
    const res = await svc.createInvestmentFromTransaction(11, "starter");
    expect(res.success).toBe(true);
    expect(res.investment).toBeDefined();
    const investments = getTable("investments");
    expect(investments.length).toBe(1);
  });

  it("prevents duplicate investment for same transaction", async () => {
    const user = seedUser({ id: 3, balance: "0" });
    seedTransaction({
      id: 12,
      user_id: user.id,
      amount: "200",
      status: "completed",
      created_at: new Date().toISOString(),
    });
    const first = await svc.createInvestmentFromTransaction(12, "starter");
    expect(first.success).toBe(true);
    const second = await svc.createInvestmentFromTransaction(12, "starter");
    expect(second.success).toBe(false);
    expect(second.error).toMatch(/already created/);
  });
});
