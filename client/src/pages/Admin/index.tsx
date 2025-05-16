import React, { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * Redirect component for the old admin panel
 * This redirects users from the legacy admin panel to the new dashboard
 */
const AdminRedirect: React.FC = () => {
  const [_, setLocation] = useLocation();

  // Redirect to new admin dashboard after component mounts
  useEffect(() => {
    // Short timeout to ensure smooth transition
    const redirectTimer = setTimeout(() => {
      setLocation('/admin');
    }, 100);
    
    return () => clearTimeout(redirectTimer);
  }, [setLocation]);

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center">
      <div className="text-xl mb-4">Redirecting to new admin panel...</div>
      <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
    </div>
  );
};

export default AdminRedirect;
