import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AdminFilters, { FilterState } from "@/components/AdminFilters";
import { exportAuditLogs } from "@/utils/exportUtils";

interface AuditLog {
  id: number;
  type: 'info' | 'warning' | 'error' | 'audit';
  message: string;
  details?: any;
  userId?: number;
  createdAt: string;
  ipAddress?: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

interface ExtendedFilterState extends FilterState {
  userId?: string;
}

interface AuditLogsResponse {
  logs: AuditLog[];
  totalPages: number;
  currentPage: number;
  totalLogs: number;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [filters, setFilters] = useState<ExtendedFilterState>({});
  const [selectedLogs, setSelectedLogs] = useState<string[]>([]);
  const { toast } = useToast();
  // Geolocation state
  const [geoData, setGeoData] = useState<Record<string, { city?: string; country?: string }>>({});

  // Fetch audit logs from API
  const fetchLogs = async (page = 1, appliedFilters: ExtendedFilterState = {}) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20"
      });

      // Add filter parameters
      if (appliedFilters.search) params.set('search', appliedFilters.search);
      if (appliedFilters.dateFrom) params.set('dateFrom', appliedFilters.dateFrom);
      if (appliedFilters.dateTo) params.set('dateTo', appliedFilters.dateTo);
      if (appliedFilters.status) params.set('type', appliedFilters.status); // Using status as type filter
      if (appliedFilters.userId) params.set('userId', appliedFilters.userId);

      const response = await apiRequest("GET", `/api/admin/audit-logs?${params}`);
      const data = await response.json() as AuditLogsResponse;
      setLogs(data.logs);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
      setTotalLogs(data.totalLogs);
      setSelectedLogs([]); // Clear selection when data changes
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch audit logs. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(currentPage, filters);
  }, [currentPage, filters]);

  useEffect(() => {
    if (logs) {
      const uniqueIps = Array.from(new Set(logs.map((log) => log.ipAddress).filter(Boolean)));
      uniqueIps.forEach((ip) => {
        const ipStr = String(ip);
        if (!geoData[ipStr]) {
          fetch(`https://ipapi.co/${ipStr}/json/`)
            .then(res => res.json())
            .then(data => {
              setGeoData(prev => ({ ...prev, [ipStr]: { city: data.city, country: data.country_name } }));
            })
            .catch(() => {
              setGeoData(prev => ({ ...prev, [ipStr]: { city: 'Unknown', country: '' } }));
            });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs]);

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters as ExtendedFilterState);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle export functionality
  const handleExport = (format: 'csv' | 'pdf') => {
    const exportData = selectedLogs.length > 0 
      ? logs.filter(log => selectedLogs.includes(log.id.toString()))
      : logs;
    
    exportAuditLogs(exportData, format);
    
    toast({
      title: "Export Started",
      description: `Exporting ${exportData.length} audit logs to ${format.toUpperCase()}...`,
    });
  };

  // Log selection handlers
  const handleSelectLog = (logId: string) => {
    setSelectedLogs(prev => 
      prev.includes(logId) 
        ? prev.filter(id => id !== logId)
        : [...prev, logId]
    );
  };

  const handleSelectAll = () => {
    if (selectedLogs.length === logs.length) {
      setSelectedLogs([]);
    } else {
      setSelectedLogs(logs.map(log => log.id.toString()));
    }
  };

  // Calculate selection state for header checkbox
  const isAllSelected = logs.length > 0 && selectedLogs.length === logs.length;
  const isPartiallySelected = selectedLogs.length > 0 && selectedLogs.length < logs.length;

  // Helper functions
  const getLogTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'audit': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const renderDetails = (details: any) => {
    if (!details) return '—';
    if (typeof details === 'string') return details;
    return (
      <details className="cursor-pointer">
        <summary className="text-blue-600 hover:text-blue-800">View Details</summary>
        <pre className="mt-2 text-xs bg-gray-50 p-2 rounded max-w-xs overflow-auto">
          {JSON.stringify(details, null, 2)}
        </pre>
      </details>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600">Track all administrative actions and system events</p>
        </div>
        
        <div className="flex space-x-2">
          {selectedLogs.length > 0 && (
            <>
              <button
                onClick={() => handleExport('csv')}
                className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
              >
                Export CSV ({selectedLogs.length})
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
              >
                Export PDF ({selectedLogs.length})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Logs</h3>
          <p className="text-2xl font-bold text-blue-600">{totalLogs.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Info Logs</h3>
          <p className="text-2xl font-bold text-blue-600">
            {logs.filter(log => log.type === 'info').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Warnings</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {logs.filter(log => log.type === 'warning').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Errors</h3>
          <p className="text-2xl font-bold text-red-600">
            {logs.filter(log => log.type === 'error').length}
          </p>
        </div>
      </div>      {/* Filters */}
      <AdminFilters
        onFilterChange={handleFilterChange}
        onExport={handleExport}
        showExport={true}
        filterOptions={{
          showDateRange: true,
          showStatus: true,
          showUserSearch: true,
          customStatuses: ['info', 'warning', 'error', 'audit']
        }}
      />

      {/* Audit Logs Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center space-x-4">            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={input => {
                  if (input) input.indeterminate = isPartiallySelected;
                }}
                onChange={handleSelectAll}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                aria-label="Select all audit logs"
              />
              <span className="ml-2 text-sm text-gray-700">
                {selectedLogs.length > 0 ? `${selectedLogs.length} selected` : "Select all"}
              </span>
            </label>
          </div>
          
          <div className="text-sm text-gray-500">
            Showing {logs.length} of {totalLogs} logs
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No audit logs found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Select
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date/Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className={selectedLogs.includes(log.id.toString()) ? 'bg-blue-50' : ''}>                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedLogs.includes(log.id.toString())}
                        onChange={() => handleSelectLog(log.id.toString())}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        aria-label={`Select audit log ${log.id}`}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLogTypeColor(log.type)}`}>
                        {log.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs break-words">
                        {log.message}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.user ? (
                        <div>
                          <div className="font-medium">{log.user.username}</div>
                          <div className="text-gray-500">{log.user.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-500">System</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ipAddress || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {log.ipAddress && geoData[log.ipAddress] ? `${geoData[log.ipAddress].city || ''}${geoData[log.ipAddress].city && geoData[log.ipAddress].country ? ', ' : ''}${geoData[log.ipAddress].country || ''}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {renderDetails(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{(currentPage - 1) * 20 + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">{Math.min(currentPage * 20, totalLogs)}</span>
                  {' '}of{' '}
                  <span className="font-medium">{totalLogs}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(currentPage - 2 + i, totalPages - 4 + i));
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNum
                            ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
