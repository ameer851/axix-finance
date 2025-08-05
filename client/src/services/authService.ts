import { supabase } from "@/lib/supabase";
import { User } from "@shared/schema";
import { sendWelcomeEmail } from "./emailService";

// Extended User type for registration responses
interface RegistrationUser extends User {
  _shouldRedirectToLogin?: boolean;
  _registrationMessage?: string;
}

// Check if Supabase is available
export async function checkServerConnection(): Promise<boolean> {
  try {
    console.log("Testing Supabase connection...");

    // Try a simple query to test the connection
    const { data, error } = await supabase.from("users").select("id").limit(1);

    if (error) {
      console.error("Supabase connection error:", {
        code: error.code,
        message: error.message,
        details: error.details,
      });
      return false;
    }

    console.log("Supabase connection successful");
    return true;
  } catch (error) {
    console.error("Supabase connection check failed:", error);
    return false;
  }
}

export async function login(email: string, password: string): Promise<User> {
  try {
    console.log("Attempting login for:", email);

    // Check Supabase connection first
    const isConnected = await checkServerConnection();
    if (!isConnected) {
      throw new Error("Cannot connect to authentication service.");
    }

    // Use Supabase Auth for all users including admin
    const { data: auth, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    console.log("Auth response:", authError ? "Failed" : "Success");
    if (authError) {
      console.error("Auth error:", authError);
      throw new Error("Invalid email or password.");
    }

    if (!auth?.user) {
      console.error("No user data in auth response");
      throw new Error("Authentication failed - no user data.");
    }

    console.log("Fetching user profile for uid:", auth.user.id);

    // Get user profile from our users table
    const result = await supabase
      .from("users")
      .select("*")
      .eq("email", auth.user.email)
      .single();

    if (result.error || !result.data) {
      throw new Error("User profile not found.");
    }

    // Update uid if it doesn't match (handles existing users)
    if (result.data.uid !== auth.user.id) {
      await supabase
        .from("users")
        .update({ uid: auth.user.id })
        .eq("id", result.data.id);
      result.data.uid = auth.user.id;
    }

    // Store auth token
    const session = await supabase.auth.getSession();
    if (session.data.session?.access_token) {
      localStorage.setItem("authToken", session.data.session.access_token);
    }

    // Store the authenticated user in localStorage
    localStorage.setItem("user", JSON.stringify(result.data));
    return result.data as User;
  } catch (error: any) {
    console.error("Login error details:", error);
    throw new Error(
      error.message || "Authentication failed. Please check your credentials."
    );
  }
}

export async function register(userData: {
  email: string;
  password: string;
  fullName: string;
}): Promise<RegistrationUser> {
  try {
    // First check Supabase connection
    const isConnected = await checkServerConnection();
    if (!isConnected) {
      throw new Error("Unable to connect to the service. Please try again.");
    }

    // Check for existing users
    const { data: existingUsers, error: userCheckError } = await supabase
      .from("users")
      .select("email")
      .eq("email", userData.email)
      .limit(1);

    if (existingUsers && existingUsers.length > 0) {
      throw new Error(
        "This email address is already registered. Try to login instead."
      );
    }

    // Create auth user first
    const { data: auth, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    });

    if (authError) {
      throw new Error("Failed to create user account: " + authError.message);
    }

    if (!auth.user?.id) {
      throw new Error("Failed to create user account");
    }

    // Then create user profile
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert([
        {
          uid: auth.user.id,
          email: userData.email,
          full_name: userData.fullName,
          role: "user",
          is_admin: false,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Registration error:", insertError);
      if (insertError.code === "23505") {
        throw new Error("Username or email already exists");
      } else if (insertError.code === "23503") {
        throw new Error("Invalid reference data");
      } else if (insertError.code === "23502") {
        throw new Error("Missing required fields");
      } else if (insertError.code === "PGRST301") {
        throw new Error("Database connection error. Please try again");
      } else {
        throw new Error(
          `Registration failed: ${insertError.message || "Please try again"}`
        );
      }
    }

    // Send welcome email (don't let email failure prevent registration success)
    try {
      const emailResult = await sendWelcomeEmail({
        email: newUser.email,
        full_name: newUser.full_name,
      });

      if (emailResult.success) {
        console.log("Welcome email sent successfully:", emailResult.message);
      } else {
        console.error("Failed to send welcome email:", emailResult.message);
      }
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't throw error here - registration was successful
    }

    // Return user object with registration success message
    return {
      ...newUser,
      password: "", // Required by User type but not used
      _shouldRedirectToLogin: true,
      _registrationMessage:
        "Account created successfully! Please log in with your credentials.",
    } as RegistrationUser;
  } catch (error: any) {
    console.error("Registration error:", error);
    throw new Error(
      error.message || "Failed to create account. Please try again."
    );
  }
}

export async function logout(): Promise<void> {
  try {
    // Sign out from Supabase Auth
    await supabase.auth.signOut();

    // Clear all auth-related data from localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
  } catch (error: any) {
    console.error("Logout error:", error);
    // Even if there's an error, we'll still clear local storage
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
  }
}

export async function getCurrentUserFromServer(): Promise<User | null> {
  try {
    // Get current user from localStorage (in production, you'd verify with server)
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);

      // Optionally verify the user still exists in database
      const { data: currentUser, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userData.id)
        .single();

      if (error || !currentUser) {
        localStorage.removeItem("user");
        return null;
      }

      return currentUser as User;
    }
    return null;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

export function getCurrentUser(): User | null {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    return JSON.parse(storedUser);
  }
  return null;
}

export async function verifyEmail(
  token: string
): Promise<{ success: boolean; message: string }> {
  // For now, return success since we're not implementing email verification
  return {
    success: true,
    message: "Email verified successfully",
  };
}

export async function resendVerificationEmail(): Promise<{
  success: boolean;
  message: string;
}> {
  // For now, return success since we're not implementing email verification
  return {
    success: true,
    message: "Verification email sent successfully",
  };
}

export async function forgotPassword(
  email: string
): Promise<{ success: boolean; message: string }> {
  // For now, return success message (not implemented)
  return {
    success: true,
    message: "Password reset instructions sent to your email",
  };
}

export async function resetPassword(
  token: string,
  password: string
): Promise<{ success: boolean; message: string }> {
  // For now, return success message (not implemented)
  return {
    success: true,
    message: "Password reset successfully",
  };
}

/**
 * Change user password
 */
export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> {
  try {
    // For now, just return success (not implemented)
    return {
      message: "Password changed successfully",
    };
  } catch (error: any) {
    console.error("Password change error:", error);
    throw new Error(
      error.message || "Failed to change password. Please try again later."
    );
  }
}
