import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Clock, Save, Server, Settings } from "lucide-react";
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
  const { toast } = useToast();

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

  // Mock query for maintenance settings
  const { data: maintenanceData, isLoading } = useQuery({
    queryKey: ["maintenance"],
    queryFn: () => Promise.resolve(maintenance),
    initialData: maintenance,
  });

  // Mock mutation for updating maintenance settings
  const updateMutation = useMutation({
    mutationFn: (data: typeof maintenance) => {
      // Mock API call
      return Promise.resolve(data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Maintenance settings updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update maintenance settings",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: any) => {
    setMaintenance((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleServiceToggle = (service: string) => {
    setMaintenance((prev) => {
      const currentServices = prev.affectedServices || [];
      return {
        ...prev,
        affectedServices: currentServices.includes(service)
          ? currentServices.filter((s) => s !== service)
          : [...currentServices, service],
      };
    });
  };

  const handleSave = () => {
    updateMutation.mutate(maintenance);
  };

  const enableMaintenanceNow = () => {
    const now = new Date();
    const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now

    setMaintenance((prev) => ({
      ...prev,
      enabled: true,
      scheduledStart: now.toISOString().slice(0, 16),
      scheduledEnd: endTime.toISOString().slice(0, 16),
    }));
  };

  const disableMaintenanceNow = () => {
    setMaintenance((prev) => ({
      ...prev,
      enabled: false,
    }));
  };

  const availableServices = [
    "deposits",
    "withdrawals",
    "trading",
    "portfolio",
    "messaging",
    "registration",
  ];

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
      duration: "4 hours",
      status: "Completed",
      description: "Optimized database queries and updated indexing strategies",
    },
    {
      id: 3,
      type: "Server Upgrade",
      date: "2024-01-05",
      duration: "6 hours",
      status: "Completed",
      description:
        "Upgraded server hardware and migrated to new infrastructure",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Settings className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Maintenance Management
          </h1>
          <p className="text-gray-600">
            Monitor system health and manage maintenance windows
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {systemStats.activeUsers}
                </div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {systemStats.systemHealth}
                </div>
                <div className="text-sm text-gray-600">System Health</div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">System Uptime</span>
                <span className="text-sm text-gray-600">
                  {systemStats.uptime}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  Database Connections
                </span>
                <span className="text-sm text-gray-600">
                  {systemStats.databaseConnections}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Server Load</span>
                <span className="text-sm text-gray-600">
                  {systemStats.serverLoad}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Maintenance History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMaintenances.map((maintenance) => (
                <div
                  key={maintenance.id}
                  className="border-l-4 border-blue-500 pl-4"
                >
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium">{maintenance.type}</h4>
                    <Badge
                      variant={
                        maintenance.status === "Completed"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {maintenance.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {maintenance.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>📅 {maintenance.date}</span>
                    <span>⏱️ {maintenance.duration}</span>
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
                  <span className="text-sm font-medium">Server Load</span>
                  <span className="text-sm text-gray-600">
                    {systemStats.serverLoad}
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

        {/* Maintenance Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Maintenance Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Maintenance Status */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">
                  Maintenance Mode
                </Label>
                <p className="text-sm text-gray-600">
                  Enable to put the system in maintenance mode
                </p>
              </div>
              <Switch
                checked={maintenance.enabled}
                onCheckedChange={(checked) =>
                  handleInputChange("enabled", checked)
                }
              />
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                onClick={enableMaintenanceNow}
                variant="outline"
                size="sm"
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
              >
                Enable Now (2 hours)
              </Button>
              <Button
                onClick={disableMaintenanceNow}
                variant="outline"
                size="sm"
                className="text-green-600 border-green-300 hover:bg-green-50"
              >
                Disable Now
              </Button>
            </div>

            {/* Maintenance Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Maintenance Message</Label>
              <Textarea
                id="message"
                value={maintenance.message}
                onChange={(e) => handleInputChange("message", e.target.value)}
                placeholder="Enter the message to display to users during maintenance"
                rows={3}
              />
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Scheduled Start</Label>
                <Input
                  id="start"
                  type="datetime-local"
                  value={maintenance.scheduledStart}
                  onChange={(e) =>
                    handleInputChange("scheduledStart", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">Scheduled End</Label>
                <Input
                  id="end"
                  type="datetime-local"
                  value={maintenance.scheduledEnd}
                  onChange={(e) =>
                    handleInputChange("scheduledEnd", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Maintenance Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Maintenance Type</Label>
              <Select
                value={maintenance.maintenanceType}
                onValueChange={(value) =>
                  handleInputChange("maintenanceType", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select maintenance type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System Maintenance</SelectItem>
                  <SelectItem value="security">Security Update</SelectItem>
                  <SelectItem value="database">Database Maintenance</SelectItem>
                  <SelectItem value="network">Network Maintenance</SelectItem>
                  <SelectItem value="emergency">
                    Emergency Maintenance
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Affected Services */}
            <div className="space-y-2">
              <Label>Affected Services</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableServices.map((service) => (
                  <div key={service} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={service}
                      checked={maintenance.affectedServices.includes(service)}
                      onChange={() => handleServiceToggle(service)}
                      className="rounded"
                    />
                    <Label htmlFor={service} className="text-sm capitalize">
                      {service}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Access */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">
                  Allow Admin Access
                </Label>
                <p className="text-sm text-gray-600">
                  Allow administrators to bypass maintenance mode
                </p>
              </div>
              <Switch
                checked={maintenance.allowAdminAccess}
                onCheckedChange={(checked) =>
                  handleInputChange("allowAdminAccess", checked)
                }
              />
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <Button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={updateMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {updateMutation.isPending
                  ? "Saving..."
                  : "Save Maintenance Settings"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
