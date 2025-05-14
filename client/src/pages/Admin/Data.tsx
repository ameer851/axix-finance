import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
// Layout is handled in App.tsx
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Database, Download, Upload, 
  RotateCcw, Save, Clock, FileText,
  AlertTriangle, Check, Calendar
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

// Mock backup history
const backupHistory = [
  { id: 1, name: 'Weekly Backup', date: '2025-05-10T18:30:00', size: '42.8 MB', status: 'completed' },
  { id: 2, name: 'Manual Backup', date: '2025-05-05T14:22:10', size: '41.3 MB', status: 'completed' },
  { id: 3, name: 'Daily Backup', date: '2025-05-04T00:00:00', size: '40.9 MB', status: 'completed' },
  { id: 4, name: 'Weekly Backup', date: '2025-05-03T18:30:00', size: '40.5 MB', status: 'completed' },
  { id: 5, name: 'Daily Backup', date: '2025-05-03T00:00:00', size: '40.2 MB', status: 'completed' },
];

const DataManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('backup');
  const [confirmAction, setConfirmAction] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [selectedBackup, setSelectedBackup] = useState<number | null>(null);
  const [exportOptions, setExportOptions] = useState({
    includeUsers: true,
    includeTransactions: true,
    includeSettings: true,
    dateRange: 'all',
  });
  
  const { toast } = useToast();
  
  // Simulate backup creation
  const createBackup = () => {
    setIsBackingUp(true);
    setBackupProgress(0);
    
    // Simulate progress updates
    const interval = setInterval(() => {
      setBackupProgress(prev => {
        const newProgress = prev + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsBackingUp(false);
          toast({
            title: 'Backup Created',
            description: 'Your database backup has been created successfully.',
          });
          return 100;
        }
        return newProgress;
      });
    }, 500);
  };
  
  // Simulate restore from backup
  const restoreFromBackup = (backupId: number) => {
    setSelectedBackup(backupId);
    setConfirmAction('restore');
    setShowConfirmDialog(true);
  };
  
  // Confirm restore process
  const confirmRestore = () => {
    setShowConfirmDialog(false);
    setIsRestoring(true);
    setRestoreProgress(0);
    
    // Simulate progress updates
    const interval = setInterval(() => {
      setRestoreProgress(prev => {
        const newProgress = prev + 15;
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsRestoring(false);
          toast({
            title: 'Database Restored',
            description: 'Your database has been restored successfully.',
          });
          return 100;
        }
        return newProgress;
      });
    }, 700);
  };
  
  // Simulate clearing cache
  const clearCache = (cacheType: string) => {
    setConfirmAction(`clearCache:${cacheType}`);
    setShowConfirmDialog(true);
  };
  
  // Confirm cache clearing
  const confirmClearCache = () => {
    setShowConfirmDialog(false);
    
    // Get cache type from the action string
    const cacheType = confirmAction.split(':')[1] || 'all';
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: 'Cache Cleared',
        description: `The ${cacheType === 'all' ? 'application' : cacheType} cache has been cleared successfully.`,
      });
    }, 1000);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Data Management</h1>
          <p className="text-muted-foreground">
            Backup, restore, and export your application data
          </p>
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="backup">
            <Database className="h-4 w-4 mr-2" />
            Backup & Restore
          </TabsTrigger>
          <TabsTrigger value="export">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </TabsTrigger>
          <TabsTrigger value="cache">
            <RotateCcw className="h-4 w-4 mr-2" />
            Cache Management
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="backup" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Create Backup</CardTitle>
              <CardDescription>
                Create a backup of your entire database for safekeeping
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isBackingUp ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Creating backup...</span>
                    <span>{backupProgress}%</span>
                  </div>
                  <Progress value={backupProgress} />
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Manual Backup</h3>
                    <p className="text-sm text-muted-foreground">
                      Create a one-time backup of your database
                    </p>
                  </div>
                  <Button onClick={createBackup}>
                    <Save className="mr-2 h-4 w-4" />
                    Create Backup
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Backup History</CardTitle>
              <CardDescription>
                View and restore from previous backups
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isRestoring ? (
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Restoring database...</span>
                    <span>{restoreProgress}%</span>
                  </div>
                  <Progress value={restoreProgress} />
                </div>
              ) : null}
              
              <div className="space-y-2">
                {backupHistory.map(backup => (
                  <div 
                    key={backup.id} 
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-start space-x-3">
                      <Database className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">{backup.name}</h4>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(backup.date)}
                          </span>
                          <span>|</span>
                          <span>{backup.size}</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => restoreFromBackup(backup.id)}
                    >
                      <RotateCcw className="mr-2 h-3 w-3" />
                      Restore
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="export" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
              <CardDescription>
                Select what data you want to export
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Data Types</h3>
                <div className="grid gap-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="include-users"
                      checked={exportOptions.includeUsers}
                      onChange={(e) => 
                        setExportOptions({
                          ...exportOptions,
                          includeUsers: e.target.checked
                        })
                      }
                      className="rounded"
                    />
                    <Label htmlFor="include-users">Users & Accounts</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="include-transactions"
                      checked={exportOptions.includeTransactions}
                      onChange={(e) => 
                        setExportOptions({
                          ...exportOptions,
                          includeTransactions: e.target.checked
                        })
                      }
                      className="rounded"
                    />
                    <Label htmlFor="include-transactions">Transactions</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="include-settings"
                      checked={exportOptions.includeSettings}
                      onChange={(e) => 
                        setExportOptions({
                          ...exportOptions, 
                          includeSettings: e.target.checked
                        })
                      }
                      className="rounded"
                    />
                    <Label htmlFor="include-settings">System Settings</Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Date Range</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Label
                    htmlFor="date-all"
                    className={`flex items-center justify-center p-2 border rounded-md cursor-pointer ${
                      exportOptions.dateRange === 'all' ? 'bg-primary text-primary-foreground' : ''
                    }`}
                    onClick={() => 
                      setExportOptions({
                        ...exportOptions,
                        dateRange: 'all'
                      })
                    }
                  >
                    All Time
                  </Label>
                  
                  <Label
                    htmlFor="date-month"
                    className={`flex items-center justify-center p-2 border rounded-md cursor-pointer ${
                      exportOptions.dateRange === 'month' ? 'bg-primary text-primary-foreground' : ''
                    }`}
                    onClick={() => 
                      setExportOptions({
                        ...exportOptions,
                        dateRange: 'month'
                      })
                    }
                  >
                    Last Month
                  </Label>
                  
                  <Label
                    htmlFor="date-quarter"
                    className={`flex items-center justify-center p-2 border rounded-md cursor-pointer ${
                      exportOptions.dateRange === 'quarter' ? 'bg-primary text-primary-foreground' : ''
                    }`}
                    onClick={() => 
                      setExportOptions({
                        ...exportOptions,
                        dateRange: 'quarter'
                      })
                    }
                  >
                    Last Quarter
                  </Label>
                  
                  <Label
                    htmlFor="date-year"
                    className={`flex items-center justify-center p-2 border rounded-md cursor-pointer ${
                      exportOptions.dateRange === 'year' ? 'bg-primary text-primary-foreground' : ''
                    }`}
                    onClick={() => 
                      setExportOptions({
                        ...exportOptions,
                        dateRange: 'year'
                      })
                    }
                  >
                    Last Year
                  </Label>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                {(exportOptions.includeUsers ? 1 : 0) + 
                 (exportOptions.includeTransactions ? 1 : 0) + 
                 (exportOptions.includeSettings ? 1 : 0)} data types selected
              </div>
              <Button>
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="cache" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache Management</CardTitle>
              <CardDescription>
                Manage application caches to ensure optimal performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-start space-x-3">
                    <FileText className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium">Application Cache</h4>
                      <p className="text-sm text-muted-foreground">
                        Application data cached locally for improved performance
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => clearCache('application')}
                  >
                    <RotateCcw className="mr-2 h-3 w-3" />
                    Clear
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Database className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium">Database Cache</h4>
                      <p className="text-sm text-muted-foreground">
                        Database query results cached for faster data retrieval
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => clearCache('database')}
                  >
                    <RotateCcw className="mr-2 h-3 w-3" />
                    Clear
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-medium">Session Cache</h4>
                      <p className="text-sm text-muted-foreground">
                        User session data and authentication tokens
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => clearCache('session')}
                  >
                    <RotateCcw className="mr-2 h-3 w-3" />
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="destructive" 
                onClick={() => clearCache('all')}
                className="ml-auto"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Clear All Cache
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              {confirmAction === 'restore' && 
                "Are you sure you want to restore from this backup? This will replace all current data with the backup data."
              }
              {confirmAction.includes('clearCache') && 
                "Are you sure you want to clear the cache? This may log out users and temporarily affect system performance."
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant={confirmAction === 'restore' ? 'default' : 'destructive'}
              onClick={() => {
                if (confirmAction === 'restore') {
                  confirmRestore();
                } else if (confirmAction.includes('clearCache')) {
                  confirmClearCache();
                }
              }}
            >
              {confirmAction === 'restore' ? 'Restore' : 'Clear Cache'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataManagement;
