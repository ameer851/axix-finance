import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";

const SettingsPage: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    siteName: 'Axix Finance',
    maintenanceMode: false,
    maintenanceMessage: '',
    allowRegistrations: true,
    requireEmailVerification: true,
  });

  const handleSave = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">System Settings</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="space-y-6">
          <div>
            <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Site Name
            </label>
            <input
              id="siteName"
              type="text"
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              aria-label="Site Name"
            />
          </div>

          <div className="flex items-center">
            <input
              id="maintenanceMode"
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              aria-label="Maintenance Mode"
            />
            <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Maintenance Mode
            </label>
          </div>

          <div>
            <label htmlFor="maintenanceMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Maintenance Message
            </label>
            <textarea
              id="maintenanceMessage"
              value={settings.maintenanceMessage}
              onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={3}
              aria-label="Maintenance Message"
            />
          </div>

          <div className="flex items-center">
            <input
              id="allowRegistrations"
              type="checkbox"
              checked={settings.allowRegistrations}
              onChange={(e) => setSettings({ ...settings, allowRegistrations: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              aria-label="Allow New Registrations"
            />
            <label htmlFor="allowRegistrations" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Allow New Registrations
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="requireEmailVerification"
              type="checkbox"
              checked={settings.requireEmailVerification}
              onChange={(e) => setSettings({ ...settings, requireEmailVerification: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              aria-label="Require Email Verification"
            />
            <label htmlFor="requireEmailVerification" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Require Email Verification
            </label>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage; 