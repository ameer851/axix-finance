import React, { useState } from 'react';
import { Link } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Home } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';

const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

const ForgotPassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      // In a real application, we would call an API endpoint
      await apiRequest('POST', '/api/auth/forgot-password', { email: values.email });
      
      setIsSuccess(true);
      toast({
        title: "Reset link sent",
        description: "If this email is associated with an account, you will receive password reset instructions.",
      });
    } catch (error: any) {
      // Even if the email doesn't exist, we still show the success message for security reasons
      setIsSuccess(true);
      toast({
        title: "Reset link sent",
        description: "If this email is associated with an account, you will receive password reset instructions.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-900 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center items-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-xl">C</div>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Reset your password</CardTitle>
          <CardDescription className="text-center">
            Enter your email to receive a password reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <div className="text-center">
              <div className="mb-4 text-green-500 text-lg font-semibold">Email Sent!</div>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                If this email is associated with an account, you'll receive instructions to reset your password.
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                Don't forget to check your spam folder if you don't see the email in your inbox.
              </p>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your.email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending reset link..." : "Send reset link"}
                </Button>
                <div className="mt-4 text-center">
                  <Link href="/" className="text-primary-600 hover:text-primary-500 dark:text-primary-400 flex items-center justify-center">
                    <Home className="h-4 w-4 mr-1" /> Back to Homepage
                  </Link>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Remember your password?{' '}
            <Link href="/login" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ForgotPassword;