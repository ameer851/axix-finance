import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Filter,
  Info,
  Search,
  Shield,
  User,
  XCircle,
} from "lucide-react";
import React, { useState } from "react";

const AuditLogsPageStatic: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  // Static demo audit logs data
  const mockAuditLogs = [
    {
      id: 1,
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      userId: 1,
      userName: "admin@axixfinance.com",
      action: "DEPOSIT_APPROVED",
      severity: "info",
      description: "Approved deposit transaction #1234 for $5,000",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      details: {
        transactionId: 1234,
        amount: 5000,
        userId: 42,
      },
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 900000), // 15 minutes ago
      userId: 1,
      userName: "admin@axixfinance.com",
      action: "USER_LOGIN",
      severity: "info",
      description: "Admin user logged in successfully",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      details: {
        loginMethod: "password",
        sessionId: "sess_abc123",
      },
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
      userId: 42,
      userName: "john.doe@email.com",
      action: "WITHDRAWAL_REQUESTED",
      severity: "warning",
      description: "User requested withdrawal of $2,500 to Bitcoin wallet",
      ipAddress: "10.0.0.50",
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X)",
      details: {
        amount: 2500,
        cryptoType: "bitcoin",
        walletAddress: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      },
    },
    {
      id: 4,
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      userId: null,
      userName: "system",
      action: "FAILED_LOGIN_ATTEMPT",
      severity: "warning",
      description: "Failed login attempt detected from suspicious IP",
      ipAddress: "45.132.75.25",
      userAgent: "curl/7.68.0",
      details: {
        attemptedEmail: "admin@axixfinance.com",
        reason: "invalid_password",
        blocked: true,
      },
    },
    {
      id: 5,
      timestamp: new Date(Date.now() - 7200000), // 2 hours ago
      userId: 1,
      userName: "admin@axixfinance.com",
      action: "SYSTEM_BACKUP",
      severity: "info",
      description: "Automated system backup completed successfully",
      ipAddress: "127.0.0.1",
      userAgent: "System/Cron",
      details: {
        backupSize: "2.5GB",
        duration: "45 minutes",
        tables: 15,
      },
    },
    {
      id: 6,
      timestamp: new Date(Date.now() - 10800000), // 3 hours ago
      userId: 15,
      userName: "jane.smith@email.com",
      action: "ACCOUNT_CREATED",
      severity: "info",
      description: "New user account created and verified",
      ipAddress: "172.16.0.25",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      details: {
        registrationMethod: "email",
        referralCode: "REF123",
        verified: true,
      },
    },
  ];

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      info: "bg-blue-100 text-blue-800",
      warning: "bg-yellow-100 text-yellow-800",
      error: "bg-red-100 text-red-800",
      success: "bg-green-100 text-green-800",
    };

    return (
      <Badge
        className={`${variants[severity as keyof typeof variants] || variants.info} border-0`}
      >
        {getSeverityIcon(severity)}
        <span className="ml-1">
          {severity.charAt(0).toUpperCase() + severity.slice(1)}
        </span>
      </Badge>
    );
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const filteredLogs = mockAuditLogs.filter((log) => {
    const matchesSearch =
      searchTerm === "" ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesSeverity =
      severityFilter === "all" || log.severity === severityFilter;

    return matchesSearch && matchesAction && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-600 mt-1">
            Monitor system activity and security events
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <Shield className="h-4 w-4 mr-1" />
          Static Demo Data
        </Badge>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="USER_LOGIN">User Login</SelectItem>
                  <SelectItem value="DEPOSIT_APPROVED">
                    Deposit Approved
                  </SelectItem>
                  <SelectItem value="WITHDRAWAL_REQUESTED">
                    Withdrawal Requested
                  </SelectItem>
                  <SelectItem value="FAILED_LOGIN_ATTEMPT">
                    Failed Login
                  </SelectItem>
                  <SelectItem value="ACCOUNT_CREATED">
                    Account Created
                  </SelectItem>
                  <SelectItem value="SYSTEM_BACKUP">System Backup</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Severity</label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Activity ({filteredLogs.length} events)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Timestamp</th>
                  <th className="text-left py-2">User</th>
                  <th className="text-left py-2">Action</th>
                  <th className="text-left py-2">Severity</th>
                  <th className="text-left py-2">Description</th>
                  <th className="text-left py-2">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">
                            {log.timestamp.toLocaleString()}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {getTimeAgo(log.timestamp)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="font-medium">{log.userName}</div>
                          {log.userId && (
                            <div className="text-gray-500 text-xs">
                              ID: {log.userId}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {log.action}
                      </code>
                    </td>
                    <td className="py-3">{getSeverityBadge(log.severity)}</td>
                    <td className="py-3 max-w-md">
                      <div className="truncate" title={log.description}>
                        {log.description}
                      </div>
                    </td>
                    <td className="py-3">
                      <code className="text-xs text-gray-600">
                        {log.ipAddress}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredLogs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No audit logs match your current filters.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogsPageStatic;
