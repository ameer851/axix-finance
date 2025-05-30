// Export utilities for admin data
export interface ExportOptions {
  filename?: string;
  title?: string;
  columns?: { key: string; header: string }[];
  includeTimestamp?: boolean;
}

// CSV Export Functions
export const exportToCSV = (data: any[], options: ExportOptions = {}) => {
  const {
    filename = 'export',
    columns,
    includeTimestamp = true
  } = options;

  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get columns from data or use provided columns
  const csvColumns = columns || Object.keys(data[0]).map(key => ({ key, header: key }));
  
  // Create CSV content
  const headers = csvColumns.map(col => col.header).join(',');
  const rows = data.map(item => 
    csvColumns.map(col => {
      const value = item[col.key];
      // Handle special values
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );

  const csvContent = [headers, ...rows].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const timestamp = includeTimestamp ? `_${new Date().toISOString().split('T')[0]}` : '';
  
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}${timestamp}.csv`;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// PDF Export Functions (simplified version - for production consider using jsPDF or similar)
export const exportToPDF = async (data: any[], options: ExportOptions = {}) => {
  const {
    filename = 'export',
    title = 'Export Report',
    columns,
    includeTimestamp = true
  } = options;

  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // For now, we'll create a simple HTML table and convert to PDF via print
  // In production, consider using libraries like jsPDF or Puppeteer
  const csvColumns = columns || Object.keys(data[0]).map(key => ({ key, header: key }));
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 20px; }
        .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .timestamp { font-size: 14px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .summary { margin-top: 20px; padding: 10px; background-color: #f5f5f5; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${title}</div>
        ${includeTimestamp ? `<div class="timestamp">Generated on: ${new Date().toLocaleString()}</div>` : ''}
      </div>
      
      <table>
        <thead>
          <tr>
            ${csvColumns.map(col => `<th>${col.header}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${data.map(item => `
            <tr>
              ${csvColumns.map(col => `<td>${item[col.key] || ''}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="summary">
        <strong>Total Records: ${data.length}</strong>
      </div>
    </body>
    </html>
  `;

  // Create a new window and print
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
    };
  }
};

// Predefined column configurations for different data types
export const userExportColumns = [
  { key: 'id', header: 'User ID' },
  { key: 'firstName', header: 'First Name' },
  { key: 'lastName', header: 'Last Name' },
  { key: 'email', header: 'Email' },
  { key: 'username', header: 'Username' },
  { key: 'role', header: 'Role' },
  { key: 'isVerified', header: 'Verified' },
  { key: 'isActive', header: 'Active' },
  { key: 'balance', header: 'Balance' },
  { key: 'createdAt', header: 'Created At' },
  { key: 'lastLoginAt', header: 'Last Login' }
];

export const depositExportColumns = [
  { key: 'id', header: 'Deposit ID' },
  { key: 'userId', header: 'User ID' },
  { key: 'userEmail', header: 'User Email' },
  { key: 'amount', header: 'Amount' },
  { key: 'paymentMethod', header: 'Payment Method' },
  { key: 'status', header: 'Status' },
  { key: 'transactionId', header: 'Transaction ID' },
  { key: 'createdAt', header: 'Created At' },
  { key: 'approvedAt', header: 'Approved At' },
  { key: 'approvedBy', header: 'Approved By' }
];

export const withdrawalExportColumns = [
  { key: 'id', header: 'Withdrawal ID' },
  { key: 'userId', header: 'User ID' },
  { key: 'userEmail', header: 'User Email' },
  { key: 'amount', header: 'Amount' },
  { key: 'fee', header: 'Fee' },
  { key: 'netAmount', header: 'Net Amount' },
  { key: 'paymentMethod', header: 'Payment Method' },
  { key: 'status', header: 'Status' },
  { key: 'bankDetails', header: 'Bank Details' },
  { key: 'createdAt', header: 'Created At' },
  { key: 'processedAt', header: 'Processed At' },
  { key: 'completedAt', header: 'Completed At' }
];

export const transactionExportColumns = [
  { key: 'id', header: 'Transaction ID' },
  { key: 'userId', header: 'User ID' },
  { key: 'userEmail', header: 'User Email' },
  { key: 'type', header: 'Type' },
  { key: 'amount', header: 'Amount' },
  { key: 'status', header: 'Status' },
  { key: 'paymentMethod', header: 'Payment Method' },
  { key: 'description', header: 'Description' },
  { key: 'createdAt', header: 'Created At' },
  { key: 'updatedAt', header: 'Updated At' }
];

export const auditLogExportColumns = [
  { key: 'id', header: 'Log ID' },
  { key: 'userId', header: 'User ID' },
  { key: 'userEmail', header: 'User Email' },
  { key: 'action', header: 'Action' },
  { key: 'resource', header: 'Resource' },
  { key: 'resourceId', header: 'Resource ID' },
  { key: 'details', header: 'Details' },
  { key: 'ipAddress', header: 'IP Address' },
  { key: 'userAgent', header: 'User Agent' },
  { key: 'severity', header: 'Severity' },
  { key: 'createdAt', header: 'Created At' }
];

// Utility functions for data formatting
export const formatDataForExport = (data: any[], type: 'users' | 'deposits' | 'withdrawals' | 'transactions' | 'audit-logs') => {
  return data.map(item => {
    const formatted = { ...item };
    
    // Format common fields
    if (formatted.createdAt) {
      formatted.createdAt = new Date(formatted.createdAt).toLocaleString();
    }
    if (formatted.updatedAt) {
      formatted.updatedAt = new Date(formatted.updatedAt).toLocaleString();
    }
    if (formatted.approvedAt) {
      formatted.approvedAt = new Date(formatted.approvedAt).toLocaleString();
    }
    if (formatted.processedAt) {
      formatted.processedAt = new Date(formatted.processedAt).toLocaleString();
    }
    if (formatted.completedAt) {
      formatted.completedAt = new Date(formatted.completedAt).toLocaleString();
    }
    if (formatted.lastLoginAt) {
      formatted.lastLoginAt = formatted.lastLoginAt ? new Date(formatted.lastLoginAt).toLocaleString() : 'Never';
    }
    
    // Format amounts
    if (formatted.amount) {
      formatted.amount = `$${parseFloat(formatted.amount).toFixed(2)}`;
    }
    if (formatted.fee) {
      formatted.fee = `$${parseFloat(formatted.fee).toFixed(2)}`;
    }
    if (formatted.netAmount) {
      formatted.netAmount = `$${parseFloat(formatted.netAmount).toFixed(2)}`;
    }
    if (formatted.balance) {
      formatted.balance = `$${parseFloat(formatted.balance).toFixed(2)}`;
    }
      // Format booleans
    if (typeof formatted.isVerified === 'boolean') {
      formatted.isVerified = formatted.isVerified ? 'Yes' : 'No';
    }
    if (typeof formatted.isActive === 'boolean') {
      formatted.isActive = formatted.isActive ? 'Yes' : 'No';
    }
    
    // Format audit log specific fields
    if (type === 'audit-logs') {
      if (formatted.details && typeof formatted.details === 'object') {
        formatted.details = JSON.stringify(formatted.details);
      }
    }
    
    return formatted;
  });
};

// Complete export functions with formatting
export const exportUsers = (users: any[], format: 'csv' | 'pdf' = 'csv') => {
  const formattedData = formatDataForExport(users, 'users');
  const options: ExportOptions = {
    filename: 'users_export',
    title: 'Users Export Report',
    columns: userExportColumns
  };
  
  if (format === 'csv') {
    exportToCSV(formattedData, options);
  } else {
    exportToPDF(formattedData, options);
  }
};

export const exportDeposits = (deposits: any[], format: 'csv' | 'pdf' = 'csv') => {
  const formattedData = formatDataForExport(deposits, 'deposits');
  const options: ExportOptions = {
    filename: 'deposits_export',
    title: 'Deposits Export Report',
    columns: depositExportColumns
  };
  
  if (format === 'csv') {
    exportToCSV(formattedData, options);
  } else {
    exportToPDF(formattedData, options);
  }
};

export const exportWithdrawals = (withdrawals: any[], format: 'csv' | 'pdf' = 'csv') => {
  const formattedData = formatDataForExport(withdrawals, 'withdrawals');
  const options: ExportOptions = {
    filename: 'withdrawals_export',
    title: 'Withdrawals Export Report',
    columns: withdrawalExportColumns
  };
  
  if (format === 'csv') {
    exportToCSV(formattedData, options);
  } else {
    exportToPDF(formattedData, options);
  }
};

export const exportTransactions = (transactions: any[], format: 'csv' | 'pdf' = 'csv') => {
  const formattedData = formatDataForExport(transactions, 'transactions');
  const options: ExportOptions = {
    filename: 'transactions_export',
    title: 'Transactions Export Report',
    columns: transactionExportColumns
  };
  
  if (format === 'csv') {
    exportToCSV(formattedData, options);
  } else {
    exportToPDF(formattedData, options);
  }
};

export const exportAuditLogs = (auditLogs: any[], format: 'csv' | 'pdf' = 'csv') => {
  const formattedData = formatDataForExport(auditLogs, 'audit-logs');
  const options: ExportOptions = {
    filename: 'audit_logs_export',
    title: 'Audit Logs Export Report',
    columns: auditLogExportColumns
  };
  
  if (format === 'csv') {
    exportToCSV(formattedData, options);
  } else {
    exportToPDF(formattedData, options);
  }
};
