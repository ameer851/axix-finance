import {
  AlertTriangle,
  Clock,
  Database,
  Save,
  Server,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Switch } from "../../components/ui/switch";
import { Textarea } from "../../components/ui/textarea";

export default function MaintenancePage() {
  const [maintenance, setMaintenance] = useState({
    enabled: false,
    message:
      "The system is currently under maintenance. Please try again later.",
    scheduledStart: "",
    scheduledEnd: "",
    allowAdminAccess: true,
    maintenanceType: "system",
    affectedServices: [] as string[],
  });

  const handleSave = () => {
    // Static demo - just show a success message
    alert("Maintenance settings saved! (Demo mode - no actual changes made)");
  };

  const systemStats = {
    uptime: "15 days, 7 hours, 23 minutes",
    lastBackup: "2 hours ago",
    systemHealth: "Excellent",
    activeUsers: 1247,
    databaseConnections: 25,
    serverLoad: "18%",
    diskUsage: "45%",
    memoryUsage: "62%",
  };

  const recentMaintenances = [
    {
      id: 1,
      type: "Security Update",
      date: "2024-01-15",
      duration: "2 hours",
      status: "Completed",
      description:
        "Applied critical security patches and updated SSL certificates",
    },
    {
      id: 2,
      type: "Database Optimization",
      date: "2024-01-10",
      duration: "1 hour",
      status: "Completed",
      description: "Optimized database queries and rebuilt indexes",
    },
    {
      id: 3,
      type: "System Backup",
      date: "2024-01-05",
      duration: "30 minutes",
      status: "Completed",
      description: "Full system backup and verification",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            System Maintenance
          </h1>
          <p className="text-gray-600 mt-1">
            Manage system maintenance and monitor health
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <Settings className="h-4 w-4 mr-1" />
          Static Demo
        </Badge>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {systemStats.systemHealth}
            </div>
            <p className="text-xs text-muted-foreground">
              All services operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.uptime}</div>
            <p className="text-xs text-muted-foreground">Since last restart</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Currently online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Server Load</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.serverLoad}</div>
            <p className="text-xs text-muted-foreground">CPU utilization</p>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Mode Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Maintenance Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Maintenance */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label
                htmlFor="maintenance-enabled"
                className="text-base font-medium"
              >
                Enable Maintenance Mode
              </Label>
              <p className="text-sm text-gray-600">
                Put the system into maintenance mode to prevent user access
              </p>
            </div>
            <Switch
              id="maintenance-enabled"
              checked={maintenance.enabled}
              onCheckedChange={(checked) =>
                setMaintenance((prev) => ({ ...prev, enabled: checked }))
              }
            />
          </div>

          {/* Maintenance Message */}
          <div className="space-y-2">
            <Label htmlFor="maintenance-message">Maintenance Message</Label>
            <Textarea
              id="maintenance-message"
              placeholder="Enter message to display to users during maintenance"
              value={maintenance.message}
              onChange={(e) =>
                setMaintenance((prev) => ({ ...prev, message: e.target.value }))
              }
              rows={3}
            />
          </div>

          {/* Maintenance Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maintenance-type">Maintenance Type</Label>
              <Select
                value={maintenance.maintenanceType}
                onValueChange={(value) =>
                  setMaintenance((prev) => ({
                    ...prev,
                    maintenanceType: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select maintenance type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System Maintenance</SelectItem>
                  <SelectItem value="security">Security Update</SelectItem>
                  <SelectItem value="database">Database Maintenance</SelectItem>
                  <SelectItem value="network">Network Upgrade</SelectItem>
                  <SelectItem value="emergency">
                    Emergency Maintenance
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="admin-access" className="text-sm font-medium">
                  Allow Admin Access
                </Label>
                <p className="text-xs text-gray-600">
                  Allow admin users to access the system during maintenance
                </p>
              </div>
              <Switch
                id="admin-access"
                checked={maintenance.allowAdminAccess}
                onCheckedChange={(checked) =>
                  setMaintenance((prev) => ({
                    ...prev,
                    allowAdminAccess: checked,
                  }))
                }
              />
            </div>
          </div>

          {/* Scheduled Maintenance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled-start">Scheduled Start Time</Label>
              <Input
                id="scheduled-start"
                type="datetime-local"
                value={maintenance.scheduledStart}
                onChange={(e) =>
                  setMaintenance((prev) => ({
                    ...prev,
                    scheduledStart: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduled-end">Scheduled End Time</Label>
              <Input
                id="scheduled-end"
                type="datetime-local"
                value={maintenance.scheduledEnd}
                onChange={(e) =>
                  setMaintenance((prev) => ({
                    ...prev,
                    scheduledEnd: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save Maintenance Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Maintenance History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Recent Maintenance Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentMaintenances.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{activity.type}</h4>
                    <Badge variant="secondary">{activity.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>📅 {activity.date}</span>
                    <span>⏱️ {activity.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Memory Usage</span>
                <span className="text-sm text-gray-600">
                  {systemStats.memoryUsage}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: systemStats.memoryUsage }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Disk Usage</span>
                <span className="text-sm text-gray-600">
                  {systemStats.diskUsage}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: systemStats.diskUsage }}
                ></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Database Connections
                </span>
                <span className="text-sm text-gray-600">
                  {systemStats.databaseConnections}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: "25%" }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Last Backup:</span>
              <span className="font-medium">{systemStats.lastBackup}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
