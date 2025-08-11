// Centralized React Query keys
// Use functions for parameterized keys to ensure stable arrays.
export const queryKeys = {
  user: (id: number | undefined) => ["user", id] as const,
  userProfile: (id: number | undefined) => ["userProfile", id] as const,
  userTransactions: (id: number | undefined) =>
    ["user-transactions", id] as const,
  deposits: (id: number | undefined) => ["deposits", id] as const,
  withdrawals: (id: number | undefined) => ["withdrawals", id] as const,
  admin: {
    settings: ["admin-settings"] as const,
    users: (page: number, search?: string) =>
      ["admin-users", { page, search }] as const,
    stats: ["admin-stats"] as const,
  },
};

export type QueryKey =
  | ReturnType<typeof queryKeys.user>
  | ReturnType<typeof queryKeys.userProfile>
  | ReturnType<typeof queryKeys.userTransactions>;
