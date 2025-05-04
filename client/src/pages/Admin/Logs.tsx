import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  CalendarIcon, 
  Search, 
  Download,
  Info,
  AlertTriangle,
  XCircle,
  Shield
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { exportLogs } from '@/services/adminService';
import { Log } from '@shared/schema';

const AdminLogs: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [logType, setLogType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined
  });

  // Fetch logs
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['/api/logs', searchQuery, logType, dateRange],
    queryFn: async () => {
      try {
        let url = '/api/logs';
        const params = new URLSearchParams();
        
        if (searchQuery) {
          params.append('query', searchQuery);
        }
        
        if (logType && logType !== 'all') {
          params.append('type', logType);
        }
        
        if (dateRange.from && dateRange.to) {
          params.append('startDate', dateRange.from.toISOString());
          params.append('endDate', dateRange.to.toISOString());
        }
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        const response = await apiRequest('GET', url);
        if (!response.ok) {
          throw new Error('Failed to fetch logs');
        }
        return await response.json();
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Could not load logs',
          variant: 'destructive'
        });
        return [];
      }
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The query will re-run automatically due to the searchQuery dependency
  };

  const handleExport = async () => {
    try {
      await exportLogs();
      toast({
        title: 'Export started',
        description: 'The logs export has been initiated. The file will download shortly.'
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'audit':
        return <Shield className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getLogBadge = (type: string) => {
    switch (type) {
      case 'info':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Info</Badge>;
      case 'warning':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Warning</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Error</Badge>;
      case 'audit':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Audit</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">System Logs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            View and analyze system events and activities
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center" 
          onClick={handleExport}
        >
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Logs</CardTitle>
          <CardDescription>Narrow down logs by type, date or keyword</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <form onSubmit={handleSearch} className="flex w-full max-w-sm items-center space-x-2">
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </form>
            </div>
            
            <div className="w-full md:w-[180px]">
              <Select value={logType} onValueChange={setLogType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select log type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Log Type</SelectLabel>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="audit">Audit</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start text-left font-normal w-[220px]"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
                        </>
                      ) : (
                        formatDate(dateRange.from)
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log Entries</CardTitle>
          <CardDescription>
            {isLoading 
              ? 'Loading logs...' 
              : logs.length 
                ? `Showing ${logs.length} log entries` 
                : 'No logs found matching your criteria'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center p-6 text-gray-500 dark:text-gray-400">
              No logs found. Try changing your search criteria.
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log: Log) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="mr-4 mt-1">
                      {getLogIcon(log.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium">{log.message}</h3>
                          {getLogBadge(log.type)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {log.createdAt && formatDate(new Date(log.createdAt))}
                        </div>
                      </div>
                      
                      <div className="mt-2 space-y-1">
                        {log.userId && (
                          <div className="text-sm">
                            <span className="font-medium">User:</span> #{log.userId}
                          </div>
                        )}
                        
                        {log.details && typeof log.details === 'object' && (
                          <div className="mt-2">
                            <div className="text-sm font-medium">Details:</div>
                            <pre className="mt-1 text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogs;