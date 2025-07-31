import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  Globe, 
  Clock, 
  MapPin, 
  Monitor, 
  Smartphone, 
  RefreshCw,
  Eye,
  TrendingUp,
  Filter,
  Search
} from 'lucide-react';
import { getActiveVisitors, getVisitorStats, type VisitorData, type VisitorStats } from '@/services/visitorService';

const VisitorsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [deviceFilter, setDeviceFilter] = useState('all');

  // Fetch active visitors with React Query
  const { 
    data: visitors = [], 
    isLoading: loadingVisitors, 
    refetch: refetchVisitors 
  } = useQuery({
    queryKey: ['activeVisitors'],
    queryFn: getActiveVisitors,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    staleTime: 10000, // Data is fresh for 10 seconds
    retry: 3, // Retry on failure
  });

  // Fetch visitor stats
  const { 
    data: stats, 
    isLoading: loadingStats,
    refetch: refetchStats 
  } = useQuery({
    queryKey: ['visitorStats'],
    queryFn: getVisitorStats,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000,
    retry: false,
  });

  const isLoading = loadingVisitors || loadingStats;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getTimeAgo = (date: Date | string | null | undefined) => {
    if (!date) return 'Unknown';
    
    const now = new Date();
    let dateObj: Date;
    
    try {
      dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // Check if the date is valid
      if (!dateObj || isNaN(dateObj.getTime())) {
        return 'Unknown';
      }
    } catch (error) {
      return 'Unknown';
    }
    
    const diff = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Monitor className="h-4 w-4 text-purple-600" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const filteredVisitors = visitors.filter(visitor => {
    const matchesSearch = searchTerm === '' || 
      visitor.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.currentPage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.ipAddress.includes(searchTerm);
    
    const matchesCountry = countryFilter === 'all' || visitor.country === countryFilter;
    const matchesDevice = deviceFilter === 'all' || visitor.deviceType === deviceFilter;
    
    return matchesSearch && matchesCountry && matchesDevice;
  });

  const refreshData = () => {
    refetchVisitors();
    refetchStats();
  };

  const uniqueCountries = Array.from(new Set(visitors.map(v => v.country))).sort();
  const uniqueDevices = Array.from(new Set(visitors.map(v => v.deviceType))).sort();

  // Helper function to get progress bar width class
  const getProgressBarWidth = (count: number, total: number): string => {
    const percentage = Math.min(100, (count / total) * 100);
    if (percentage <= 10) return 'w-[10%]';
    if (percentage <= 20) return 'w-1/5';
    if (percentage <= 25) return 'w-1/4';
    if (percentage <= 33) return 'w-1/3';
    if (percentage <= 50) return 'w-1/2';
    if (percentage <= 60) return 'w-3/5';
    if (percentage <= 75) return 'w-3/4';
    if (percentage <= 80) return 'w-4/5';
    if (percentage <= 90) return 'w-[90%]';
    return 'w-full';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Site Visitors</h1>
          <p className="text-gray-600">Monitor real-time visitor activity and analytics</p>
        </div>
        <Button onClick={refreshData} disabled={isLoading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Visitors</CardTitle>
            <Eye className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.activeVisitors || 0}</div>
            <p className="text-xs text-gray-600">Currently browsing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Visitors</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayVisitors || 0}</div>
            <p className="text-xs text-gray-600">Total today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalVisitors || 0}</div>
            <p className="text-xs text-gray-600">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(stats?.avgSessionDuration || 0)}</div>
            <p className="text-xs text-gray-600">Session duration</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              Top Countries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.topCountries?.map((item, index) => (
                <div key={item.country} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">#{index + 1}</span>
                    <span className="text-sm">{item.country}</span>
                  </div>
                  <Badge variant="secondary">{item.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Pages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-600" />
              Top Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.topPages?.map((item, index) => (
                <div key={item.page} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">#{index + 1}</span>
                    <span className="text-sm font-mono text-blue-600">{item.page}</span>
                  </div>
                  <Badge variant="secondary">{item.views}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-purple-600" />
              Device Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.deviceBreakdown?.map((item) => {
                return (
                  <div key={item.device} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(item.device.toLowerCase())}
                      <span className="text-sm">{item.device}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`bg-blue-600 h-2 rounded-full transition-all duration-300 ${getProgressBarWidth(item.count, stats?.totalVisitors || 1)}`}
                        ></div>
                      </div>
                      <Badge variant="secondary">{item.count}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by IP, location, or page..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {uniqueCountries.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={deviceFilter} onValueChange={setDeviceFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by device" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Devices</SelectItem>
                {uniqueDevices.map(device => (
                  <SelectItem key={device} value={device}>
                    {device.charAt(0).toUpperCase() + device.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Active Visitors Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Active Visitors ({filteredVisitors.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Location</th>
                  <th className="text-left py-2 px-4">Device</th>
                  <th className="text-left py-2 px-4">Current Page</th>
                  <th className="text-left py-2 px-4">Session</th>
                  <th className="text-left py-2 px-4">Last Activity</th>
                  <th className="text-left py-2 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisitors.map((visitor) => (
                  <tr key={visitor.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{visitor.city}, {visitor.country}</div>
                          <div className="text-sm text-gray-500">{visitor.ipAddress}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(visitor.deviceType)}
                        <div>
                          <div className="font-medium">{visitor.browser}</div>
                          <div className="text-sm text-gray-500">{visitor.os}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-blue-600">{visitor.currentPage}</div>
                      <div className="text-sm text-gray-500">{visitor.pageViews} pages viewed</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{formatDuration(visitor.sessionDuration)}</div>
                      <div className="text-sm text-gray-500">Started {getTimeAgo(visitor.joinedAt)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">{getTimeAgo(visitor.lastActivity)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge 
                        variant={visitor.isActive ? "default" : "secondary"}
                        className={visitor.isActive ? "bg-green-100 text-green-800" : ""}
                      >
                        {visitor.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredVisitors.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No visitors found matching your filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VisitorsPage;
