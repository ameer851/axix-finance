import React, { useState } from 'react';
import { Check, X, Users, Download, Upload, Trash2, CheckCircle, XCircle, Clock, Send } from 'lucide-react';

interface BulkActionsProps {
  selectedItems: string[];
  onClearSelection: () => void;
  actions: BulkAction[];
  totalItems: number;
}

export interface BulkAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: (selectedIds: string[]) => Promise<void> | void;
  confirmMessage?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  requiresConfirmation?: boolean;
}

export default function BulkActions({
  selectedItems,
  onClearSelection,
  actions,
  totalItems
}: BulkActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);

  const handleAction = async (action: BulkAction) => {
    if (selectedItems.length === 0) return;

    if (action.requiresConfirmation !== false) {
      const message = action.confirmMessage || 
        `Are you sure you want to ${action.label.toLowerCase()} ${selectedItems.length} item(s)?`;
      
      if (!confirm(message)) {
        return;
      }
    }

    setIsLoading(true);
    setCurrentAction(action.id);

    try {
      await action.action(selectedItems);
      onClearSelection();
    } catch (error) {
      console.error(`Error executing ${action.label}:`, error);
      alert(`Failed to ${action.label.toLowerCase()}. Please try again.`);
    } finally {
      setIsLoading(false);
      setCurrentAction(null);
    }
  };

  const getVariantClasses = (variant: string = 'default') => {
    switch (variant) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white';
      case 'warning':
        return 'bg-yellow-600 hover:bg-yellow-700 text-white';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white';
    }
  };

  if (selectedItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="text-blue-600" size={20} />
            <span className="font-medium text-blue-900">
              {selectedItems.length} of {totalItems} items selected
            </span>
          </div>
          
          <button
            onClick={onClearSelection}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Clear selection
          </button>
        </div>

        <div className="flex items-center gap-2">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              disabled={isLoading}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                ${getVariantClasses(action.variant)}
              `}
            >
              {isLoading && currentAction === action.id ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                action.icon
              )}
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Pre-configured bulk actions for common use cases
export const createUserBulkActions = (
  onApprove: (ids: string[]) => Promise<void>,
  onSuspend: (ids: string[]) => Promise<void>,
  onDelete: (ids: string[]) => Promise<void>,
  onExport: (ids: string[]) => Promise<void>
): BulkAction[] => [
  {
    id: 'approve',
    label: 'Approve Users',
    icon: <CheckCircle size={16} />,
    action: onApprove,
    variant: 'success',
    confirmMessage: 'Are you sure you want to approve the selected users?'
  },
  {
    id: 'suspend',
    label: 'Suspend Users',
    icon: <XCircle size={16} />,
    action: onSuspend,
    variant: 'warning',
    confirmMessage: 'Are you sure you want to suspend the selected users?'
  },
  {
    id: 'export',
    label: 'Export Data',
    icon: <Download size={16} />,
    action: onExport,
    variant: 'default',
    requiresConfirmation: false
  },
  {
    id: 'delete',
    label: 'Delete Users',
    icon: <Trash2 size={16} />,
    action: onDelete,
    variant: 'danger',
    confirmMessage: 'Are you sure you want to permanently delete the selected users? This action cannot be undone.'
  }
];

export const createTransactionBulkActions = (
  onApprove: (ids: string[]) => Promise<void>,
  onReject: (ids: string[]) => Promise<void>,
  onProcess: (ids: string[]) => Promise<void>,
  onExport: (ids: string[]) => Promise<void>
): BulkAction[] => [
  {
    id: 'approve',
    label: 'Approve',
    icon: <Check size={16} />,
    action: onApprove,
    variant: 'success'
  },
  {
    id: 'reject',
    label: 'Reject',
    icon: <X size={16} />,
    action: onReject,
    variant: 'danger'
  },
  {
    id: 'process',
    label: 'Process',
    icon: <Clock size={16} />,
    action: onProcess,
    variant: 'default'
  },
  {
    id: 'export',
    label: 'Export',
    icon: <Download size={16} />,
    action: onExport,
    variant: 'default',
    requiresConfirmation: false
  }
];

export const createDepositBulkActions = (
  onApprove: (ids: string[]) => Promise<void>,
  onReject: (ids: string[]) => Promise<void>,
  onDelete: (ids: string[]) => Promise<void>,
  onExport: (ids: string[]) => Promise<void>
): BulkAction[] => [
  {
    id: 'approve',
    label: 'Approve Deposits',
    icon: <CheckCircle size={16} />,
    action: onApprove,
    variant: 'success',
    confirmMessage: 'Are you sure you want to approve the selected deposits?'
  },  {
    id: 'reject',
    label: 'Reject Deposits',
    icon: <XCircle size={16} />,
    action: onReject,
    variant: 'danger',
    confirmMessage: 'Are you sure you want to reject the selected deposits?'
  },
  {
    id: 'delete',
    label: 'Delete Deposits',
    icon: <XCircle size={16} />,
    action: onDelete,
    variant: 'danger',
    confirmMessage: 'Are you sure you want to delete the selected deposits? This action cannot be undone.'
  },
  {
    id: 'export',
    label: 'Export Data',
    icon: <Download size={16} />,
    action: onExport,
    variant: 'default',
    requiresConfirmation: false
  }
];

export const createWithdrawalBulkActions = (
  onApprove: (ids: string[]) => Promise<void>,
  onReject: (ids: string[]) => Promise<void>,
  onProcess: (ids: string[]) => Promise<void>,
  onComplete: (ids: string[]) => Promise<void>,
  onExport: (ids: string[]) => Promise<void>
): BulkAction[] => [
  {
    id: 'approve',
    label: 'Approve',
    icon: <CheckCircle size={16} />,
    action: onApprove,
    variant: 'success'
  },
  {
    id: 'reject',
    label: 'Reject',
    icon: <XCircle size={16} />,
    action: onReject,
    variant: 'danger'
  },
  {
    id: 'process',
    label: 'Process',
    icon: <Clock size={16} />,
    action: onProcess,
    variant: 'default'
  },
  {
    id: 'complete',
    label: 'Complete',
    icon: <Send size={16} />,
    action: onComplete,
    variant: 'success'
  },
  {
    id: 'export',
    label: 'Export',
    icon: <Download size={16} />,
    action: onExport,
    variant: 'default',
    requiresConfirmation: false
  }
];
