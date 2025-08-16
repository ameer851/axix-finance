import { useToast } from "@/hooks/use-toast";
import { fetchWithAuth } from "@/services/api";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import AdminV2Layout from "./layout";

interface TxRow {
  id: number;
  userId: number;
  type: string;
  status: string;
  amount: string | number;
  createdAt?: string;
}

export default function DepositsPageV2() {
  const [rows, setRows] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const json = await fetchWithAuth(
        `/api/admin/transactions?page=${page}&limit=20&type=deposit`
      );
      setRows(json.data || []);
      setTotalPages(json.pagination?.totalPages || 1);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [page]);

  async function approve(id: number) {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`/api/admin/deposits/${id}/approve`, {
        method: "POST",
      });
      if (res && res.emailSent === false) {
        console.warn(
          "Deposit approved but email may not have been sent. Check email configuration."
        );
        toast({
          title: "Email not sent",
          description:
            "Deposit approved, but the confirmation email couldn't be sent. Please check email settings.",
          variant: "destructive" as any,
        });
      }
      // If server returned the newBalance, update the userBalance cache for the affected user
      const newBalance = res?.data?.newBalance ?? res?.newBalance ?? null;
      const affectedUserId =
        res?.data?.userId ||
        res?.data?.user_id ||
        (rows.find((r) => r.id === id)?.userId ?? null) ||
        res?.transaction?.userId;
      if (newBalance != null && affectedUserId) {
        // write the new balance into the react-query cache for "userBalance"
        queryClient.setQueryData(
          ["userBalance", affectedUserId],
          () =>
            ({
              availableBalance: newBalance,
              totalBalance: newBalance,
            }) as any
        );
        toast({
          title: "Deposit approved",
          description: `Balance updated to ${newBalance}`,
        });
      } else {
        // fallback: reload list and invalidate user balance queries
        if (affectedUserId) {
          queryClient.invalidateQueries({
            queryKey: ["userBalance", affectedUserId],
          });
        } else {
          queryClient.invalidateQueries({ queryKey: ["userBalance"] });
        }
      }
      await load();
    } catch (e: any) {
      alert(e.message || "Failed to approve");
    } finally {
      setLoading(false);
    }
  }

  async function rejectTx(id: number) {
    const reason = prompt("Optional rejection reason:") || undefined;
    try {
      setLoading(true);
      await fetchWithAuth(`/api/admin/deposits/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      await load();
    } catch (e: any) {
      alert(e.message || "Failed to reject");
    } finally {
      setLoading(false);
    }
  }

  async function deleteTx(id: number) {
    if (!confirm("Delete this completed deposit? This cannot be undone.")) {
      return;
    }
    try {
      setLoading(true);
      await fetchWithAuth(`/api/admin/deposits/${id}`, { method: "DELETE" });
      await load();
    } catch (e: any) {
      alert(e.message || "Failed to delete deposit");
    } finally {
      setLoading(false);
    }
  }
  return (
    <AdminV2Layout>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Deposits</h2>
        <button
          onClick={load}
          disabled={loading}
          className="text-sm px-3 py-1 bg-blue-600 text-white rounded"
        >
          Reload
        </button>
      </div>
      {error && <div className="text-red-600 mb-2 text-sm">Error: {error}</div>}
      <div className="border rounded bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">User</th>
              <th className="p-2">Amount</th>
              <th className="p-2">Status</th>
              <th className="p-2">Type</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="p-4 text-center" colSpan={6}>
                  Loading...
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">{r.id}</td>
                  <td className="p-2">{r.userId}</td>
                  <td className="p-2">{r.amount}</td>
                  <td className="p-2">{r.status}</td>
                  <td className="p-2">{r.type}</td>
                  <td className="p-2 space-x-2">
                    {(() => {
                      const s = (r.status || "").toLowerCase();
                      if (["completed", "approved"].includes(s)) {
                        return (
                          <button
                            onClick={() => deleteTx(r.id)}
                            className="px-2 py-1 text-xs bg-gray-700 text-white rounded disabled:opacity-50"
                            disabled={loading}
                            title="Delete deposit"
                          >
                            🗑️ Delete
                          </button>
                        );
                      }
                      if (["rejected"].includes(s)) {
                        return (
                          <span className="text-gray-400 text-xs">
                            No actions
                          </span>
                        );
                      }
                      return (
                        <>
                          <button
                            onClick={() => approve(r.id)}
                            className="px-2 py-1 text-xs bg-green-600 text-white rounded disabled:opacity-50"
                            disabled={loading}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectTx(r.id)}
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded disabled:opacity-50"
                            disabled={loading}
                          >
                            Reject
                          </button>
                        </>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  No deposits
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
