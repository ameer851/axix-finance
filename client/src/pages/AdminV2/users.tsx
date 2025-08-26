import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { fetchWithAuth } from "@/services/api";
import { MoreHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AdminV2Layout from "./layout";

interface UserRow {
  id: number;
  email: string;
  role?: string;
  username?: string | null;
}

export default function UsersPageV2() {
  const { user: currentUser } = useAuth();
  const [data, setData] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (search.trim()) params.set("search", search.trim());
      if (status && status !== "all") params.set("status", status);
      const json = await fetchWithAuth(`/admin/users?${params}`);
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

  // Trigger new search when the user presses Enter or clicks Search
  const canSearch = useMemo(() => !loading, [loading]);

  function onSearchSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setPage(1);
    load();
  }

  async function onDeleteUser(id: number) {
    if (
      !confirm("Delete this user? This may deactivate if linked records exist.")
    )
      return;
    try {
      setLoading(true);
      await fetchWithAuth(`/admin/users/${id}`, { method: "DELETE" });
      await load();
    } catch (e: any) {
      alert(e.message || "Failed to delete user");
    } finally {
      setLoading(false);
    }
  }

  async function onPromote(id: number) {
    try {
      setLoading(true);
      await fetchWithAuth(`/admin/admins/${id}/promote`, {
        method: "POST",
      });
      await load();
    } catch (e: any) {
      alert(e.message || "Failed to promote user");
    } finally {
      setLoading(false);
    }
  }

  async function onDemote(id: number) {
    try {
      setLoading(true);
      await fetchWithAuth(`/admin/admins/${id}/demote`, { method: "POST" });
      await load();
    } catch (e: any) {
      alert(e.message || "Failed to demote admin");
    } finally {
      setLoading(false);
    }
  }

  async function onSetPassword(id: number) {
    const pwd = prompt("Enter new password (min 6 chars)");
    if (!pwd) return;
    try {
      setLoading(true);
      await fetchWithAuth(`/admin/admins/${id}/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });
      alert("Password updated");
    } catch (e: any) {
      alert(e.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  }

  // Determine if a given row is the owner account
  function isOwnerUser(u: UserRow): boolean {
    const env: any = (import.meta as any).env || {};
    const ownerEmail = env?.VITE_OWNER_EMAIL as string | undefined;
    const ownerId = env?.VITE_OWNER_USER_ID as string | undefined;
    const rowIsOwnerFlag = (u as any)?.isOwner === true;
    const byEmail =
      ownerEmail &&
      u.email &&
      String(u.email).toLowerCase() === String(ownerEmail).toLowerCase();
    const byId = ownerId && String(u.id) === String(ownerId);
    return !!(rowIsOwnerFlag || byEmail || byId);
  }

  return (
    <AdminV2Layout>
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <h2 className="text-xl font-semibold">Users</h2>
        <form onSubmit={onSearchSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email, username, name"
            className="border rounded px-2 py-1 text-sm w-64"
          />
          <select
            className="border rounded px-2 py-1 text-sm"
            value={status}
            aria-label="Filter by status"
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
          <button
            type="submit"
            className="text-sm px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
            disabled={!canSearch}
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatus("all");
              setPage(1);
              load();
            }}
            className="text-sm px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
            disabled={loading}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={load}
            className="text-sm px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
            disabled={loading}
          >
            Reload
          </button>
        </form>
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
                        {/* Promote / Demote */}
                        {u.role === "admin" ? (
                          // Hide demote for owner account (always hidden for owner)
                          isOwnerUser(u) ? null : (
                            <DropdownMenuItem
                              onClick={() => onDemote(u.id)}
                              disabled={loading}
                            >
                              Demote to user
                            </DropdownMenuItem>
                          )
                        ) : (
                          <DropdownMenuItem
                            onClick={() => onPromote(u.id)}
                            disabled={loading}
                          >
                            Promote to admin
                          </DropdownMenuItem>
                        )}

                        {/* Set password (owner or self if admin, server enforces) */}
                        <DropdownMenuItem
                          onClick={() => onSetPassword(u.id)}
                          disabled={loading}
                        >
                          Set password
                        </DropdownMenuItem>

                        {/* Delete (not for admins and not self) */}
                        {u.role !== "admin" &&
                          u.id !== (currentUser?.id || -1) && (
                            <DropdownMenuItem
                              onClick={() => onDeleteUser(u.id)}
                              disabled={loading}
                            >
                              Delete user
                            </DropdownMenuItem>
                          )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
