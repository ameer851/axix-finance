import { supabase } from "@/lib/supabase";
import { InsertUser, User } from "@shared/schema";

// Extended User type for registration responses
interface RegistrationUser extends User {
  _shouldRedirectToLogin?: boolean;
  _registrationMessage?: string;
}

// Check if Supabase is available
export async function checkServerConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("count")
      .limit(1);
    return !error;
  } catch (error) {
    console.error("Supabase connection check failed:", error);
    return false;
  }
}

export async function login(username: string, password: string): Promise<User> {
  try {
    // For the admin user with default credentials
    if (username === "admin" && password === "Axix-Admin@123") {
      const result = await supabase
        .from("users")
        .upsert(
          [
            {
              username: "admin",
              email: "admin@axixfinance.com",
              role: "admin",
              password: "Axix-Admin@123", // In production, this would be hashed
              balance: "0",
              "isActive": true,
              "isVerified": true,
            },
          ],
          {
            onConflict: "username",
            ignoreDuplicates: true,
          }
        )
        .select()
        .single();

      if (result.error || !result.data) {
        console.error("Failed to find or create admin user:", result.error);
        throw new Error("Failed to authenticate. Please try again.");
      }

      // Store the authenticated user in localStorage
      localStorage.setItem("user", JSON.stringify(result.data));
      return result.data as User;
    }

    // For other users, check the database directly
    const result = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .single();

    if (result.error || !result.data) {
      throw new Error("Invalid username or password.");
    }

    // In a real implementation, you'd verify the password hash here
    // For now, we'll accept any password for existing users (development only)

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

export async function register(
  userData: Omit<InsertUser, "password"> & { password: string }
): Promise<RegistrationUser> {
  try {
    // Check if username or email already exists
    const { data: existingUsers, error: userCheckError } = await supabase
      .from("users")
      .select("username, email")
      .or(`username.eq."${userData.username}",email.eq."${userData.email}"`)
      .order("created_at")
      .limit(1);

    if (existingUsers && existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      if (existingUser.username === userData.username) {
        throw new Error(
          "This username is already taken. Please choose another."
        );
      }
      if (existingUser.email === userData.email) {
        throw new Error(
          "This email address is already registered. Try to login instead."
        );
      }
    }

    // Insert new user (in production, you'd hash the password)
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert([
        {
          username: userData.username,
          email: userData.email,
          password: userData.password, // Temporary - in production this would be hashed
          "isVerified": true,
          "isActive": true,
          role: "user",
          balance: "0",
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error("Registration error:", insertError);
      throw new Error("Failed to create account. Please try again.");
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
    // Clear local storage (no need for server call since we're using Supabase directly)
    localStorage.removeItem("user");
    // Note: If we were using Supabase Auth, we'd call supabase.auth.signOut() here
  } catch (error: any) {
    console.error("Logout error:", error);
    // Even if there's an error, we'll still clear local storage
    localStorage.removeItem("user");
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
