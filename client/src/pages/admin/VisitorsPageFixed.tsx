import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Clock,
  Eye,
  Globe,
  MapPin,
  Monitor,
  Smartphone,
  TrendingUp,
  Users,
} from "lucide-react";
import React from "react";

const VisitorsPage: React.FC = () => {
  // Static demo data for the visitors page
  const mockVisitors = [
    {
      id: 1,
      ipAddress: "192.168.1.100",
      country: "United States",
      region: "California",
      city: "Los Angeles",
      device: "Desktop",
      browser: "Chrome",
      sessionDuration: 1245,
      pagesViewed: 5,
      lastActivity: new Date(Date.now() - 300000), // 5 minutes ago
      isActive: true,
    },
    {
      id: 2,
      ipAddress: "10.0.0.50",
      country: "United Kingdom",
      region: "England",
      city: "London",
      device: "Mobile",
      browser: "Safari",
      sessionDuration: 890,
      pagesViewed: 3,
      lastActivity: new Date(Date.now() - 600000), // 10 minutes ago
      isActive: true,
    },
    {
      id: 3,
      ipAddress: "172.16.0.25",
      country: "Canada",
      region: "Ontario",
      city: "Toronto",
      device: "Tablet",
      browser: "Chrome",
      sessionDuration: 567,
      pagesViewed: 2,
      lastActivity: new Date(Date.now() - 900000), // 15 minutes ago
      isActive: false,
    },
  ];

  const mockStats = {
    totalVisitors: 1547,
    activeVisitors: 23,
    newVisitors: 145,
    returningVisitors: 1402,
    averageSessionDuration: 1245,
    topCountries: [
      { country: "United States", visitors: 523 },
      { country: "United Kingdom", visitors: 298 },
      { country: "Canada", visitors: 187 },
      { country: "Germany", visitors: 145 },
      { country: "Australia", visitors: 112 },
    ],
  };

  const formatDuration = (seconds: number): string => {
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

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Visitors Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor visitor activity and analytics
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <Eye className="h-4 w-4 mr-1" />
          Static Demo Data
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Visitors
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockStats.totalVisitors.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {mockStats.activeVisitors}
            </div>
            <p className="text-xs text-muted-foreground">Real-time count</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Visitors</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.newVisitors}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Session</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(mockStats.averageSessionDuration)}
            </div>
            <p className="text-xs text-muted-foreground">Session duration</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Visitors Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Active Visitors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Location</th>
                  <th className="text-left py-2">Device</th>
                  <th className="text-left py-2">Session</th>
                  <th className="text-left py-2">Pages</th>
                  <th className="text-left py-2">Last Activity</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockVisitors.map((visitor) => (
                  <tr key={visitor.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">
                            {visitor.city}, {visitor.region}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {visitor.country}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {visitor.device === "Desktop" ? (
                          <Monitor className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Smartphone className="h-4 w-4 text-gray-400" />
                        )}
                        <div>
                          <div className="font-medium">{visitor.device}</div>
                          <div className="text-gray-500 text-xs">
                            {visitor.browser}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      {formatDuration(visitor.sessionDuration)}
                    </td>
                    <td className="py-3">{visitor.pagesViewed}</td>
                    <td className="py-3">{getTimeAgo(visitor.lastActivity)}</td>
                    <td className="py-3">
                      <Badge
                        variant={visitor.isActive ? "default" : "secondary"}
                      >
                        {visitor.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Countries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Top Countries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockStats.topCountries.map((country, index) => (
              <div
                key={country.country}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                    {index + 1}
                  </div>
                  <span className="font-medium">{country.country}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">
                    {country.visitors} visitors
                  </span>
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-blue-500 rounded-full"
                      style={{
                        width: `${(country.visitors / mockStats.topCountries[0].visitors) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VisitorsPage;
