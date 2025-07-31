import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { adminService } from "@/services/adminService";

interface MaintenanceSettings {
  enabled: boolean;
  message: string;
  scheduledStart: string;
  scheduledEnd: string;
  allowedIPs: string[];
}

const defaultSettings: MaintenanceSettings = {
  enabled: false,
  message: "The system is currently under maintenance. Please try again later.",
  scheduledStart: "",
  scheduledEnd: "",
  allowedIPs: []
};

export default function MaintenancePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newIP, setNewIP] = useState("");

  // Fetch maintenance settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['admin-maintenance'],
    queryFn: () => adminService.getMaintenanceSettings(),
    retry: 2,
  });

  const [formData, setFormData] = useState<MaintenanceSettings>(defaultSettings);

  // Update form data when settings are loaded
  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  // Save maintenance settings mutation
  const saveMaintenanceMutation = useMutation({
    mutationFn: (data: MaintenanceSettings) => adminService.updateMaintenanceSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-maintenance'] });
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

  // Toggle maintenance mode mutation
  const toggleMaintenanceMutation = useMutation({
    mutationFn: (enabled: boolean) => adminService.toggleMaintenanceMode(enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-maintenance'] });
      toast({
        title: "Success",
        description: `Maintenance mode ${formData.enabled ? 'enabled' : 'disabled'}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to toggle maintenance mode",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMaintenanceMutation.mutate(formData);
  };

  const handleToggleMaintenance = () => {
    const newEnabled = !formData.enabled;
    setFormData(prev => ({ ...prev, enabled: newEnabled }));
    toggleMaintenanceMutation.mutate(newEnabled);
  };

  const handleInputChange = (field: keyof MaintenanceSettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddIP = () => {
    if (newIP.trim() && !formData.allowedIPs.includes(newIP.trim())) {
      setFormData(prev => ({
        ...prev,
        allowedIPs: [...prev.allowedIPs, newIP.trim()]
      }));
      setNewIP("");
    }
  };

  const handleRemoveIP = (ip: string) => {
    setFormData(prev => ({
      ...prev,
      allowedIPs: prev.allowedIPs.filter(allowedIP => allowedIP !== ip)
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500">
        Failed to load maintenance settings. Please try again later.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Maintenance Mode</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Current Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">Maintenance Mode</span>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  formData.enabled 
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}>
                  {formData.enabled ? 'ENABLED' : 'DISABLED'}
                </span>
                <button
                  onClick={handleToggleMaintenance}
                  disabled={toggleMaintenanceMutation.isPending}
                  className={`px-4 py-2 rounded-md text-white font-medium ${
                    formData.enabled
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50`}
                >
                  {toggleMaintenanceMutation.isPending 
                    ? 'Updating...' 
                    : formData.enabled ? 'Disable' : 'Enable'
                  }
                </button>
              </div>
            </div>

            {formData.enabled && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      System is in Maintenance Mode
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Users will see the maintenance message and cannot access the system.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => handleInputChange('message', 'Scheduled maintenance in progress. We\'ll be back shortly.')}
              className="w-full text-left px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Use Standard Message
            </button>
            <button
              onClick={() => {
                const now = new Date();
                const oneHour = new Date(now.getTime() + 60 * 60 * 1000);
                handleInputChange('scheduledStart', now.toISOString().slice(0, 16));
                handleInputChange('scheduledEnd', oneHour.toISOString().slice(0, 16));
              }}
              className="w-full text-left px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Schedule 1-Hour Maintenance
            </button>
            <button
              onClick={() => setFormData(defaultSettings)}
              className="w-full text-left px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>

      {/* Configuration */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Configuration</h2>
        
        <div className="space-y-6">
          {/* Maintenance Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Maintenance Message
            </label>
            <textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter the message users will see during maintenance..."
            />
          </div>

          {/* Scheduled Maintenance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="scheduledStart" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Scheduled Start
              </label>
              <input
                type="datetime-local"
                id="scheduledStart"
                value={formData.scheduledStart}
                onChange={(e) => handleInputChange('scheduledStart', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="scheduledEnd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Scheduled End
              </label>
              <input
                type="datetime-local"
                id="scheduledEnd"
                value={formData.scheduledEnd}
                onChange={(e) => handleInputChange('scheduledEnd', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Allowed IPs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Allowed IP Addresses (Admin Access)
            </label>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newIP}
                  onChange={(e) => setNewIP(e.target.value)}
                  placeholder="Enter IP address (e.g., 192.168.1.1)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleAddIP}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              
              {formData.allowedIPs.length > 0 && (
                <div className="mt-3">
                  <div className="flex flex-wrap gap-2">
                    {formData.allowedIPs.map((ip, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {ip}
                        <button
                          onClick={() => handleRemoveIP(ip)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-4 border-t">
            <button
              onClick={handleSave}
              disabled={saveMaintenanceMutation.isPending}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveMaintenanceMutation.isPending ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
