import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { fetchWithAuth } from "@/services/api";
import { Copy, MoreHorizontal, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AdminV2Layout from "./layout";

interface UserTransaction {
  id: number;
  email: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  balance: string;
  bitcoinAddress?: string;
  bitcoinCashAddress?: string;
  ethereumAddress?: string;
  usdtTrc20Address?: string;
  bnbAddress?: string;
  totalDeposits: number;
  totalWithdrawals: number;
  transactionCount: number;
  lastTransactionDate?: string;
}

export default function UserTransactionsPage() {
  const { user: currentUser } = useAuth();
  const [data, setData] = useState<UserTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<string>("balance");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      if (search.trim()) params.set("search", search.trim());

      const json = await fetchWithAuth(`/admin/user-transactions?${params}`);
      setData(json.data || []);
      setTotalPages(json.pagination?.totalPages || 1);
    } catch (e: any) {
      setError(e.message || "Failed to load user transactions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page, sortBy, sortOrder]);

  const canSearch = useMemo(() => !loading, [loading]);

  function onSearchSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setPage(1);
    load();
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        // Could add a toast notification here
        console.log(`${label} copied to clipboard`);
      })
      .catch(() => {
        console.error("Failed to copy to clipboard");
      });
  }

  function formatAddress(address: string | undefined, type: string): string {
    if (!address) return "Not set";
    if (address.length <= 20) return address;
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  }

  function getWalletAddresses(user: UserTransaction) {
    const addresses = [];
    if (user.bitcoinAddress)
      addresses.push({ type: "Bitcoin", address: user.bitcoinAddress });
    if (user.bitcoinCashAddress)
      addresses.push({
        type: "Bitcoin Cash",
        address: user.bitcoinCashAddress,
      });
    if (user.ethereumAddress)
      addresses.push({ type: "Ethereum", address: user.ethereumAddress });
    if (user.usdtTrc20Address)
      addresses.push({ type: "USDT TRC20", address: user.usdtTrc20Address });
    if (user.bnbAddress)
      addresses.push({ type: "BNB", address: user.bnbAddress });
    return addresses;
  }

  return (
    <AdminV2Layout>
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <h2 className="text-xl font-semibold">User Transactions & Wallets</h2>
        <form
          onSubmit={onSearchSubmit}
          className="flex items-center gap-2 flex-wrap"
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email, username, name"
            className="border rounded px-2 py-1 text-sm w-full sm:w-64"
          />
          <select
            className="border rounded px-2 py-1 text-sm w-full sm:w-auto"
            value={sortBy}
            aria-label="Sort by"
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
          >
            <option value="balance">Balance</option>
            <option value="totalDeposits">Total Deposits</option>
            <option value="totalWithdrawals">Total Withdrawals</option>
            <option value="transactionCount">Transaction Count</option>
            <option value="lastTransactionDate">Last Transaction</option>
          </select>
          <select
            className="border rounded px-2 py-1 text-sm w-full sm:w-auto"
            value={sortOrder}
            aria-label="Sort order"
            onChange={(e) => {
              setSortOrder(e.target.value as "asc" | "desc");
              setPage(1);
            }}
          >
            <option value="desc">High to Low</option>
            <option value="asc">Low to High</option>
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              className="text-sm px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50 whitespace-nowrap"
              disabled={!canSearch}
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setPage(1);
                load();
              }}
              className="text-sm px-3 py-1 rounded bg-gray-200 disabled:opacity-50 whitespace-nowrap"
              disabled={loading}
            >
              Reset
            </button>
            <button
              type="button"
              onClick={load}
              className="text-sm px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50 whitespace-nowrap"
              disabled={loading}
            >
              Reload
            </button>
          </div>
        </form>
      </div>

      {error && <div className="text-red-600 text-sm mb-2">Error: {error}</div>}

      <div className="border rounded bg-white overflow-x-auto">
        <table className="w-full text-sm min-w-[1000px]">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2 min-w-[60px]">ID</th>
              <th className="p-2 min-w-[200px]">User</th>
              <th className="p-2 min-w-[100px]">Balance</th>
              <th className="p-2 min-w-[100px]">Total Deposits</th>
              <th className="p-2 min-w-[100px]">Total Withdrawals</th>
              <th className="p-2 min-w-[80px]">Transactions</th>
              <th className="p-2 min-w-[150px]">Last Transaction</th>
              <th className="p-2 min-w-[300px]">Wallet Addresses</th>
              <th className="p-2 min-w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={9} className="p-4 text-center">
                  Loading...
                </td>
              </tr>
            )}
            {!loading &&
              data.map((user) => (
                <tr key={user.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">{user.id}</td>
                  <td className="p-2">
                    <div>
                      <div className="font-medium">{user.email}</div>
                      {user.username && (
                        <div className="text-xs text-gray-500">
                          @{user.username}
                        </div>
                      )}
                      {(user.firstName || user.lastName) && (
                        <div className="text-xs text-gray-500">
                          {user.firstName} {user.lastName}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-2 font-medium">
                    ${parseFloat(user.balance).toFixed(2)}
                  </td>
                  <td className="p-2">${user.totalDeposits.toFixed(2)}</td>
                  <td className="p-2">${user.totalWithdrawals.toFixed(2)}</td>
                  <td className="p-2">{user.transactionCount}</td>
                  <td className="p-2">
                    {user.lastTransactionDate
                      ? new Date(user.lastTransactionDate).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td className="p-2">
                    <div className="space-y-1">
                      {getWalletAddresses(user).map((wallet, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-xs"
                        >
                          <Wallet className="h-3 w-3 text-gray-400" />
                          <span className="font-medium min-w-[80px]">
                            {wallet.type}:
                          </span>
                          <span className="font-mono bg-gray-100 px-1 rounded">
                            {formatAddress(wallet.address, wallet.type)}
                          </span>
                          <button
                            onClick={() =>
                              copyToClipboard(wallet.address, wallet.type)
                            }
                            className="p-1 hover:bg-gray-200 rounded"
                            title={`Copy ${wallet.type} address`}
                          >
                            <Copy className="h-3 w-3 text-gray-500" />
                          </button>
                        </div>
                      ))}
                      {getWalletAddresses(user).length === 0 && (
                        <span className="text-xs text-gray-400">
                          No wallets set
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="inline-flex items-center justify-center h-8 w-8 rounded hover:bg-gray-100 border text-gray-600"
                          aria-label="Actions"
                          disabled={loading}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => {
                            const addresses = getWalletAddresses(user);
                            if (addresses.length > 0) {
                              const allAddresses = addresses
                                .map((w) => `${w.type}: ${w.address}`)
                                .join("\n");
                              copyToClipboard(
                                allAddresses,
                                "All wallet addresses"
                              );
                            }
                          }}
                          disabled={getWalletAddresses(user).length === 0}
                        >
                          Copy All Addresses
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={9} className="p-4 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2 mt-4 text-sm items-center">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-2 py-1 bg-gray-200 rounded disabled:opacity-40"
        >
          Prev
        </button>
        <span>
          Page {page} / {totalPages}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="px-2 py-1 bg-gray-200 rounded disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </AdminV2Layout>
  );
}
