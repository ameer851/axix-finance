import React, { useEffect } from 'react';
import { useLocation } from 'wouter';

const Profile: React.FC = () => {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to SimpleEditAccount since they are now the same page
    setLocation('/simple-edit-account');
  }, [setLocation]);

  return null;
};

export default Profile;
