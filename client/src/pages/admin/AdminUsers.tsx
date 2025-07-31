import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminFilters, { FilterState } from "@/components/AdminFilters";
import BulkActions, { createUserBulkActions } from "@/components/BulkActions";
import { exportUsers } from "@/utils/exportUtils";

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "user" | "admin";
  balance: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserFormData {
  email: string;
  firstName: string;
  lastName: string;
  role: "user" | "admin";
  isActive: boolean;
  isVerified: boolean;
}

interface FundingFormData {
  amount: number;
  description?: string;
}



interface UsersResponse {
  users: User[];
  totalPages: number;
  currentPage: number;
  totalUsers: number;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({});
  const [fundingUser, setFundingUser] = useState<User | null>(null);
  const { toast } = useToast();
  
  const {
    register: registerFunding,
    handleSubmit: handleSubmitFunding,
    formState: { errors: fundingErrors },
    reset: resetFunding
  } = useForm<FundingFormData>();

  const onSubmitFunding = async (data: FundingFormData) => {
    if (!fundingUser) return;
    try {
      await apiRequest("POST", `/api/admin/users/${fundingUser.id}/fund`, data);
      toast({
        title: "Success",
        description: `Successfully funded ${fundingUser.username}'s account with $${data.amount}`,
      });
      setFundingUser(null);
      resetFunding();
      fetchUsers(); // Refresh the users list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fund user account",
        variant: "destructive",
      });
    }
  };
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<UserFormData>();
  // Fetch users from API with advanced filtering
  const fetchUsers = async (page = 1, appliedFilters: FilterState = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10"
      });

      // Add filter parameters
      if (appliedFilters.search) params.set('search', appliedFilters.search);
      if (appliedFilters.dateFrom) params.set('dateFrom', appliedFilters.dateFrom);
      if (appliedFilters.dateTo) params.set('dateTo', appliedFilters.dateTo);
      if (appliedFilters.status) params.set('status', appliedFilters.status);
      if (appliedFilters.amountMin) params.set('amountMin', appliedFilters.amountMin.toString());
      if (appliedFilters.amountMax) params.set('amountMax', appliedFilters.amountMax.toString());

      const response = await apiRequest("GET", `/api/admin/users?${params}`);
      const data = await response.json() as UsersResponse;
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
      setTotalUsers(data.totalUsers);
      setSelectedUsers([]); // Clear selection when data changes
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchUsers(currentPage, filters);
  }, [currentPage, filters]);

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle export functionality
  const handleExport = (format: 'csv' | 'pdf') => {
    const exportData = selectedUsers.length > 0 
      ? users.filter(user => selectedUsers.includes(user.id.toString()))
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
      const response = await apiRequest("POST", "/api/admin/users/bulk-approve", {
        userIds: userIds
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `${userIds.length} users approved successfully`,
        });
        fetchUsers(currentPage, filters);
      }
    } catch (error) {
      console.error("Bulk approve error:", error);
      toast({
        title: "Error",
        description: "Failed to approve users",
        variant: "destructive"
      });
    }
  };

  const handleBulkSuspend = async (userIds: string[]) => {
    try {
      const response = await apiRequest("POST", "/api/admin/users/bulk-suspend", {
        userIds: userIds
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `${userIds.length} users suspended successfully`,
        });
        fetchUsers(currentPage, filters);
      }
    } catch (error) {
      console.error("Bulk suspend error:", error);
      toast({
        title: "Error",
        description: "Failed to suspend users",
        variant: "destructive"
      });
    }
  };

  const handleBulkDelete = async (userIds: string[]) => {
    try {
      const response = await apiRequest("DELETE", "/api/admin/users/bulk-delete", {
        userIds: userIds
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `${userIds.length} users deleted successfully`,
        });
        fetchUsers(currentPage, filters);
      }
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete users",
        variant: "destructive"
      });
    }
  };

  const handleBulkExport = async (userIds: string[]) => {
    const exportData = users.filter(user => userIds.includes(user.id.toString()));
    exportUsers(exportData, 'csv');
    
    toast({
      title: "Export Started",
      description: `Exporting ${exportData.length} selected users...`,
    });
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
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };
  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id.toString()));
    }
  };

  // Calculate selection state for header checkbox
  const isAllSelected = selectedUsers.length === users.length && users.length > 0;
  const isIndeterminate = selectedUsers.length > 0 && selectedUsers.length < users.length;

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setValue("email", user.email);
    setValue("firstName", user.firstName);
    setValue("lastName", user.lastName);
    setValue("role", user.role);
    setValue("isActive", user.isActive);
    setValue("isVerified", user.isVerified);
  };

  const handleUpdateUser = async (data: UserFormData) => {
    if (!editingUser) return;
    
    try {      const response = await apiRequest("PUT", `/api/admin/users/${editingUser.id}`, data);
      const updatedUser = await response.json() as User;
      setUsers(prev => prev.map(user => 
        user.id === editingUser.id ? updatedUser : user
      ));
      setEditingUser(null);
      reset();
      toast({
        title: "Success",
        description: "User updated successfully"
      });    } catch (error) {
      console.error("Failed to update user:", error);
      toast({
        title: "Error",
        description: "Failed to update user. Please try again.",
        variant: "destructive"
      });
    }
  };



  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }
    
    try {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
      setUsers(prev => prev.filter(user => user.id !== userId));
      toast({
        title: "Success",
        description: "User deleted successfully"
      });
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (user: User) => {
    if (!user.isActive) return "bg-red-100 text-red-800";
    if (!user.isVerified) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getStatusText = (user: User) => {
    if (!user.isActive) return "Inactive";
    if (!user.isVerified) return "Unverified";
    return "Active";
  };

  if (loading) {
    return (
      <div className="animate-pulse">
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
        <div className="text-sm text-gray-600">
          Total Users: {totalUsers}
        </div>
      </div>

      {/* Advanced Filters */}
      <AdminFilters
        onFilterChange={handleFilterChange}
        onExport={handleExport}
        filterOptions={{
          showDateRange: true,
          showAmountRange: true,
          showStatus: true,
          showPaymentMethod: false,
          showUserSearch: true,
          customStatuses: ['active', 'inactive', 'verified', 'unverified', 'suspended']
        }}
      />

      {/* Bulk Actions */}      <BulkActions
        selectedItems={selectedUsers}
        onClearSelection={() => setSelectedUsers([])}
        actions={bulkActions}
        totalItems={users.length}
      />{/* Users Table */}
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
                    checked={selectedUsers.includes(user.id.toString())}
                    onChange={() => handleSelectUser(user.id.toString())}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    title={`Select user ${user.firstName} ${user.lastName}`}
                    aria-label={`Select user ${user.firstName} ${user.lastName}`}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    <div className="text-xs text-gray-400">@{user.username}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(user)}`}>
                    {getStatusText(user)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${parseFloat(user.balance).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
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
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2)
              .map((page, idx, arr) => (
                <span key={page}>
                  {idx > 0 && arr[idx - 1] !== page - 1 && (
                    <span className="px-3 py-2 text-sm text-gray-500">...</span>
                  )}
                  <button
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      page === currentPage
                        ? 'text-white bg-indigo-600'
                        : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                </span>
              ))}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </nav>
        </div>
      )}      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit User</h3>
              <form onSubmit={handleSubmit(handleUpdateUser)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    {...register("email", { required: "Email is required" })}
                    type="email"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name</label>
                  <input
                    {...register("firstName", { required: "First name is required" })}
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name</label>
                  <input
                    {...register("lastName", { required: "Last name is required" })}
                    type="text"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    {...register("role", { required: "Role is required" })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      {...register("isActive")}
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Account Active</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      {...register("isVerified")}
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Email Verified</span>
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
            </div>          </div>
        </div>
      )}

      {/* Funding Dialog */}
      {fundingUser && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmitFunding(onSubmitFunding)} className="p-6">
                <h3 className="text-lg font-medium text-gray-900">Fund User Account</h3>
                <p className="text-sm text-gray-500 mt-2 mb-4">
                  Add funds to {fundingUser.username}'s account
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount (USD)</label>
                  <input
                    {...registerFunding("amount", {
                      required: "Amount is required",
                      min: { value: 1, message: "Amount must be at least $1" },
                      max: { value: 1000000, message: "Amount cannot exceed $1,000,000" }
                    })}
                    type="number"
                    step="0.01"
                    min="1"
                    max="1000000"
                    placeholder="Enter amount"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                  {fundingErrors.amount && <p className="text-red-500 text-xs mt-1">{fundingErrors.amount.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                  <textarea
                    {...registerFunding("description")}
                    rows={3}
                    placeholder="Reason for funding (e.g., bonus, correction, etc.)"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Admin Action Required
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>This action will immediately add funds to the user's account and create a transaction record. This action cannot be undone.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setFundingUser(null);
                      resetFunding();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    Fund Account
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

