import { useState } from 'react';
import { useAdminWebSocket } from '@/hooks/useAdminWebSocket';
import { Bell, X, Circle, AlertCircle, DollarSign, Users, Activity } from 'lucide-react';

export default function AdminNotifications() {
  const { notifications, isConnected, clearNotifications } = useAdminWebSocket();
  const [isExpanded, setIsExpanded] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'withdrawal':
        return <DollarSign className="h-4 w-4 text-orange-600" />;
      case 'user_registration':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'transaction':
        return <Activity className="h-4 w-4 text-purple-600" />;
      case 'system':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Circle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'bg-green-50 border-green-200';
      case 'withdrawal':
        return 'bg-orange-50 border-orange-200';
      case 'user_registration':
        return 'bg-blue-50 border-blue-200';
      case 'transaction':
        return 'bg-purple-50 border-purple-200';
      case 'system':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="h-6 w-6" />
        
        {/* Connection Status */}
        <div className={`absolute -top-1 -right-1 h-3 w-3 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`} />
        
        {/* Notification Count */}
        {notifications.length > 0 && (
          <div className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {notifications.length > 9 ? '9+' : notifications.length}
          </div>
        )}
      </button>

      {/* Notifications Panel */}
      {isExpanded && (
        <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-semibold text-gray-900">Live Notifications</h3>
              <div className={`h-2 w-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
            </div>
            <div className="flex items-center space-x-2">
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </button>
              )}              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close notifications panel"
                title="Close notifications panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No new notifications</p>
                <p className="text-sm">Live updates will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification, index) => (
                  <div
                    key={index}
                    className={`p-4 hover:bg-gray-50 transition-colors ${getNotificationColor(notification.type)}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {notification.type.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTimestamp(notification.timestamp)}
                          </p>
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          {notification.data?.message || JSON.stringify(notification.data)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!isConnected && (
            <div className="p-4 bg-red-50 border-t border-red-200">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Connection lost. Attempting to reconnect...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
