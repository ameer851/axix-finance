import { useState, useEffect } from "react";

interface MaintenanceSettings {
  enabled: boolean;
  message: string;
  scheduledStart: string;
  scheduledEnd: string;
  allowedIPs: string[];
}

export default function MaintenancePage() {
  const [settings, setSettings] = useState<MaintenanceSettings>({
    enabled: false,
    message: "The system is currently under maintenance. Please try again later.",
    scheduledStart: "",
    scheduledEnd: "",
    allowedIPs: []
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newIP, setNewIP] = useState("");
  useEffect(() => {
    const fetchMaintenanceSettings = async () => {
      try {
        const response = await fetch('/api/admin/maintenance', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setSettings(data.settings);
        } else {
          console.error('Failed to fetch maintenance settings:', response.statusText);
          // Fallback to default settings
          setSettings({
            enabled: false,
            message: "The system is currently under maintenance. Please try again later.",
            scheduledStart: "",
            scheduledEnd: "",
            allowedIPs: []
          });
        }
      } catch (error) {
        console.error('Error fetching maintenance settings:', error);
        setSettings({
          enabled: false,
          message: "The system is currently under maintenance. Please try again later.",
          scheduledStart: "",
          scheduledEnd: "",
          allowedIPs: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenanceSettings();
  }, []);
  const handleToggleMaintenance = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/maintenance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ enabled: !settings.enabled })
      });

      if (response.ok) {
        setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
      } else {
        console.error('Failed to toggle maintenance mode:', response.statusText);
        alert('Failed to toggle maintenance mode. Please try again.');
      }
    } catch (error) {
      console.error("Failed to toggle maintenance mode:", error);
      alert('Error toggling maintenance mode. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMessage = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/maintenance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ message: settings.message })
      });

      if (response.ok) {
        alert("Maintenance message updated successfully!");
      } else {
        console.error('Failed to update maintenance message:', response.statusText);
        alert('Failed to update maintenance message. Please try again.');
      }
    } catch (error) {
      console.error("Failed to update message:", error);
      alert('Error updating maintenance message. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleScheduleMaintenance = async () => {
    if (!settings.scheduledStart || !settings.scheduledEnd) {
      alert("Please select both start and end times for scheduled maintenance.");
      return;
    }
    
    setSaving(true);
    try {
      // Mock API call to schedule maintenance
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert("Maintenance scheduled successfully!");
    } catch (error) {
      console.error("Failed to schedule maintenance:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddIP = () => {
    if (newIP && !settings.allowedIPs.includes(newIP)) {
      setSettings(prev => ({
        ...prev,
        allowedIPs: [...prev.allowedIPs, newIP]
      }));
      setNewIP("");
    }
  };

  const handleRemoveIP = (ip: string) => {
    setSettings(prev => ({
      ...prev,
      allowedIPs: prev.allowedIPs.filter(allowedIP => allowedIP !== ip)
    }));
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow">
              <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
              <div className="h-10 bg-gray-300 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Maintenance Mode</h1>

      {/* Current Status */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Current Status</h2>
            <p className={`text-lg font-medium ${settings.enabled ? 'text-red-600' : 'text-green-600'}`}>
              {settings.enabled ? 'Maintenance Mode Active' : 'System Operational'}
            </p>
          </div>
          <button
            onClick={handleToggleMaintenance}
            disabled={saving}
            className={`px-6 py-3 rounded-lg font-medium text-white transition-colors ${
              settings.enabled
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {saving ? 'Updating...' : (settings.enabled ? 'Disable Maintenance' : 'Enable Maintenance')}
          </button>
        </div>
      </div>

      {/* Maintenance Message */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Maintenance Message</h2>
        <div className="space-y-4">
          <textarea
            value={settings.message}
            onChange={(e) => setSettings(prev => ({ ...prev, message: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter the message users will see during maintenance..."
          />
          <button
            onClick={handleUpdateMessage}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Updating...' : 'Update Message'}
          </button>
        </div>
      </div>

      {/* Scheduled Maintenance */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Schedule Maintenance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>            <input
              type="datetime-local"
              value={settings.scheduledStart}
              onChange={(e) => setSettings(prev => ({ ...prev, scheduledStart: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Maintenance start time"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>            <input
              type="datetime-local"
              value={settings.scheduledEnd}
              onChange={(e) => setSettings(prev => ({ ...prev, scheduledEnd: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Maintenance end time"
            />
          </div>
        </div>
        <button
          onClick={handleScheduleMaintenance}
          disabled={saving}
          className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Scheduling...' : 'Schedule Maintenance'}
        </button>
      </div>

      {/* Allowed IPs */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Allowed IP Addresses</h2>
        <p className="text-gray-600 mb-4">These IP addresses will have access during maintenance mode.</p>
          <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newIP}
            onChange={(e) => setNewIP(e.target.value)}
            placeholder="Enter IP address (e.g., 192.168.1.1)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="IP address to whitelist"
            title="Enter IP address to add to whitelist"
          />
          <button
            onClick={handleAddIP}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            Add IP
          </button>
        </div>

        <div className="space-y-2">
          {settings.allowedIPs.map((ip, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
              <span className="font-mono text-sm">{ip}</span>
              <button
                onClick={() => handleRemoveIP(ip)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            </div>
          ))}
          {settings.allowedIPs.length === 0 && (
            <p className="text-gray-500 text-sm italic">No allowed IP addresses configured.</p>
          )}
        </div>
      </div>
    </div>
  );
}
