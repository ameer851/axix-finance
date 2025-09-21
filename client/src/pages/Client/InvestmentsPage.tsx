import {
  getActiveInvestments,
  getInvestmentHistory,
} from "@/services/investmentService";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { Link } from "wouter";

function formatCurrency(n: number | string) {
  const v = typeof n === "string" ? Number(n) : n;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(v || 0);
  } catch {
    return `$${(v || 0).toFixed(2)}`;
  }
}

type Tab = "active" | "history";

interface InvestmentsPageProps {
  initialTab?: Tab;
}

const InvestmentsPage: React.FC<InvestmentsPageProps> = ({
  initialTab = "active",
}) => {
  const [tab, setTab] = React.useState<Tab>(initialTab);
  const activeQ = useQuery({
    queryKey: ["investments", "active"],
    queryFn: getActiveInvestments,
  });
  const historyQ = useQuery({
    queryKey: ["investments", "history"],
    queryFn: getInvestmentHistory,
  });

  const isLoading = tab === "active" ? activeQ.isLoading : historyQ.isLoading;

  // Filters & pagination for history tab
  const [filter, setFilter] = React.useState("");
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  const baseItems = tab === "active" ? activeQ.data || [] : historyQ.data || [];
  const filteredItems = React.useMemo(() => {
    if (tab !== "history") return baseItems;
    const f = filter.trim().toLowerCase();
    if (!f) return baseItems;
    return baseItems.filter((inv: any) => {
      const id = String(inv.id || "");
      const oid = String(inv.original_investment_id ?? "");
      const plan = String(inv.plan_name ?? inv.planName ?? "").toLowerCase();
      return id.includes(f) || oid.includes(f) || plan.includes(f);
    });
  }, [baseItems, filter, tab]);

  const pagedItems = React.useMemo(() => {
    if (tab !== "history") return baseItems;
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, baseItems, page, tab]);

  React.useEffect(() => {
    // Reset pagination when switching tabs or filter changes
    setPage(1);
  }, [tab, filter]);

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Investments</h1>
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <button
          className={`px-3 py-1 rounded border ${tab === "active" ? "bg-black text-white" : "bg-white"}`}
          onClick={() => setTab("active")}
        >
          Active
        </button>
        <button
          className={`px-3 py-1 rounded border ${tab === "history" ? "bg-black text-white" : "bg-white"}`}
          onClick={() => setTab("history")}
        >
          History
        </button>
        {tab === "history" && (
          <div className="ml-auto flex items-center gap-2">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by ID or Plan"
              className="px-3 py-1 border rounded text-sm"
            />
          </div>
        )}
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : (
          tab === "history"
            ? filteredItems.length === 0
            : (baseItems || []).length === 0
        ) ? (
        <div className="text-gray-600">No {tab} investments.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">ID</th>
                <th className="py-2 pr-4">Plan</th>
                <th className="py-2 pr-4">Principal</th>
                <th className="py-2 pr-4">Daily %</th>
                <th className="py-2 pr-4">Duration</th>
                <th className="py-2 pr-4">Total Earned</th>
                <th className="py-2 pr-4">Start</th>
                <th className="py-2 pr-4">End</th>
                {tab === "active" ? (
                  <th className="py-2 pr-4">Days</th>
                ) : (
                  <th className="py-2 pr-4">Completed</th>
                )}
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(tab === "history" ? pagedItems : baseItems).map((inv: any) => {
                const principal = inv.principal_amount ?? inv.principalAmount;
                const daily = inv.daily_profit ?? inv.dailyProfit;
                const duration =
                  inv.duration ?? inv.plan_duration ?? inv.planDuration;
                const totalEarned = inv.total_earned ?? inv.totalEarned;
                const days = inv.days_elapsed ?? inv.daysElapsed;
                const trackId =
                  inv.original_investment_id ??
                  inv.originalInvestmentId ??
                  inv.id;
                return (
                  <tr key={inv.id} className="border-b">
                    <td className="py-2 pr-4">{String(inv.id)}</td>
                    <td className="py-2 pr-4">
                      {inv.plan_name ?? inv.planName}
                    </td>
                    <td className="py-2 pr-4">{formatCurrency(principal)}</td>
                    <td className="py-2 pr-4">{daily}%</td>
                    <td className="py-2 pr-4">{duration} days</td>
                    <td className="py-2 pr-4">{formatCurrency(totalEarned)}</td>
                    <td className="py-2 pr-4">
                      {new Date(
                        inv.start_date ?? inv.startDate
                      ).toLocaleDateString()}
                    </td>
                    <td className="py-2 pr-4">
                      {new Date(
                        inv.end_date ?? inv.endDate
                      ).toLocaleDateString()}
                    </td>
                    {tab === "active" ? (
                      <td className="py-2 pr-4">{days}</td>
                    ) : (
                      <td className="py-2 pr-4">
                        {new Date(
                          inv.completed_at ??
                            inv.updatedAt ??
                            inv.end_date ??
                            inv.endDate
                        ).toLocaleDateString()}
                      </td>
                    )}
                    <td className="py-2 pr-4">
                      <Link
                        href={`/track-investment?id=${encodeURIComponent(String(trackId))}`}
                      >
                        <span className="text-blue-600 hover:underline cursor-pointer">
                          View in tracker
                        </span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === "history" && filteredItems.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {page} of{" "}
            {Math.max(1, Math.ceil(filteredItems.length / pageSize))}
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </button>
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() =>
                setPage((p) =>
                  p * pageSize < filteredItems.length ? p + 1 : p
                )
              }
              disabled={page * pageSize >= filteredItems.length}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentsPage;
