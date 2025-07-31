import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from "@/hooks/use-toast";
import { adminService } from "@/services/adminService";

interface SystemSettings {
  siteName: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowRegistrations: boolean;
  requireEmailVerification: boolean;
  maxWithdrawalAmount: number;
  minDepositAmount: number;
  defaultCurrency: string;
  supportEmail: string;
  companyAddress: string;
}

const SettingsPage: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminService.getSettings(),
  });

  const [formData, setFormData] = useState<SystemSettings>({
    siteName: 'Axix Finance',
    maintenanceMode: false,
    maintenanceMessage: '',
    allowRegistrations: true,
    requireEmailVerification: true,
    maxWithdrawalAmount: 50000,
    minDepositAmount: 10,
    defaultCurrency: 'USD',
    supportEmail: 'support@axixfinance.com',
    companyAddress: '',
    ...settings
  });

  // Update form data when settings are loaded
  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: (data: SystemSettings) => adminService.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveSettingsMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof SystemSettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
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
        Failed to load settings. Please try again later.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">System Settings</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="space-y-6">
          {/* Site Configuration */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold mb-4">Site Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Site Name
                </label>
                <input
                  type="text"
                  id="siteName"
                  value={formData.siteName}
                  onChange={(e) => handleInputChange('siteName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="defaultCurrency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Currency
                </label>
                <select
                  id="defaultCurrency"
                  value={formData.defaultCurrency}
                  onChange={(e) => handleInputChange('defaultCurrency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                </select>
              </div>
            </div>
          </div>

          {/* User Management */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold mb-4">User Management</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowRegistrations"
                  checked={formData.allowRegistrations}
                  onChange={(e) => handleInputChange('allowRegistrations', e.target.checked)}
                  className="rounded mr-3"
                />
                <label htmlFor="allowRegistrations" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Allow New Registrations
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requireEmailVerification"
                  checked={formData.requireEmailVerification}
                  onChange={(e) => handleInputChange('requireEmailVerification', e.target.checked)}
                  className="rounded mr-3"
                />
                <label htmlFor="requireEmailVerification" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Require Email Verification
                </label>
              </div>
            </div>
          </div>

          {/* Financial Limits */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold mb-4">Financial Limits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="minDepositAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minimum Deposit Amount ($)
                </label>
                <input
                  type="number"
                  id="minDepositAmount"
                  value={formData.minDepositAmount}
                  onChange={(e) => handleInputChange('minDepositAmount', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="maxWithdrawalAmount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maximum Withdrawal Amount ($)
                </label>
                <input
                  type="number"
                  id="maxWithdrawalAmount"
                  value={formData.maxWithdrawalAmount}
                  onChange={(e) => handleInputChange('maxWithdrawalAmount', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-b pb-6">
            <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="supportEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Support Email
                </label>
                <input
                  type="email"
                  id="supportEmail"
                  value={formData.supportEmail}
                  onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Company Address
                </label>
                <textarea
                  id="companyAddress"
                  value={formData.companyAddress}
                  onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Maintenance Mode */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Maintenance Mode</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="maintenanceMode"
                  checked={formData.maintenanceMode}
                  onChange={(e) => handleInputChange('maintenanceMode', e.target.checked)}
                  className="rounded mr-3"
                />
                <label htmlFor="maintenanceMode" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Maintenance Mode
                </label>
              </div>
              {formData.maintenanceMode && (
                <div>
                  <label htmlFor="maintenanceMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Maintenance Message
                  </label>
                  <textarea
                    id="maintenanceMessage"
                    value={formData.maintenanceMessage}
                    onChange={(e) => handleInputChange('maintenanceMessage', e.target.value)}
                    rows={3}
                    placeholder="Enter the message to display during maintenance..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t">
          <button
            onClick={handleSave}
            disabled={saveSettingsMutation.isPending}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
