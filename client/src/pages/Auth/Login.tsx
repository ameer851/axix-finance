import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import apiFetch from "@/utils/apiFetch";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, Home } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation } from "wouter";
import { z } from "zod";

const formSchema = z.object({
  identifier: z.string().min(1, { message: "Email or username is required" }),
  password: z.string().min(1, { message: "Password is required" }),
  rememberMe: z.boolean().optional(),
});

const Login: React.FC = () => {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isServerAvailable, setIsServerAvailable] = useState<boolean>(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkServer = async () => {
      try {
        // Use ultra-fast ping first to avoid JSON/parsing overhead during cold starts
        const ping = await fetch("/api/ping", { cache: "no-store" });
        if (!ping.ok) throw new Error("Ping failed");
        setIsServerAvailable(true);
        // Warm-up health in background
        apiFetch("/api/health", {
          timeout: 3000,
          headers: { Accept: "application/json" },
        }).catch(() => {});
      } catch (error: any) {
        console.error("Server connection check failed:", error);
        setIsServerAvailable(false);
      }
    };
    checkServer();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setLoginError(null);
    setIsAuthenticating(true);

    // Special handling for admin login attempts
    const isAdminLogin =
      values.identifier.toLowerCase() === "admin@axixfinance.com" ||
      values.identifier.toLowerCase() === "admin";

    if (isAdminLogin) {
      console.log("🔐 Admin login attempt detected");
      // Show a special toast for admin login
      toast({
        title: "Admin Login",
        description: "Attempting to login as administrator...",
        variant: "default",
      });
    }

    try {
      if (!isServerAvailable) {
        throw new Error(
          "Server connection failed. Please check your internet connection or try again later."
        );
      }

      // Simulated loading for better UX
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const userData = await login(values.identifier, values.password);

      toast({
        title: `Welcome back, ${userData.username || userData.firstName || values.identifier}! 🎉`,
        description: "Successfully logged into your account",
      });

      await new Promise((resolve) => setTimeout(resolve, 500));

      if (userData.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      let errorMessage = "An unexpected error occurred. Please try again.";
      let errorTitle = "Login Failed";

      // Handle error object with message and error properties
      const errorObj = error.response?.data || error;
      const errorCode = errorObj.error;
      const errorMsg = errorObj.message || error.message;

      // Handle specific error cases
      if (
        errorMsg?.toLowerCase().includes("deactivated") ||
        errorCode === "account_deactivated" ||
        (errorCode === "invalid_credentials" &&
          errorMsg?.toLowerCase().includes("deactivated"))
      ) {
        errorMessage =
          "Your account has been deactivated. Please contact our support team at support@axixfinance.com for assistance with reactivating your account.";
        errorTitle = "Account Deactivated";

        // If this is the admin account, provide a hint to run the activation script
        if (
          values.identifier.toLowerCase() === "admin@axixfinance.com" ||
          values.identifier.toLowerCase() === "admin"
        ) {
          // Use the same generic deactivation message for admin
          errorMessage =
            "Your account has been deactivated. Please contact our support team at support@axixfinance.com for assistance with reactivating your account.";
        }
      } else if (
        errorCode === "invalid_credentials" &&
        !errorMsg?.toLowerCase().includes("deactivated")
      ) {
        errorMessage =
          "Invalid username or password. Please check your credentials and try again.";
        errorTitle = "Invalid Credentials";
      } else if (errorMsg?.toLowerCase().includes("network")) {
        errorMessage =
          "Network connection error. Please check your internet connection and try again.";
        errorTitle = "Connection Error";
      } else if (errorMsg?.toLowerCase().includes("verify")) {
        errorMessage =
          "Please verify your email address before logging in. Check your inbox for the verification email.";
        errorTitle = "Email Verification Required";
      } else if (errorMsg?.toLowerCase().includes("blocked")) {
        errorMessage =
          "Your account has been temporarily blocked due to multiple failed login attempts. Please try again in 30 minutes or reset your password.";
        errorTitle = "Account Blocked";
      } else if (errorMsg?.toLowerCase().includes("maintenance")) {
        errorMessage =
          "System is under maintenance. Please try again in a few minutes.";
        errorTitle = "System Maintenance";
      }

      console.error("Login error details:", {
        errorCode,
        errorMessage: errorMsg,
        fullError: error,
      });

      setLoginError(errorMessage);
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="w-full max-w-md relative z-10 p-4">
        <Card className="backdrop-blur-sm bg-white/90 dark:bg-neutral-900/90 shadow-xl">
          <CardHeader className="space-y-1">
            <div className="flex flex-col items-center">
              <h1 className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                Axix Finance
              </h1>
            </div>
            <CardTitle className="text-2xl text-center mt-4">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center">
              Sign in to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Alerts without animation */}
            {!isServerAvailable && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Server connection failed. Please try again later.
                </AlertDescription>
              </Alert>
            )}
            {loginError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="identifier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email or Username</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            disabled={isAuthenticating}
                            className="pr-10"
                            placeholder="Enter your email or username"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            {...field}
                            disabled={isAuthenticating}
                            className="pr-10"
                            placeholder="Enter your password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="rememberMe"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isAuthenticating}
                        />
                        <label
                          htmlFor="rememberMe"
                          className="text-sm text-gray-600 dark:text-gray-400"
                        >
                          Remember me
                        </label>
                      </div>
                    )}
                  />
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary-600 hover:text-primary-500"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Button
                  type="submit"
                  className="w-full relative overflow-hidden"
                  disabled={isAuthenticating}
                >
                  {isAuthenticating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white" />
                      Signing in...
                    </span>
                  ) : (
                    <span>Sign in</span>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="text-primary-600 hover:text-primary-500"
              >
                Sign up
              </Link>
            </div>
            <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
              <Link href="/">
                <Home className="h-4 w-4 mr-1" />
                Back to Homepage
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
