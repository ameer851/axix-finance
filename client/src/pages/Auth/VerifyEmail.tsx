import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { verifyEmail, resendVerificationEmail } from '@/services/authService';
import { useAuth } from '@/context/AuthContext';

export default function VerifyEmail() {
  const [, navigate] = useLocation();
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [message, setMessage] = useState('Verifying your email...');
  const { toast } = useToast();
  const { refreshUserData, user } = useAuth();
  
  // Get token from URL
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  useEffect(() => {
    if (token) {
      verifyEmailWithToken(token);
    } else {
      setVerificationStatus('error');
      setMessage('No verification token found in the URL. Please check your email link.');
    }
  }, [token]);

  const verifyEmailWithToken = async (token: string) => {
    setIsVerifying(true);
    try {
      const result = await verifyEmail(token);
      if (result.success) {
        setVerificationStatus('success');
        setMessage(result.message);
        // Refresh user data to update verification status
        await refreshUserData();
      } else {
        setVerificationStatus('error');
        setMessage(result.message);
      }
    } catch (error: any) {
      setVerificationStatus('error');
      setMessage(error.message || 'Failed to verify email. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const result = await resendVerificationEmail();
      if (result.success) {
        toast({
          title: 'Verification Email Sent',
          description: result.message,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Failed to Resend',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>
            {verificationStatus === 'pending' && 'We are verifying your email address'}
            {verificationStatus === 'success' && 'Your email has been verified'}
            {verificationStatus === 'error' && 'There was a problem verifying your email'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isVerifying ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className={`p-4 rounded-md ${
                verificationStatus === 'success' ? 'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-100' :
                verificationStatus === 'error' ? 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-100' :
                'bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
              }`}>
                <p>{message}</p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          {verificationStatus === 'success' && (
            <Button 
              className="w-full" 
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </Button>
          )}
          
          {verificationStatus === 'error' && (
            <div className="w-full space-y-2">
              {!token && user && (
                <Button 
                  className="w-full" 
                  variant="outline" 
                  onClick={handleResendVerification}
                  disabled={isResending}
                >
                  {isResending ? 'Sending...' : 'Resend Verification Email'}
                </Button>
              )}
              <Button 
                className="w-full" 
                onClick={() => navigate('/')}
              >
                Return to Home
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}