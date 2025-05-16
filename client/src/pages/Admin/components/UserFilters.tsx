import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserFilters } from '../types';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

interface UserFiltersProps {
  filters: UserFilters;
  onFilterChange: (newFilters: Partial<UserFilters>) => void;
  onResetFilters: () => void;
  maxBalance: number;
}

/**
 * Component for filtering users in the admin panel
 */
const UserFilterControls: React.FC<UserFiltersProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  maxBalance
}) => {
  // Calculate the current balance range for display
  const balanceMin = filters.balanceRange ? filters.balanceRange[0] : 0;
  const balanceMax = filters.balanceRange ? filters.balanceRange[1] : maxBalance;
  
  // Handle balance slider change
  const handleBalanceChange = (value: number[]) => {
    onFilterChange({ balanceRange: [value[0], value[1]] });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by name, email or ID..."
            className="pl-9"
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value })}
          />
        </div>
        
        <Select
          value={filters.role || 'all'}
          onValueChange={(role) => onFilterChange({ role: role === 'all' ? undefined : role })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
          </SelectContent>
        </Select>
        
        <Select
          value={filters.status || 'all'}
          onValueChange={(status) => onFilterChange({ status: status === 'all' ? undefined : status as any })}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" onClick={onResetFilters}>
          Reset Filters
        </Button>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Balance Range: ${balanceMin.toLocaleString()} - ${balanceMax.toLocaleString()}</span>
          {filters.balanceRange && (
            <Button variant="ghost" size="sm" onClick={() => onFilterChange({ balanceRange: undefined })}>
              Clear
            </Button>
          )}
        </div>
        <Slider
          defaultValue={[0, maxBalance]}
          value={[balanceMin, balanceMax]}
          max={maxBalance}
          step={100}
          onValueChange={handleBalanceChange}
        />
      </div>
    </div>
  );
};

export default UserFilterControls;
