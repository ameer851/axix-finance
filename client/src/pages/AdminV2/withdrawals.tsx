import { useEffect, useState } from "react";
import AdminV2Layout from "./layout";

interface TxRow {
  id: number;
  userId: number;
  type: string;
  status: string;
  amount: string | number;
}

export default function WithdrawalsPageV2() {
  const [rows, setRows] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/transactions?page=${page}&limit=20&type=withdrawal`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error(String(res.status));
      const json = await res.json();
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
  return (
    <AdminV2Layout>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Withdrawals</h2>
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
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="p-4 text-center" colSpan={5}>
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
                </tr>
              ))}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No withdrawals
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
