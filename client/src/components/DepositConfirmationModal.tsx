import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  AlertCircle,
  Wallet,
  Send,
  RefreshCw,
  Upload,
  FileImage
} from 'lucide-react';

interface DepositConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  depositData: {
    amount: string;
    selectedPlan: string;
    selectedMethod: string;
    walletAddress: string;
    planName: string;
  } | null;
}

// API function for submitting deposit confirmation
const submitDepositConfirmation = async (userId: number, confirmationData: any) => {
  const response = await fetch('/api/transactions/deposit/confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      userId,
      ...confirmationData
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to submit deposit confirmation');
  }

  return response.json();
};

const DepositConfirmationModal: React.FC<DepositConfirmationModalProps> = ({
  isOpen,
  onClose,
  depositData
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [transactionHash, setTransactionHash] = useState('');
  const [proofOfPayment, setProofOfPayment] = useState<File | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Submit deposit confirmation mutation
  const confirmDepositMutation = useMutation({
    mutationFn: (data: any) => submitDepositConfirmation(user?.id as number, data),
    onSuccess: (response) => {
      toast({
        title: 'Deposit Confirmed!',
        description: 'Your deposit has been submitted for processing. You will receive an email confirmation shortly.',
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['deposits'] });
      queryClient.invalidateQueries({ queryKey: ['depositsHistory'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      // Reset form and close modal
      setTransactionHash('');
      setProofOfPayment(null);
      setAdditionalNotes('');
      onClose();
    },
    onError: (error: any) => {
      console.error('Deposit confirmation error:', error);
      toast({
        title: 'Confirmation Failed',
        description: error.message || 'Failed to confirm deposit. Please try again.',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!depositData) {
      toast({
        title: 'Error',
        description: 'Missing deposit information. Please try again.',
        variant: 'destructive'
      });
      return;
    }

    if (!transactionHash.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please provide the transaction hash/ID.',
        variant: 'destructive'
      });
      return;
    }

    const confirmationData = {
      ...depositData,
      transactionHash: transactionHash.trim(),
      additionalNotes: additionalNotes.trim(),
      proofOfPayment: proofOfPayment?.name || null,
      confirmedAt: new Date().toISOString()
    };

    confirmDepositMutation.mutate(confirmationData);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: 'Wallet address copied to clipboard.',
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy to clipboard. Please copy manually.',
        variant: 'destructive'
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type and size
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload an image (JPG, PNG, GIF) or PDF file.',
          variant: 'destructive'
        });
        return;
      }

      if (file.size > maxSize) {
        toast({
          title: 'File Too Large',
          description: 'Please upload a file smaller than 5MB.',
          variant: 'destructive'
        });
        return;
      }

      setProofOfPayment(file);
      toast({
        title: 'File Selected',
        description: `${file.name} has been selected for upload.`,
      });
    }
  };

  if (!depositData) return null;

  const getPlanBadge = (plan: string) => {
    const planColors = {
      'starter': 'bg-green-100 text-green-800',
      'premium': 'bg-blue-100 text-blue-800',
      'delux': 'bg-purple-100 text-purple-800',
      'luxury': 'bg-amber-100 text-amber-800'
    };
    
    const colorClass = planColors[plan.toLowerCase() as keyof typeof planColors] || 'bg-gray-100 text-gray-800';
    
    return (
      <Badge className={colorClass}>
        {depositData.planName || plan.toUpperCase() + ' PLAN'}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Confirm Your Deposit
          </DialogTitle>
          <DialogDescription>
            Please complete your payment and provide the transaction details below
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Deposit Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Deposit Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Amount</Label>
                  <p className="text-lg font-bold text-green-600">${depositData.amount}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Plan</Label>
                  <div className="mt-1">{getPlanBadge(depositData.selectedPlan)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Payment Method</Label>
                  <p className="text-sm font-medium capitalize">{depositData.selectedMethod}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <Badge className="bg-yellow-100 text-yellow-800">Pending Confirmation</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Payment Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Send Payment To:</h4>
                <div className="flex items-center gap-2 p-3 bg-white rounded border">
                  <code className="flex-1 text-sm font-mono break-all">{depositData.walletAddress}</code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(depositData.walletAddress)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">Important:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Send exactly <strong>${depositData.amount}</strong> to the wallet address above</li>
                      <li>• Make sure to use the correct network for your cryptocurrency</li>
                      <li>• Keep your transaction hash/ID for confirmation</li>
                      <li>• Deposits typically process within 1-24 hours</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Confirmation Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Confirm Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="transactionHash">Transaction Hash/ID *</Label>
                  <Input
                    id="transactionHash"
                    type="text"
                    value={transactionHash}
                    onChange={(e) => setTransactionHash(e.target.value)}
                    placeholder="Enter your transaction hash or ID"
                    required
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This is the unique identifier for your payment transaction
                  </p>
                </div>

                <div>
                  <Label htmlFor="proofOfPayment">Proof of Payment (Optional)</Label>
                  <div className="mt-1">
                    <input
                      id="proofOfPayment"
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                      aria-label="Upload proof of payment"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('proofOfPayment')?.click()}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {proofOfPayment ? proofOfPayment.name : 'Upload Screenshot or Receipt'}
                    </Button>
                  </div>
                  {proofOfPayment && (
                    <div className="flex items-center gap-2 mt-2 p-2 bg-green-50 rounded">
                      <FileImage className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800">{proofOfPayment.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setProofOfPayment(null)}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
                  <textarea
                    id="additionalNotes"
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Any additional information about your payment..."
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                    disabled={confirmDepositMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={confirmDepositMutation.isPending || !transactionHash.trim()}
                  >
                    {confirmDepositMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Confirm Deposit
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DepositConfirmationModal;
