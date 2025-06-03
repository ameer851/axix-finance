import React, { useState } from 'react';
import { Calendar as CalendarIcon, Search, X } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { TransactionStatus, TransactionType } from '@shared/schema';
import { DateRange } from 'react-day-picker';

interface TransactionFilterProps {
  onFilter: (filters: FilterOptions) => void;
}

export interface FilterOptions {
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  type: TransactionType | 'all';
  status: TransactionStatus | 'all';
  amount: {
    min: string;
    max: string;
  };
  search: string;
}

const TransactionFilter: React.FC<TransactionFilterProps> = ({ onFilter }) => {
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [type, setType] = useState<TransactionType | 'all'>('all');
  const [status, setStatus] = useState<TransactionStatus | 'all'>('all');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const handleReset = () => {
    setDate(undefined);
    setType('all');
    setStatus('all');
    setMinAmount('');
    setMaxAmount('');
    setSearch('');

    onFilter({
      dateRange: { from: undefined, to: undefined },
      type: 'all',
      status: 'all',
      amount: { min: '', max: '' },
      search: '',
    });
  };

  const handleApplyFilter = () => {
    onFilter({
      dateRange: {
        from: date?.from ? new Date(date.from.getTime()) : undefined,
        to: date?.to ? new Date(date.to.getTime()) : undefined,
      },
      type,
      status,
      amount: { min: minAmount, max: maxAmount },
      search,
    });
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Date Range */}
        <div className="w-full sm:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date?.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from && date?.to ? (
                  <>
                    {format(date.from, "MMM d, yyyy")} - {format(date.to, "MMM d, yyyy")}
                  </>
                ) : date?.from ? (
                  format(date.from, "MMM d, yyyy")
                ) : (
                  "Date Range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Transaction Type */}
        <div className="w-full sm:w-auto">
          <Select value={type} onValueChange={(value) => setType(value as TransactionType | 'all')}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Transaction Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="deposit">Deposit</SelectItem>
              <SelectItem value="withdrawal">Withdrawal</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
              <SelectItem value="investment">Investment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Transaction Status */}
        <div className="w-full sm:w-auto">
          <Select value={status} onValueChange={(value) => setStatus(value as TransactionStatus | 'all')}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search Input */}
        <div className="w-full sm:w-auto flex-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
            <Input
              placeholder="Search by ID or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1.5 h-7 w-7"
                onClick={() => setSearch('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Amount Range */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Input
            type="number"
            placeholder="Min Amount"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            className="w-full sm:w-24"
          />
          <span className="text-gray-500">to</span>
          <Input
            type="number"
            placeholder="Max Amount"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            className="w-full sm:w-24"
          />
        </div>

        <div className="flex space-x-2 ml-auto">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button onClick={handleApplyFilter}>Apply Filters</Button>
        </div>
      </div>

      {/* Active Filters Display */}
      <div className="flex flex-wrap gap-2">
        {date?.from && (
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-neutral-800">
            Date: {format(date.from, "MMM d")} {date.to && `- ${format(date.to, "MMM d")}`}
            <button
              type="button"
              className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => setDate(undefined)}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        {type !== 'all' && (
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-neutral-800">
            Type: {type.charAt(0).toUpperCase() + type.slice(1)}
            <button
              type="button"
              className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => setType('all')}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        {status !== 'all' && (
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-neutral-800">
            Status: {status.charAt(0).toUpperCase() + status.slice(1)}
            <button
              type="button"
              className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => setStatus('all')}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        {(minAmount || maxAmount) && (
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-neutral-800">
            Amount: {minAmount ? `$${minAmount}` : '$0'} - {maxAmount ? `$${maxAmount}` : 'Any'}
            <button
              type="button"
              className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => {
                setMinAmount('');
                setMaxAmount('');
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        {search && (
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-neutral-800">
            Search: {search}
            <button
              type="button"
              className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              onClick={() => setSearch('')}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionFilter;