import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { updateEmail } from "@/services/emailService";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Download,
  Key,
  Mail,
  Plus,
  Shield,
  Upload,
  User as UserIcon,
} from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const profileFormSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  country: z.string().min(1, "Please select a country"),
  phone: z.string().optional(),
});

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

const Settings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [emailChangeRequested, setEmailChangeRequested] = useState(false);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      country: "france", // Default to France for Axix Finance
      phone: "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update profile function
  const onProfileSubmit = async (data: ProfileFormValues) => {
    try {
      // Check if email is being updated
      if (data.email !== user?.email) {
        // Call the email change service
        const result = await updateEmail(data.email);

        if (!result.success) {
          throw new Error(result.message || "Failed to update email");
        }

        // Show success message but don't update UI until verified
        profileForm.setValue("email", user?.email || ""); // Reset to current email
        toast({
          title: "Verification email sent",
          description:
            "Please check your inbox and verify your new email address",
          variant: "default",
        });
        setEmailChangeRequested(true);
        return;
      }

      // For other profile fields, update normally
      const result = await apiFetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
        }),
      });

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.message || "An error occurred while updating your profile",
        variant: "destructive",
      });
    }
  };

  // Update password function
  const onPasswordSubmit = (data: PasswordFormValues) => {
    // This would call an API to update the user's password in a real implementation
  };

  // Function to handle enabling/disabling 2FA
  const handle2FAToggle = (enabled: boolean) => {
    // This would call an API to update the user's 2FA settings in a real implementation
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };

  const userFullName = user ? `${user.firstName} ${user.lastName}` : "User";
  const userInitials = getInitials(userFullName);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
        Account Settings
      </h1>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full md:w-[600px]">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>
                  Manage your personal information and how it appears on your
                  account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex flex-col items-center gap-4">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src="" alt={userFullName} />
                      <AvatarFallback className="text-xl">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Change Photo
                    </Button>
                  </div>
                  <div className="flex-1">
                    <Form {...profileForm}>
                      <form
                        onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" />
                              </FormControl>
                              {emailChangeRequested && (
                                <p className="text-xs text-amber-500 mt-1">
                                  Email change requested. Check your inbox to
                                  verify your new email address.
                                </p>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="country"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Country</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a country" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="france">
                                      France
                                    </SelectItem>
                                    <SelectItem value="germany">
                                      Germany
                                    </SelectItem>
                                    <SelectItem value="uk">
                                      United Kingdom
                                    </SelectItem>
                                    <SelectItem value="us">
                                      United States
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <Input {...field} type="tel" />
                                </FormControl>
                                <FormDescription>
                                  For authentication purposes
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button type="submit" className="mt-4">
                          Save Changes
                        </Button>
                      </form>
                    </Form>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
                <CardDescription>
                  Details about your account verification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm">Email Verified</span>
                    </div>
                    <span className="text-sm text-green-500 font-medium">
                      Complete
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <UserIcon className="h-5 w-5 text-amber-500 mr-2" />
                      <span className="text-sm">Identity Verification</span>
                    </div>
                    <span className="text-sm text-amber-500 font-medium">
                      {user?.isVerified ? "Verified" : "Pending"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 text-amber-500 mr-2" />
                      <span className="text-sm">Two-Factor Authentication</span>
                    </div>
                    <span className="text-sm text-amber-500 font-medium">
                      {user?.twoFactorEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                {!user?.isVerified && (
                  <Button variant="outline" className="w-full">
                    Complete Verification
                  </Button>
                )}
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Referral Program</CardTitle>
                <CardDescription>Share and earn rewards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Share your referral link and earn 10% commission on all
                    investments made by your referrals.
                  </p>
                  <div className="bg-gray-100 dark:bg-neutral-800 p-3 rounded-md">
                    <p className="text-sm font-mono break-all">
                      https://axixfinance.com/ref/{user?.id || "xxxxx"}
                    </p>
                  </div>
                  <Button variant="outline" className="w-full">
                    Copy Referral Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form
                    onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormDescription>
                            Must be at least 8 characters with uppercase,
                            lowercase, number and special character
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="mt-4">
                      Update Password
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">2FA Authentication</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user?.twoFactorEnabled
                        ? "Two-factor authentication is currently enabled."
                        : "Enable two-factor authentication for enhanced security."}
                    </p>
                  </div>
                  <Switch
                    checked={user?.twoFactorEnabled || false}
                    onCheckedChange={handle2FAToggle}
                  />
                </div>

                {!user?.twoFactorEnabled && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Recommended</AlertTitle>
                    <AlertDescription>
                      We strongly recommend enabling two-factor authentication
                      for additional account security.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Log</CardTitle>
                <CardDescription>Recent security events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Key className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm font-medium">Login</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        Today, 12:34 PM
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Successful login from Paris, France
                    </p>
                  </div>
                  <div className="border-b pb-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm font-medium">
                          Email Changed
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">Yesterday</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Your email address was updated
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="link" className="px-0">
                  View Full Security Log
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>
                  Manage your payment methods for deposits and withdrawals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center">
                      <CreditCard className="h-10 w-10 text-primary-600 mr-4" />
                      <div>
                        <p className="font-medium">Credit/Debit Card</p>
                        <p className="text-sm text-gray-500">
                          Visa ending in 4242
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        Remove
                      </Button>
                    </div>
                  </div>

                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Payment Method
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Withdrawal Settings</CardTitle>
                <CardDescription>
                  Configure your withdrawal preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdrawal-address">
                    Default Withdrawal Address
                  </Label>
                  <Input
                    id="withdrawal-address"
                    placeholder="Enter your withdrawal address"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Switch id="withdrawal-confirmation" />
                  <Label htmlFor="withdrawal-confirmation">
                    Require email confirmation for withdrawals
                  </Label>
                </div>
                <Button className="w-full">Save Withdrawal Settings</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>View your recent payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  <p>No payment history available.</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="link" className="w-full">
                  View All Transactions
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* Data Tab */}
        <TabsContent value="data">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Data and Privacy</CardTitle>
                <CardDescription>
                  Manage your data and privacy settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Your Data</h3>{" "}
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Axix Finance collects and processes your personal data in
                    accordance with our Privacy Policy. You can download a copy
                    of your data or request data deletion.
                  </p>
                </div>
                <div className="flex gap-4">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                  >
                    Request Data Deletion
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Communication Preferences</CardTitle>
                <CardDescription>
                  Manage how we communicate with you
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Transaction Emails</p>
                    <p className="text-xs text-gray-500">
                      Notifications about your transactions
                    </p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Marketing Emails</p>
                    <p className="text-xs text-gray-500">
                      News, updates, and promotions
                    </p>
                  </div>
                  <Switch defaultChecked={false} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Security Alerts</p>
                    <p className="text-xs text-gray-500">
                      Important security notifications
                    </p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Save Preferences</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sessions</CardTitle>
                <CardDescription>Manage your active sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium">Current Session</p>
                        <p className="text-xs text-gray-500">
                          Paris, France - Chrome on Windows
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full text-red-600 hover:text-red-700"
                >
                  Sign Out All Devices
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
