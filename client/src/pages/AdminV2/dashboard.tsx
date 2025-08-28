import { fetchWithAuth } from "@/services/api";
import { useEffect, useState } from "react";
import AdminV2Layout from "./layout";

type Summary = {
  users: { total: number; pendingVerification: number };
  transactions: {
    pendingDeposits: number;
    pendingWithdrawals: number;
    totalDeposits: number;
    totalWithdrawals: number;
    profit: number;
  };
};

export default function AdminDashboardV2() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [depSeries, setDepSeries] = useState<
    Array<{ label: string; total: number }>
  >([]);
  const [wdSeries, setWdSeries] = useState<
    Array<{ label: string; total: number }>
  >([]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`/admin/stats/summary`);
      if (res?.success) setSummary(res.data);
      else setError(res?.message || "Failed to load stats");
      // Load simple time series for the charts
      const [dep, wd] = await Promise.all([
        fetchWithAuth(
          `/admin/stats/timeseries?type=deposit&interval=daily&days=14`
        ),
        fetchWithAuth(
          `/admin/stats/timeseries?type=withdrawal&interval=daily&days=14`
        ),
      ]);
      if (dep?.success) setDepSeries(dep.data.series || []);
      if (wd?.success) setWdSeries(wd.data.series || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <AdminV2Layout>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-xl font-semibold">Dashboard Overview</h2>
        <button
          onClick={load}
          disabled={loading}
          className="text-sm px-3 py-1 bg-blue-600 text-white rounded whitespace-nowrap"
        >
          Reload
        </button>
      </div>
      {error && <div className="text-red-600 mb-4 text-sm">Error: {error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <div className="text-gray-500 text-sm">Total Users</div>
          <div className="text-2xl font-semibold">
            {summary?.users.total ?? (loading ? "…" : 0)}
          </div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-gray-500 text-sm">Pending Verification</div>
          <div className="text-2xl font-semibold">
            {summary?.users.pendingVerification ?? (loading ? "…" : 0)}
          </div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-gray-500 text-sm">Pending Transactions</div>
          <div className="text-2xl font-semibold">
            {(summary?.transactions.pendingDeposits ?? 0) +
              (summary?.transactions.pendingWithdrawals ?? 0)}
          </div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-gray-500 text-sm">Total Deposits</div>
          <div className="text-2xl font-semibold">
            $
            {summary?.transactions.totalDeposits?.toFixed?.(2) ??
              (loading ? "…" : "0.00")}
          </div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-gray-500 text-sm">Total Withdrawals</div>
          <div className="text-2xl font-semibold">
            $
            {summary?.transactions.totalWithdrawals?.toFixed?.(2) ??
              (loading ? "…" : "0.00")}
          </div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-gray-500 text-sm">Profit</div>
          <div
            className={`text-2xl font-semibold ${(summary?.transactions.profit ?? 0) >= 0 ? "text-green-700" : "text-red-700"}`}
          >
            $
            {summary?.transactions.profit?.toFixed?.(2) ??
              (loading ? "…" : "0.00")}
          </div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <div className="font-medium mb-2">Deposits Over Time</div>
          <div className="text-sm text-gray-500 mb-2">
            Daily for last 14 days
          </div>
          <div className="h-48 overflow-hidden">
            {depSeries.length === 0 ? (
              <div className="text-xs text-gray-400">No data</div>
            ) : (
              <div className="space-y-1">
                {(() => {
                  const max = Math.max(1, ...depSeries.map((x) => x.total));
                  return depSeries.map((p) => (
                    <div
                      key={p.label}
                      className="flex items-center gap-2 text-xs"
                    >
                      <div className="w-20 text-gray-500">
                        {p.label.slice(5)}
                      </div>
                      <progress
                        className="flex-1 h-2 [&::-webkit-progress-bar]:bg-blue-100 [&::-webkit-progress-value]:bg-blue-500 rounded"
                        max={max}
                        value={p.total}
                        title={`$${p.total.toFixed(2)}`}
                      />
                      <div className="w-16 text-right">
                        ${p.total.toFixed(0)}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="font-medium mb-2">Withdrawals Over Time</div>
          <div className="text-sm text-gray-500 mb-2">
            Daily for last 14 days
          </div>
          <div className="h-48 overflow-hidden">
            {wdSeries.length === 0 ? (
              <div className="text-xs text-gray-400">No data</div>
            ) : (
              <div className="space-y-1">
                {(() => {
                  const max = Math.max(1, ...wdSeries.map((x) => x.total));
                  return wdSeries.map((p) => (
                    <div
                      key={p.label}
                      className="flex items-center gap-2 text-xs"
                    >
                      <div className="w-20 text-gray-500">
                        {p.label.slice(5)}
                      </div>
                      <progress
                        className="flex-1 h-2 [&::-webkit-progress-bar]:bg-emerald-100 [&::-webkit-progress-value]:bg-emerald-500 rounded"
                        max={max}
                        value={p.total}
                        title={`$${p.total.toFixed(2)}`}
                      />
                      <div className="w-16 text-right">
                        ${p.total.toFixed(0)}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminV2Layout>
  );
}
