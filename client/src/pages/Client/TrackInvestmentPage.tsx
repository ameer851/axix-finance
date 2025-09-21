import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getActiveInvestments,
  getInvestmentHistory,
} from "@/services/investmentService";
import { useCallback, useEffect, useState } from "react";

type AnyInvestment = Record<string, any>;

export default function TrackInvestmentPage() {
  const [queryId, setQueryId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnyInvestment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const findById = (items: AnyInvestment[], id: string) => {
    const numId = Number(id);
    return (
      items.find(
        (inv) => String(inv.id) === id || (numId && Number(inv.id) === numId)
      ) ||
      items.find(
        (inv) =>
          String(
            inv.original_investment_id ?? inv.originalInvestmentId ?? ""
          ) === id ||
          (numId &&
            Number(
              inv.original_investment_id ?? inv.originalInvestmentId ?? -1
            ) === numId)
      )
    );
  };

  // Core search routine that accepts an explicit id
  const searchById = useCallback(async (idInput: string) => {
    setError(null);
    setResult(null);
    setNotFound(false);
    const trimmed = idInput.trim();
    if (!trimmed) {
      setError("Please enter an investment ID to track.");
      return;
    }
    setLoading(true);
    try {
      const [active, history] = await Promise.all([
        getActiveInvestments(),
        getInvestmentHistory(),
      ]);
      const found =
        findById(active || [], trimmed) || findById(history || [], trimmed);
      if (!found) {
        setNotFound(true);
      } else {
        setResult(found);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to search investments.");
    } finally {
      setLoading(false);
      setHasSearched(true);
    }
  }, []);

  const handleSearch = useCallback(async () => {
    await searchById(queryId);
  }, [queryId, searchById]);

  // On mount, read ?id= from the actual URL search string and auto-search
  useEffect(() => {
    try {
      const search =
        typeof window !== "undefined" ? window.location.search : "";
      if (search) {
        const params = new URLSearchParams(search);
        const id = params.get("id") || "";
        if (id) {
          setQueryId(id);
          // kick off search immediately with explicit id
          void searchById(id);
        }
      }
    } catch {
      // ignore parse errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fmt = (n: any) => {
    const v = typeof n === "string" ? Number(n) : Number(n || 0);
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
      }).format(v);
    } catch {
      return `$${v.toFixed(2)}`;
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Track Investment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="invId">Investment ID</Label>
            <div className="flex gap-2">
              <Input
                id="invId"
                placeholder="e.g. 123 or original ID"
                value={queryId}
                onChange={(e) => setQueryId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSearch();
                }}
              />
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
            {loading && (
              <div className="text-gray-700 text-sm">
                Searching investments...
              </div>
            )}
            {error && <div className="text-red-600 text-sm">{error}</div>}
            {!loading && notFound && (
              <div className="text-gray-600 text-sm">
                No investment found with that ID. Tip: Try the original ID shown
                on the Active tab or the History record's
                original_investment_id.
              </div>
            )}
            {!loading && !hasSearched && !result && !error && (
              <div className="text-gray-600 text-sm">
                Enter an investment ID or use the “View in tracker” link from
                the Investments tables.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Investment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-500">ID</div>
                <div className="font-medium">{String(result.id)}</div>
              </div>
              {result.original_investment_id && (
                <div>
                  <div className="text-gray-500">Original Investment ID</div>
                  <div className="font-medium">
                    {String(result.original_investment_id)}
                  </div>
                </div>
              )}
              <div>
                <div className="text-gray-500">Plan</div>
                <div className="font-medium">
                  {result.plan_name ?? result.planName}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Principal</div>
                <div className="font-medium">
                  {fmt(result.principal_amount ?? result.principalAmount)}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Daily %</div>
                <div className="font-medium">
                  {String(result.daily_profit ?? result.dailyProfit)}%
                </div>
              </div>
              <div>
                <div className="text-gray-500">Status</div>
                <div className="font-medium capitalize">
                  {String(result.status || "completed")}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Start</div>
                <div className="font-medium">
                  {new Date(
                    result.start_date ?? result.startDate
                  ).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-gray-500">End</div>
                <div className="font-medium">
                  {new Date(result.end_date ?? result.endDate).toLocaleString()}
                </div>
              </div>
              {result.completed_at && (
                <div>
                  <div className="text-gray-500">Completed</div>
                  <div className="font-medium">
                    {new Date(result.completed_at).toLocaleString()}
                  </div>
                </div>
              )}
              <div>
                <div className="text-gray-500">Total Earned</div>
                <div className="font-medium">
                  {fmt(result.total_earned ?? result.totalEarned)}
                </div>
              </div>
              {result.days_elapsed != null && (
                <div>
                  <div className="text-gray-500">Days Elapsed</div>
                  <div className="font-medium">
                    {String(result.days_elapsed)}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
