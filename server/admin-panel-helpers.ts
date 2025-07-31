// Helper function to generate demo audit logs
export function generateDemoLogs(count: number) {
  const logs = [];
  const actions = ['login', 'logout', 'update_profile', 'change_password', 'deposit_approved', 'withdrawal_requested'];
  const userIds = ['usr_123456', 'usr_789012', 'usr_345678', 'usr_901234'];
  const ipAddresses = ['192.168.1.1', '10.0.0.1', '172.16.0.1', '127.0.0.1'];
  
  for (let i = 0; i < count; i++) {
    const action = actions[Math.floor(Math.random() * actions.length)];
    const userId = userIds[Math.floor(Math.random() * userIds.length)];
    const ipAddress = ipAddresses[Math.floor(Math.random() * ipAddresses.length)];
    const createdAt = new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)); // Random time in the last week
    
    logs.push({
      id: `log_${i + 1}`,
      type: 'audit',
      action,
      message: `User performed action: ${action}`,
      details: {
        action,
        timestamp: createdAt.toISOString()
      },
      userId,
      ipAddress,
      createdAt: createdAt.toISOString(),
      isDemoData: true
    });
  }
  
  return logs;
}
