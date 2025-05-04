import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Mail, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VerificationBannerProps {
  userEmail: string;
  onResendVerification: () => Promise<void>;
}

const VerificationBanner: React.FC<VerificationBannerProps> = ({ 
  userEmail, 
  onResendVerification 
}) => {
  const [isResending, setIsResending] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { toast } = useToast();

  const handleResendClick = async () => {
    setIsResending(true);
    setSuccessMessage('');
    
    try {
      await onResendVerification();
      setSuccessMessage(`Verification email sent to ${userEmail}`);
      toast({
        title: "Verification email sent",
        description: `We've sent a verification email to ${userEmail}. Please check your inbox.`,
      });
    } catch (error) {
      toast({
        title: "Failed to send verification email",
        description: "Please try again later or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md mb-6">
      <div className="p-4 flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
        </div>
        <div className="ml-3 flex-1">
          <div className="text-sm text-yellow-700 dark:text-yellow-300">
            <p className="font-medium mb-1">Your email address is not verified</p>
            <p className="mb-3">
              Please verify your email address to unlock all features. We've sent a verification link to <strong>{userEmail}</strong>.
            </p>
            {successMessage ? (
              <div className="flex items-center text-green-600 dark:text-green-400 mb-3">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                <span>{successMessage}</span>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                size="sm"
                className="bg-white dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-800/70"
                onClick={handleResendClick}
                disabled={isResending}
              >
                <Mail className="mr-1 h-4 w-4" />
                {isResending ? 'Sending...' : 'Resend Verification Email'}
              </Button>
              <Button
                variant="link"
                size="sm"
                className="text-yellow-700 dark:text-yellow-300 hover:text-yellow-800 dark:hover:text-yellow-200"
                onClick={() => window.open('mailto:support@caraxfinance.com', '_blank')}
              >
                Contact Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationBanner;