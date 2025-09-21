// Simple supabase mock for unit tests
interface MockRow {
  [k: string]: any;
}
const tables: Record<string, MockRow[]> = {
  transactions: [],
  investments: [],
  users: [],
};

let idCounter = 1;

export function resetMockDb() {
  tables.transactions = [];
  tables.investments = [];
  tables.users = [];
  idCounter = 1;
}

export const supabase = {
  from: (table: string) => createQueryBuilder(table),
  rpc: async (fn: string, args: any) => {
    if (fn === "increment_user_active_deposits") {
      const user = tables.users.find((u) => u.id === args.user_id_input);
      if (user) {
        user.active_deposits = String(
          (
            Number(user.active_deposits || 0) + Number(args.amount_input)
          ).toFixed(2)
        );
      }
      return { data: null, error: null };
    }
    return { data: null, error: null };
  },
};

function createQueryBuilder(table: string) {
  const qb: any = {
    _table: table,
    _filters: [] as { col: string; val: any }[],
    _select: "*",
    select(sel?: string) {
      this._select = sel || "*";
      return this;
    },
    eq(col: string, val: any) {
      this._filters.push({ col, val });
      return this;
    },
    or() {
      return this;
    },
    order() {
      return this;
    },
    limit() {
      return this;
    },
    single() {
      this._single = true;
      return this;
    },
    maybeSingle() {
      this._maybeSingle = true;
      return this;
    },
    insert: async (payload: any) => {
      const rows = Array.isArray(payload) ? payload : [payload];
      const inserted = rows.map((r) => ({ ...r, id: idCounter++ }));
      tables[table].push(...inserted);
      return { data: qb._single ? inserted[0] : inserted, error: null };
    },
    update: async (upd: any) => {
      const matches = tables[table].filter((row) =>
        qb._filters.every(
          (f: { col: string; val: any }) => row[f.col] === f.val
        )
      );
      matches.forEach((m) => Object.assign(m, upd));
      return { data: qb._single ? matches[0] : matches, error: null };
    },
    then: undefined,
    // Execution
    _exec: () => {
      const rows = tables[table].filter((row) =>
        qb._filters.every(
          (f: { col: string; val: any }) => row[f.col] === f.val
        )
      );
      if (qb._single) {
        const row = rows[0];
        if (!row)
          return { data: null, error: { code: "PGRST116", message: "No row" } };
        return { data: row, error: null };
      }
      return { data: rows, error: null };
    },
    // Provide promise-like calls used in code (.single())
  };
  // Provide .eq chain resolution returning qb itself
  qb.single = qb.single.bind(qb);
  qb.insert = qb.insert.bind(qb);
  qb.update = qb.update.bind(qb);
  return qb;
}

// Seed helpers for tests
export function seedUser(user: Partial<MockRow>) {
  const row: MockRow = {
    id: idCounter++,
    balance: "0",
    active_deposits: "0",
    uid: "u" + Date.now(),
    ...user,
  };
  tables.users.push(row);
  return row;
}

export function seedTransaction(tx: Partial<MockRow>) {
  const row: MockRow = {
    id: idCounter++,
    status: "completed",
    amount: "100",
    created_at: new Date().toISOString(),
    ...tx,
  };
  tables.transactions.push(row);
  return row;
}

export function seedInvestment(inv: Partial<MockRow>) {
  const row: MockRow = {
    id: idCounter++,
    status: "active",
    days_elapsed: 0,
    total_earned: 0,
    ...inv,
  };
  tables.investments.push(row);
  return row;
}

export function getTable(name: string) {
  return tables[name];
}
