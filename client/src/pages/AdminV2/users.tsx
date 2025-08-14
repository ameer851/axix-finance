import { fetchWithAuth } from "@/services/api";
import { useEffect, useState } from "react";
import AdminV2Layout from "./layout";

interface UserRow {
  id: number;
  email: string;
  role?: string;
  username?: string | null;
}

export default function UsersPageV2() {
  const [data, setData] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const json = await fetchWithAuth(
        `/api/admin/users?page=${page}&limit=20`
      );
      setData(json.data || []);
      setTotalPages(json.pagination?.totalPages || 1);
    } catch (e: any) {
      setError(e.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page]);

  async function onDeleteUser(id: number) {
    if (
      !confirm("Delete this user? This may deactivate if linked records exist.")
    )
      return;
    try {
      setLoading(true);
      await fetchWithAuth(`/api/admin/users/${id}`, { method: "DELETE" });
      await load();
    } catch (e: any) {
      alert(e.message || "Failed to delete user");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminV2Layout>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Users</h2>
        <button
          onClick={load}
          className="text-sm px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
          disabled={loading}
        >
          Reload
        </button>
      </div>
      {error && <div className="text-red-600 text-sm mb-2">Error: {error}</div>}
      <div className="border rounded bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">Email</th>
              <th className="p-2">Role</th>
              <th className="p-2">Username</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="p-4 text-center">
                  Loading...
                </td>
              </tr>
            )}
            {!loading &&
              data.map((u) => (
                <tr key={u.id} className="border-t hover:bg-gray-50">
                  <td className="p-2">{u.id}</td>
                  <td className="p-2">{u.email}</td>
                  <td className="p-2">{u.role || "user"}</td>
                  <td className="p-2">{u.username || "-"}</td>
                  <td className="p-2">
                    <button
                      onClick={() => onDeleteUser(u.id)}
                      className="px-2 py-1 text-xs bg-red-600 text-white rounded disabled:opacity-50"
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  No users
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
