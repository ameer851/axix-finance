import React, { useState } from 'react';
import { Calendar, Filter, X, Search, Download } from 'lucide-react';

interface AdminFiltersProps {
  onFilterChange: (filters: FilterState) => void;
  onExport?: (format: 'csv' | 'pdf') => void;
  showExport?: boolean;
  filterOptions?: {
    showDateRange?: boolean;
    showAmountRange?: boolean;
    showStatus?: boolean;
    showPaymentMethod?: boolean;
    showUserSearch?: boolean;
    customStatuses?: string[];
    customPaymentMethods?: string[];
  };
}

export interface FilterState {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  status?: string;
  paymentMethod?: string;
}

export default function AdminFilters({ 
  onFilterChange, 
  onExport, 
  showExport = true,
  filterOptions = {}
}: AdminFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({});
  const [isOpen, setIsOpen] = useState(false);

  const {
    showDateRange = true,
    showAmountRange = true,
    showStatus = true,
    showPaymentMethod = true,
    showUserSearch = true,
    customStatuses = ['pending', 'approved', 'rejected', 'completed'],
    customPaymentMethods = ['bank_transfer', 'bitcoin', 'ethereum', 'usdt']
  } = filterOptions;

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilter = (key: keyof FilterState) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const activeFilterCount = Object.keys(filters).length;

  const formatPaymentMethodLabel = (method: string) => {
    return method.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            aria-label={`${isOpen ? 'Close' : 'Open'} filters panel`}
            title={`${isOpen ? 'Close' : 'Open'} filters panel`}
          >
            <Filter size={16} />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-blue-800 text-xs px-2 py-1 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
            {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-gray-500 hover:text-gray-700 text-sm"
              aria-label="Clear all active filters"
              title="Clear all active filters"
            >
              Clear all filters
            </button>
          )}
        </div>        {showExport && onExport && (
          <div className="flex gap-2">
            <button
              onClick={() => onExport('csv')}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              aria-label="Export data as CSV file"
              title="Export data as CSV file"
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              onClick={() => onExport('pdf')}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              aria-label="Export data as PDF file"
              title="Export data as PDF file"
            >
              <Download size={16} />
              Export PDF
            </button>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-4 border-t">
          {showUserSearch && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Users
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Name, email, username..."
                  value={filters.search || ''}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />                {filters.search && (
                  <button
                    onClick={() => clearFilter('search')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search filter"
                    title="Clear search filter"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {showDateRange && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date From
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />                  <input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={(e) => updateFilter('dateFrom', e.target.value)}
                    className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    title="Select start date for filtering"
                    aria-label="Start date filter"
                  />
                  {filters.dateFrom && (
                    <button
                      onClick={() => clearFilter('dateFrom')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label="Clear start date filter"
                      title="Clear start date filter"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date To
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />                  <input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={(e) => updateFilter('dateTo', e.target.value)}
                    className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    title="Select end date for filtering"
                    aria-label="End date filter"
                  />
                  {filters.dateTo && (
                    <button
                      onClick={() => clearFilter('dateTo')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label="Clear end date filter"
                      title="Clear end date filter"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {showAmountRange && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Amount ($)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0.00"
                    value={filters.amountMin || ''}
                    onChange={(e) => updateFilter('amountMin', parseFloat(e.target.value) || undefined)}
                    className="w-full pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />                  {filters.amountMin && (
                    <button
                      onClick={() => clearFilter('amountMin')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label="Clear minimum amount filter"
                      title="Clear minimum amount filter"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Amount ($)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0.00"
                    value={filters.amountMax || ''}
                    onChange={(e) => updateFilter('amountMax', parseFloat(e.target.value) || undefined)}
                    className="w-full pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />                  {filters.amountMax && (
                    <button
                      onClick={() => clearFilter('amountMax')}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label="Clear maximum amount filter"
                      title="Clear maximum amount filter"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {showStatus && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <div className="relative">                <select
                  value={filters.status || ''}
                  onChange={(e) => updateFilter('status', e.target.value || undefined)}
                  className="w-full pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  title="Filter by status"
                  aria-label="Status filter"
                >
                  <option value="">All Statuses</option>
                  {customStatuses.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
                {filters.status && (
                  <button
                    onClick={() => clearFilter('status')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear status filter"
                    title="Clear status filter"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {showPaymentMethod && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <div className="relative">                <select
                  value={filters.paymentMethod || ''}
                  onChange={(e) => updateFilter('paymentMethod', e.target.value || undefined)}
                  className="w-full pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  title="Filter by payment method"
                  aria-label="Payment method filter"
                >
                  <option value="">All Methods</option>
                  {customPaymentMethods.map(method => (
                    <option key={method} value={method}>
                      {formatPaymentMethodLabel(method)}
                    </option>
                  ))}
                </select>
                {filters.paymentMethod && (
                  <button
                    onClick={() => clearFilter('paymentMethod')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear payment method filter"
                    title="Clear payment method filter"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="text-sm text-gray-600 mb-2">Active Filters:</div>
          <div className="flex flex-wrap gap-2">            {filters.search && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                Search: {filters.search}
                <button 
                  onClick={() => clearFilter('search')} 
                  className="text-blue-600 hover:text-blue-800"
                  aria-label="Clear search filter"
                  title="Clear search filter"
                >
                  <X size={14} />
                </button>
              </span>
            )}
            {filters.dateFrom && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                From: {filters.dateFrom}
                <button 
                  onClick={() => clearFilter('dateFrom')} 
                  className="text-green-600 hover:text-green-800"
                  aria-label="Clear date from filter"
                  title="Clear date from filter"
                >
                  <X size={14} />
                </button>
              </span>
            )}
            {filters.dateTo && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                To: {filters.dateTo}
                <button 
                  onClick={() => clearFilter('dateTo')} 
                  className="text-green-600 hover:text-green-800"
                  aria-label="Clear date to filter"
                  title="Clear date to filter"
                >
                  <X size={14} />
                </button>
              </span>
            )}
            {filters.amountMin && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                Min: ${filters.amountMin}
                <button 
                  onClick={() => clearFilter('amountMin')} 
                  className="text-yellow-600 hover:text-yellow-800"
                  aria-label="Clear minimum amount filter"
                  title="Clear minimum amount filter"
                >
                  <X size={14} />
                </button>
              </span>
            )}
            {filters.amountMax && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                Max: ${filters.amountMax}
                <button 
                  onClick={() => clearFilter('amountMax')} 
                  className="text-yellow-600 hover:text-yellow-800"
                  aria-label="Clear maximum amount filter"
                  title="Clear maximum amount filter"
                >
                  <X size={14} />
                </button>
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                Status: {filters.status}
                <button 
                  onClick={() => clearFilter('status')} 
                  className="text-purple-600 hover:text-purple-800"
                  aria-label="Clear status filter"
                  title="Clear status filter"
                >
                  <X size={14} />
                </button>
              </span>
            )}            {filters.paymentMethod && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full">
                Method: {formatPaymentMethodLabel(filters.paymentMethod)}
                <button 
                  onClick={() => clearFilter('paymentMethod')} 
                  className="text-indigo-600 hover:text-indigo-800"
                  aria-label="Clear payment method filter"
                  title="Clear payment method filter"
                >
                  <X size={14} />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
