import AdminFilters, { F  // Guard/mapper for API responses
function toMinimalUser(raw: any): MinimalUser {
  try {
    if (!raw || typeof raw !== "object")
      throw new Error("Invalid user object from API");
    if (!raw.id || !raw.email)
      throw new Error("User object missing required fields: id or email");

    // Safely convert values to their expected types
    const user: MinimalUser = {
      id: String(raw.id || ""),
      email: String(raw.email || ""),
      username: raw.username ? String(raw.username) : null,
      firstName: raw.firstName ? String(raw.firstName) : null,
      lastName: raw.lastName ? String(raw.lastName) : null,
      role: raw.role === "admin" ? "admin" : "user",
      balance: raw.balance ? String(raw.balance) : null,
      isVerified: Boolean(raw.isVerified),
      isActive: Boolean(raw.isActive),
      createdAt: raw.createdAt ? String(raw.createdAt) : null,
      updatedAt: raw.updatedAt ? String(raw.updatedAt) : null,
    };
    
    return user;
  } catch (error) {
    console.error("Error parsing user data:", error, "Raw data:", raw);
    // Return a minimal valid user object to prevent UI crashes
    return {
      id: String(raw.id || "unknown"),
      email: String(raw.email || "invalid@email"),
      isVerified: false,
      isActive: false,
      role: "user"
    };
  }@/components/AdminFilters";
import BulkActions, { createUserBulkActions } from "@/components/BulkActions";
import { useAdminActions, useAdminData } from "@/hooks/use-admin-data";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { exportUsers } from "@/utils/exportUtils";
import { useState } from "react";
import { useForm } from "react-hook-form";

// Minimal user type, only guaranteed fields
interface MinimalUser {
  id: string;
  email: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role?: "user" | "admin";
  balance?: string | null;
  isVerified?: boolean;
  isActive?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

// Guard/mapper for API responses
function toMinimalUser(raw: any): MinimalUser {
  try {
    if (!raw || typeof raw !== "object") {
      throw new Error("Invalid user object from API");
    }
    
    return {
      id: String(raw.id || "unknown"),
      email: String(raw.email || "invalid@email"),
      username: raw.username ? String(raw.username) : null,
      firstName: raw.firstName ? String(raw.firstName) : null,
      lastName: raw.lastName ? String(raw.lastName) : null,
      role: raw.role === "admin" ? "admin" : "user",
      balance: raw.balance ? String(raw.balance) : null,
      isVerified: Boolean(raw.isVerified),
      isActive: Boolean(raw.isActive),
      createdAt: raw.createdAt ? String(raw.createdAt) : null,
      updatedAt: raw.updatedAt ? String(raw.updatedAt) : null
    };
  } catch (error) {
    console.error("Error parsing user data:", error, "Raw data:", raw);
    return {
      id: String(raw.id || "unknown"),
      email: String(raw.email || "invalid@email"),
      isVerified: false,
      isActive: false,
      role: "user"
    };
  }
}

interface UserFormData {
  email: string;
  firstName: string;
  lastName: string;
  role: "user" | "admin";
  isActive: boolean;
  isVerified: boolean;
}

// Remove UsersResponse, not needed with MinimalUser and hook

export default function AdminUsers() {
  const [editingUser, setEditingUser] = useState<MinimalUser | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const { toast } = useToast();

  // Use hook to fetch users
  const {
    data: users,
    loading,
    currentPage,
    totalPages,
    totalItems,
    setPage,
    setFilters,
    refresh,
  } = useAdminData<MinimalUser>({
    endpoint: "/api/admin/users",
    transform: (data) =>
      Array.isArray(data.users) ? data.users.map(toMinimalUser) : [],
  });

  // All user and pagination state is managed by useAdminData and its provided setters.

  const { executeAction, loading: actionLoading } = useAdminActions(
    "/api/admin/users",
    {
      onSuccess: refresh,
    }
  );
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UserFormData>();

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  // Handle export functionality
  const handleExport = (format: "csv" | "pdf") => {
    const exportData =
      selectedUsers.length > 0
        ? users.filter((user) => selectedUsers.includes(user.id.toString()))
        : users;

    exportUsers(exportData, format);

    toast({
      title: "Export Started",
      description: `Exporting ${exportData.length} users to ${format.toUpperCase()}...`,
    });
  };

  // Bulk action handlers
  const handleBulkApprove = async (userIds: string[]) => {
    try {
      const response = await apiRequest(
        "POST",
        "/api/admin/users/bulk-approve",
        {
          userIds: userIds,
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: `${userIds.length} users approved successfully`,
        });
        refresh();
      }
    } catch (error) {
      console.error("Bulk approve error:", error);
      toast({
        title: "Error",
        description: "Failed to approve users",
        variant: "destructive",
      });
    }
  };

  const handleBulkSuspend = async (userIds: string[]) => {
    try {
      const response = await apiRequest(
        "POST",
        "/api/admin/users/bulk-suspend",
        {
          userIds: userIds,
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: `${userIds.length} users suspended successfully`,
        });
        refresh();
      }
    } catch (error) {
      console.error("Bulk suspend error:", error);
      toast({
        title: "Error",
        description: "Failed to suspend users",
        variant: "destructive",
      });
    }
  };

  const handleBulkDelete = async (userIds: string[]) => {
    try {
      const response = await apiRequest(
        "DELETE",
        "/api/admin/users/bulk-delete",
        {
          userIds: userIds,
        }
      );

      if (response.ok) {
        toast({
          title: "Success",
          description: `${userIds.length} users deleted successfully`,
        });
        refresh();
      }
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete users",
        variant: "destructive",
      });
    }
  };

  const handleBulkExport = async (userIds: string[]) => {
    const exportData = users.filter((user) =>
      userIds.includes(user.id.toString())
    );
    exportUsers(exportData, "csv");

    toast({
      title: "Export Started",
      description: `Exporting ${exportData.length} selected users...`,
    });
  };

  const handleCleanupDeletedUsers = async () => {
    if (
      !confirm(
        "Are you sure you want to permanently delete all inactive deleted users? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await apiRequest(
        "POST",
        "/api/admin/users/cleanup-deleted"
      );
      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
        refresh();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Cleanup error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to cleanup deleted users",
        variant: "destructive",
      });
    }
  };

  // Create bulk actions
  const bulkActions = createUserBulkActions(
    handleBulkApprove,
    handleBulkSuspend,
    handleBulkDelete,
    handleBulkExport
  );

  // User selection handlers
  const handleSelectUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((user) => user.id.toString()));
    }
  };

  // Calculate selection state for header checkbox
  const isAllSelected =
    selectedUsers.length === users.length && users.length > 0;
  const isIndeterminate =
    selectedUsers.length > 0 && selectedUsers.length < users.length;

  const handleEditUser = (user: MinimalUser) => {
    setEditingUser(user);
    setValue("email", user.email);
    setValue("firstName", user.firstName ?? "");
    setValue("lastName", user.lastName ?? "");
    setValue("role", user.role ?? "user");
    setValue("isActive", user.isActive ?? false);
    setValue("isVerified", user.isVerified ?? false);
  };

  const handleUpdateUser = async (data: UserFormData) => {
    if (!editingUser) return;
    try {
      const response = await apiRequest(
        "PUT",
        `/api/admin/users/${editingUser.id}`,
        data
      );
      const updatedRaw = await response.json();
      const updatedUser = toMinimalUser(updatedRaw);
      refresh(); // Refetch users after update
      setEditingUser(null);
      reset();
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    } catch (error) {
      console.error("Failed to update user:", error);
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
      refresh(); // Refetch users after delete
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (user: MinimalUser) => {
    if (!user.isActive) return "bg-red-100 text-red-800";
    if (!user.isVerified) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getStatusText = (user: MinimalUser) => {
    if (!user.isActive) return "Inactive";
    if (!user.isVerified) return "Unverified";
    return "Active";
  };

  // Responsive table wrapper
  const TableWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5">
          {children}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="animate-pulse p-4">
        <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
        <div className="bg-white shadow rounded-lg">
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-4 bg-gray-300 rounded flex-1"></div>
                <div className="h-4 bg-gray-300 rounded w-20"></div>
                <div className="h-4 bg-gray-300 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <div className="text-sm text-gray-600">Total Users: {totalItems}</div>
      </div>

      {/* Advanced Filters */}
      <AdminFilters
        onFilterChange={handleFilterChange}
        onExport={handleExport}
        onCleanupDeleted={handleCleanupDeletedUsers}
        showExport={true}
        filterOptions={{
          showDateRange: true,
          showAmountRange: false,
          showStatus: true,
          showPaymentMethod: false,
          showUserSearch: true,
          customStatuses: ["active", "inactive", "verified", "unverified"],
        }}
      />

      {/* Bulk Actions */}
      <BulkActions
        selectedItems={selectedUsers}
        onClearSelection={() => setSelectedUsers([])}
        actions={bulkActions}
        totalItems={users.length}
      />

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  title="Select all users"
                  aria-label="Select all users"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Balance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleSelectUser(user.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    title={`Select user ${user.firstName ?? ""} ${user.lastName ?? ""}`}
                    aria-label={`Select user ${user.firstName ?? ""} ${user.lastName ?? ""}`}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.firstName ?? ""} {user.lastName ?? ""}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    <div className="text-xs text-gray-400">
                      @{user.username ?? ""}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(user)}`}
                  >
                    {getStatusText(user)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === "admin"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {user.role ?? "user"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  $
                  {user.balance
                    ? parseFloat(user.balance).toLocaleString()
                    : "0"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : ""}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500">No users found</div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="flex space-x-2">
            <button
              onClick={() => setPage(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (page) =>
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 2
              )
              .map((page, idx, arr) => (
                <span key={page}>
                  {idx > 0 && arr[idx - 1] !== page - 1 && (
                    <span className="px-3 py-2 text-sm text-gray-500">...</span>
                  )}
                  <button
                    onClick={() => setPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      page === currentPage
                        ? "text-white bg-indigo-600"
                        : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                </span>
              ))}

            <button
              onClick={() => setPage(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Edit User
              </h3>
              <form
                onSubmit={handleSubmit(handleUpdateUser)}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    {...register("email", { required: "Email is required" })}
                    type="email"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    {...register("firstName", {
                      required: "First name is required",
                    })}
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    {...register("lastName", {
                      required: "Last name is required",
                    })}
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <select
                    {...register("role", { required: "Role is required" })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  {errors.role && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.role.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      {...register("isActive")}
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Account Active
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      {...register("isVerified")}
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Email Verified
                    </span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingUser(null);
                      reset();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    Update User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
