import { adminService } from "@/services/adminService";
import { fetchWithAuth } from "@/services/api";
// Consolidated icon imports (removed duplicate line)
import { Activity, AlertTriangle, Clock, RefreshCcw } from "lucide-react";
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
    activeDeposits?: number;
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
  const [todayReturns, setTodayReturns] = useState<{
    sum: number;
    count: number;
    completionsCount: number;
  } | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [jobHealth, setJobHealth] = useState<any>(null);
  const [jobLoading, setJobLoading] = useState(false);
  const [jobError, setJobError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [cooldownMs, setCooldownMs] = useState<number>(0);
  const [nextRunUtc, setNextRunUtc] = useState<string | null>(null);

  // Derive cooldown based on last successful (non-dry) UTC run
  function recomputeCooldown(status: any) {
    if (!status || !status.last) {
      setCooldownMs(0);
      return;
    }
    const last = status.last;
    if (last?.meta?.dryRun) {
      setCooldownMs(0);
      return; // dry runs never lock
    }
    if (last?.success === false) {
      setCooldownMs(0);
      return; // failed run does not lock
    }
    const startedAt = last.started_at || last.startedAt || last.created_at;
    if (!startedAt) {
      setCooldownMs(0);
      return;
    }
    const started = new Date(startedAt);
    if (isNaN(started.getTime())) {
      setCooldownMs(0);
      return;
    }
    const now = new Date();
    // UTC comparison day
    const sameUtcDay =
      started.getUTCFullYear() === now.getUTCFullYear() &&
      started.getUTCMonth() === now.getUTCMonth() &&
      started.getUTCDate() === now.getUTCDate();
    if (!sameUtcDay) {
      setCooldownMs(0);
      return;
    }
    // Lock until next UTC midnight
    const nextUtcMidnight = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0,
        0,
        0,
        0
      )
    );
    const remaining = nextUtcMidnight.getTime() - now.getTime();
    setCooldownMs(remaining > 0 ? remaining : 0);
  }

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

      // Load today's returns summary
      try {
        const tr = await fetchWithAuth(`/admin/returns/today`);
        if (tr && typeof tr === "object") {
          setTodayReturns({
            sum: Number(tr.sum || 0),
            count: Number(tr.count || 0),
            completionsCount: Number(tr.completionsCount || 0),
          });
        }
      } catch (e) {
        console.error("Failed to load today's returns:", e);
      }
      // Load job status (non-blocking)
      try {
        const js = await adminService.jobs.getDailyInvestmentStatus();
        if (js?.ok) {
          setJobStatus(js);
          if (typeof js.cooldownMs === "number" && js.cooldownMs > 0) {
            setCooldownMs(js.cooldownMs);
            setNextRunUtc(js.nextRunUtc || null);
          } else {
            recomputeCooldown(js);
          }
        } else if (js && (js as any).error) {
          setJobError((js as any).error);
        }
        // Fetch job health superset
        const health = await adminService.jobs.getDailyInvestmentHealth();
        if (health?.ok) {
          setJobHealth(health);
        }
      } catch (e: any) {
        setJobError(e.message);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function refreshJobStatus() {
    setJobLoading(true);
    setJobError(null);
    try {
      const js = await adminService.jobs.getDailyInvestmentStatus();
      if (js?.ok) {
        setJobStatus(js);
        if (typeof js.cooldownMs === "number" && js.cooldownMs > 0) {
          setCooldownMs(js.cooldownMs);
          setNextRunUtc(js.nextRunUtc || null);
        } else {
          recomputeCooldown(js);
        }
      } else if (js && (js as any).error) {
        setJobError((js as any).error);
      }
      const health = await adminService.jobs.getDailyInvestmentHealth();
      if (health?.ok) setJobHealth(health);
    } catch (e: any) {
      setJobError(e.message);
    } finally {
      setJobLoading(false);
    }
  }

  async function triggerJob(dryRun: boolean) {
    setTriggering(true);
    try {
      // Manual daily investment job trigger removed: now handled by automated cron worker
      // Refresh job status first so cooldown updates quickly
      await refreshJobStatus();
      // Refresh broader dashboard metrics
      await load();
    } catch (e: any) {
      alert("Trigger failed: " + (e.message || e));
    } finally {
      setTriggering(false);
    }
  }

  // Countdown interval
  useEffect(() => {
    if (cooldownMs <= 0) return;
    const id = setInterval(() => {
      setCooldownMs((prev) => (prev > 1000 ? prev - 1000 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [cooldownMs]);

  const runLocked = cooldownMs > 0;
  function formatMs(ms: number) {
    if (ms <= 0) return "00:00:00";
    const totalSec = Math.floor(ms / 1000);
    const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
    const s = String(totalSec % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
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
        {/* Daily Investment Job Status */}
        <div className="p-4 bg-white rounded shadow md:col-span-3">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <div className="text-gray-500 text-sm flex items-center gap-2">
                Daily Investment Job Status
                {jobStatus?.stale && (
                  <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                    <AlertTriangle className="h-3 w-3" /> Stale
                  </span>
                )}
              </div>
              {jobError && (
                <div className="text-xs text-red-600">{jobError}</div>
              )}
              <div className="text-sm text-gray-700">
                {jobStatus?.last ? (
                  <>
                    <span className="font-mono">
                      {new Date(jobStatus.last.started_at).toISOString()}
                    </span>{" "}
                    → Processed {jobStatus.last.processed_count} • Completed{" "}
                    {jobStatus.last.completed_count} • Total $
                    {Number(jobStatus.last.total_applied || 0).toFixed(2)}
                  </>
                ) : jobLoading ? (
                  "Loading..."
                ) : (
                  "No runs recorded"
                )}
              </div>
              {jobHealth?.ok && jobHealth?.stats && (
                <div className="mt-2 text-[11px] text-gray-600 flex flex-wrap gap-4">
                  <div>
                    Success Rate:{" "}
                    <span
                      className={
                        jobHealth.stats.successRate < 0.9
                          ? "text-amber-600"
                          : "text-emerald-600"
                      }
                    >
                      {(jobHealth.stats.successRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>Avg Processed: {jobHealth.stats.avgProcessed}</div>
                  <div>Avg Completed: {jobHealth.stats.avgCompleted}</div>
                  <div>Window: {jobHealth.stats.window}</div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => refreshJobStatus()}
                disabled={jobLoading}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-1"
              >
                <RefreshCcw className="h-3 w-3" /> Refresh
              </button>
              <div className="flex items-center gap-1 text-[10px] font-mono text-gray-500 px-2 py-1 border rounded">
                <Clock className="h-3 w-3" />
                {runLocked ? (
                  <span>Next run in {formatMs(cooldownMs)}</span>
                ) : (
                  <span>Ready</span>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Today's Returns Summary */}
        <div className="p-4 bg-white rounded shadow md:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-gray-500 text-sm">Today's Returns (UTC)</div>
              <div className="text-2xl font-semibold">
                $
                {todayReturns
                  ? todayReturns.sum.toFixed(2)
                  : loading
                    ? "…"
                    : "0.00"}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {todayReturns ? todayReturns.count : 0} rows •{" "}
                {todayReturns ? todayReturns.completionsCount : 0} completions
              </div>
            </div>
            <Activity className="h-6 w-6 text-emerald-600" />
          </div>
        </div>
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
          <div className="text-gray-500 text-sm">Active Deposits (Locked)</div>
          <div className="text-2xl font-semibold">
            $
            {summary?.transactions.activeDeposits?.toFixed?.(2) ??
              (loading ? "…" : "0.00")}
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
