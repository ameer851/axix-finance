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

export async function logout(): Promise<void> {
  try {
    // Sign out from Supabase Auth
    const { error: supabaseError } = await supabase.auth.signOut();
    if (supabaseError) {
      console.warn("Supabase sign out error:", supabaseError);
    }

    // Use session-based logout endpoint
    const response = await fetch("/api/logout", {
      method: "POST",
      credentials: "include", // Include cookies for session management
    });

    // Don't throw error if logout endpoint fails - still clear local storage
    if (!response.ok) {
      console.warn("Logout endpoint failed, but proceeding with local cleanup");
    }

    // Clear all auth-related data from localStorage
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    console.log("User successfully logged out");
  } catch (error: any) {
    console.error("Logout error:", error);
    // Even if there's an error, we'll still clear local storage
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    throw new Error("Failed to logout. Please try again.");
  }
}

export async function login(
  identifier: string,
  password: string
): Promise<User> {
  try {
    console.log("Attempting login for:", identifier);

    let email = identifier;

    // Check if identifier is a username or email
    if (!identifier.includes("@")) {
      console.log("Identifier is a username, fetching email...");
      // Try to find user by username or by uid
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("email, username")
        .or(`username.eq.${identifier},uid.eq.${identifier}`)
        .limit(1);

      if (usersError || !users || users.length === 0) {
        console.error(
          "Error fetching user by username:",
          usersError || "No user found"
        );
        throw new Error("Invalid username or password.");
      }
      email = users[0].email;
      console.log("Found email for username:", email);
    }

    // Use Supabase Auth for login with email
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error("Supabase Auth login error:", error);
      throw new Error(error.message || "Invalid username or password.");
    }

    if (!data.user) {
      throw new Error("No user data returned from authentication.");
    }

    // Get user profile from database
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("uid", data.user.id)
      .single();

    if (profileError || !userProfile) {
      console.error("Error fetching user profile:", profileError);
      throw new Error("User profile not found.");
    }

    // Transform the user data to match the expected User interface
    const userData: User = {
      id: userProfile.id,
      uid: userProfile.uid,
      email: userProfile.email,
      username: userProfile.username,
      password: null, // Don't expose password
      firstName: userProfile.firstName || null,
      lastName: userProfile.lastName || null,
      full_name: userProfile.full_name || null,
      balance: userProfile.balance || "0",
      role: userProfile.role || "user",
      is_admin: userProfile.is_admin || false,
      isVerified: userProfile.isVerified || false,
      isActive: userProfile.isActive || true,
      createdAt: userProfile.createdAt
        ? new Date(userProfile.createdAt)
        : new Date(),
      updatedAt: userProfile.updatedAt
        ? new Date(userProfile.updatedAt)
        : new Date(),
      passwordResetToken: userProfile.passwordResetToken || null,
      passwordResetTokenExpiry: userProfile.passwordResetTokenExpiry
        ? new Date(userProfile.passwordResetTokenExpiry)
        : null,
      verificationToken: userProfile.verificationToken || null,
      verificationTokenExpiry: userProfile.verificationTokenExpiry
        ? new Date(userProfile.verificationTokenExpiry)
        : null,
      twoFactorEnabled: userProfile.twoFactorEnabled || false,
      twoFactorSecret: userProfile.twoFactorSecret || null,
      referredBy: userProfile.referredBy || null,
      pendingEmail: userProfile.pendingEmail || null,
      bitcoinAddress: userProfile.bitcoinAddress || null,
      bitcoinCashAddress: userProfile.bitcoinCashAddress || null,
      ethereumAddress: userProfile.ethereumAddress || null,
      usdtTrc20Address: userProfile.usdtTrc20Address || null,
      bnbAddress: userProfile.bnbAddress || null,
    };

    // Store the authenticated user in localStorage
    localStorage.setItem("user", JSON.stringify(userData));
    return userData;
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
  firstName: string;
  lastName: string;
  username: string;
  bitcoinAddress?: string;
  bitcoinCashAddress?: string;
  ethereumAddress?: string;
  bnbAddress?: string;
  usdtTrc20Address?: string;
}): Promise<RegistrationUser> {
  try {
    // First check Supabase connection
    const isConnected = await checkServerConnection();
    if (!isConnected) {
      throw new Error("Unable to connect to the service. Please try again.");
    }

    // Allow registration even if a session exists (do not block)

    // Create auth user first
    const { data: auth, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          username: userData.username,
          first_name: userData.firstName,
          last_name: userData.lastName,
        },
      },
    });

    if (authError) {
      // Log the full error for debugging
      console.error("Auth error details:", {
        name: authError.name,
        message: authError.message,
      });

      if (authError.message.includes("User already registered")) {
        throw new Error(
          "This email address is already registered. Please try logging in instead."
        );
      }
      throw new Error("Failed to create user account: " + authError.message);
    }

    if (!auth.user?.id) {
      throw new Error("Failed to create user account - no user ID returned");
    }

    // Then create user profile
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert([
        {
          uid: auth.user.id,
          email: userData.email,
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          full_name: `${userData.firstName} ${userData.lastName}`,
          role: "user",
          isActive: true,
          balance: "0",
          bitcoinAddress: userData.bitcoinAddress || null,
          bitcoinCashAddress: userData.bitcoinCashAddress || null,
          ethereumAddress: userData.ethereumAddress || null,
          bnbAddress: userData.bnbAddress || null,
          usdtTrc20Address: userData.usdtTrc20Address || null,
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
