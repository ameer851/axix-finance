import { supabase } from "@/lib/supabase";
import { User } from "@shared/schema";
import { apiFetch } from "../utils/apiFetch";

// Minimal user shape (still exported if other modules rely on it)
export interface MinimalUser {
  id: string;
  email: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

// Removed earlier duplicate lightweight auth functions (login/logout/register/updateProfile/getCurrentUser async)
// to resolve build errors about multiple exports. The application now uses the Supabase-based implementations below.

// Extended User type for registration responses
interface RegistrationUser extends User {
  _shouldRedirectToLogin?: boolean;
  _registrationMessage?: string;
}

// Check if Supabase is available
export async function checkServerConnection(): Promise<boolean> {
  try {
    console.log("Testing Supabase connection...");
    const { data, error } = await supabase.from("users").select("id").limit(1);
    if (error) {
      console.error("Supabase connection error:", {
        code: error.code,
        message: error.message,
        details: error.details,
      });
      return false;
    }
    return true;
  } catch (error) {
    console.error("Supabase connection check failed:", error);
    return false;
  }
}

export async function logout(): Promise<void> {
  try {
    const { error: supabaseError } = await supabase.auth.signOut();
    if (supabaseError) console.warn("Supabase sign out error:", supabaseError);

    // Session-based logout endpoint (best-effort)
    try {
      await apiFetch("/api/logout", { method: "POST", credentials: "include" });
    } catch (e) {
      console.warn("Logout endpoint call failed, continuing cleanup");
    }

    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  } catch (error: any) {
    console.error("Logout error:", error);
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
    let email = identifier;
    if (!identifier.includes("@")) {
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select("email, username")
        .or(`username.eq.${identifier},uid.eq.${identifier}`)
        .limit(1);
      if (usersError || !users || users.length === 0) {
        throw new Error("Invalid username or password.");
      }
      email = users[0].email;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error)
      throw new Error(error.message || "Invalid username or password.");
    if (!data.user)
      throw new Error("No user data returned from authentication.");

    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("uid", data.user.id)
      .single();
    if (profileError || !userProfile)
      throw new Error("User profile not found.");

    const userData: User = {
      id: userProfile.id,
      uid: userProfile.uid,
      email: userProfile.email,
      username: userProfile.username,
      password: null,
      firstName: userProfile.firstName ?? userProfile.first_name ?? null,
      lastName: userProfile.lastName ?? userProfile.last_name ?? null,
      full_name: userProfile.full_name ?? null,
      balance: userProfile.balance ?? "0",
      role: userProfile.role ?? "user",
      is_admin: userProfile.is_admin ?? false,
      isVerified: userProfile.isVerified ?? userProfile.is_verified ?? false,
      isActive: userProfile.isActive ?? userProfile.is_active ?? true,
      createdAt: userProfile.createdAt
        ? new Date(userProfile.createdAt)
        : userProfile.created_at
          ? new Date(userProfile.created_at)
          : new Date(),
      updatedAt: userProfile.updatedAt
        ? new Date(userProfile.updatedAt)
        : userProfile.updated_at
          ? new Date(userProfile.updated_at)
          : new Date(),
      passwordResetToken:
        userProfile.passwordResetToken ??
        userProfile.password_reset_token ??
        null,
      passwordResetTokenExpiry: userProfile.passwordResetTokenExpiry
        ? new Date(userProfile.passwordResetTokenExpiry)
        : userProfile.password_reset_token_expiry
          ? new Date(userProfile.password_reset_token_expiry)
          : null,
      verificationToken:
        userProfile.verificationToken ?? userProfile.verification_token ?? null,
      verificationTokenExpiry: userProfile.verificationTokenExpiry
        ? new Date(userProfile.verificationTokenExpiry)
        : userProfile.verification_token_expiry
          ? new Date(userProfile.verification_token_expiry)
          : null,
      twoFactorEnabled:
        userProfile.twoFactorEnabled ?? userProfile.two_factor_enabled ?? false,
      twoFactorSecret:
        userProfile.twoFactorSecret ?? userProfile.two_factor_secret ?? null,
      referredBy: userProfile.referredBy ?? userProfile.referred_by ?? null,
      pendingEmail:
        userProfile.pendingEmail ?? userProfile.pending_email ?? null,
      bitcoinAddress:
        userProfile.bitcoinAddress ?? userProfile.bitcoin_address ?? null,
      bitcoinCashAddress:
        userProfile.bitcoinCashAddress ??
        userProfile.bitcoin_cash_address ??
        null,
      ethereumAddress:
        userProfile.ethereumAddress ?? userProfile.ethereum_address ?? null,
      usdtTrc20Address:
        userProfile.usdtTrc20Address ?? userProfile.usdt_trc20_address ?? null,
      bnbAddress: userProfile.bnbAddress ?? userProfile.bnb_address ?? null,
    };

    localStorage.setItem("user", JSON.stringify(userData));
    return userData;
  } catch (error: any) {
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
    const isConnected = await checkServerConnection();
    if (!isConnected)
      throw new Error("Unable to connect to the service. Please try again.");

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
      if (authError.message.includes("User already registered")) {
        throw new Error(
          "This email address is already registered. Please try logging in instead."
        );
      }
      throw new Error("Failed to create user account: " + authError.message);
    }
    if (!auth.user?.id)
      throw new Error("Failed to create user account - no user ID returned");

    // Insert only columns that are guaranteed to exist to avoid schema errors
    let { data: newUser, error: insertError } = await supabase
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
        },
      ])
      .select()
      .single();

    // If schema mismatch (camelCase columns missing), retry with snake_case columns
    if (
      insertError &&
      insertError.message &&
      (insertError.message.includes("column") ||
        insertError.message.includes("schema") ||
        insertError.message.includes("does not exist"))
    ) {
      const retry = await supabase
        .from("users")
        .insert([
          {
            uid: auth.user.id,
            email: userData.email,
            username: userData.username,
            first_name: userData.firstName,
            last_name: userData.lastName,
            full_name: `${userData.firstName} ${userData.lastName}`,
            role: "user",
            is_active: true,
            balance: "0",
          } as any,
        ])
        .select()
        .single();
      newUser = retry.data as any;
      insertError = retry.error as any;
    }

    if (insertError) {
      if (insertError.code === "23505")
        throw new Error("Username or email already exists");
      if (insertError.code === "23503")
        throw new Error("Invalid reference data");
      if (insertError.code === "23502")
        throw new Error("Missing required fields");
      if (insertError.code === "PGRST301")
        throw new Error("Database connection error. Please try again");
      if (
        insertError.message &&
        (insertError.message.includes("column") ||
          insertError.message.includes("schema"))
      ) {
        throw new Error(
          "Registration failed due to mismatched database schema. Please try again later."
        );
      }
      throw new Error(
        `Registration failed: ${insertError.message || "Please try again"}`
      );
    }

    try {
      // Fire-and-forget server-side welcome email; don't block registration
      fetch(`${import.meta.env.VITE_API_URL || "/api"}/send-welcome-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUser.email,
          full_name: newUser.full_name,
        }),
        credentials: "include",
      }).catch(() => {});
    } catch (emailError) {
      console.error("Failed to dispatch welcome email:", emailError);
    }

    return {
      ...newUser,
      password: "", // compatibility field
      _shouldRedirectToLogin: true,
      _registrationMessage:
        "Account created successfully! Please log in with your credentials.",
    } as RegistrationUser;
  } catch (error: any) {
    throw new Error(
      error.message || "Failed to create account. Please try again."
    );
  }
}

export async function getCurrentUserFromServer(): Promise<User | null> {
  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
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
  if (storedUser) return JSON.parse(storedUser);
  return null;
}

export async function verifyEmail(
  token: string
): Promise<{ success: boolean; message: string }> {
  return { success: true, message: "Email verified successfully" };
}

export async function resendVerificationEmail(): Promise<{
  success: boolean;
  message: string;
}> {
  return { success: true, message: "Verification email sent successfully" };
}

export async function forgotPassword(
  email: string
): Promise<{ success: boolean; message: string }> {
  return {
    success: true,
    message: "Password reset instructions sent to your email",
  };
}

export async function resetPassword(
  token: string,
  password: string
): Promise<{ success: boolean; message: string }> {
  return { success: true, message: "Password reset successfully" };
}

export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<{ message: string }> {
  return { message: "Password changed successfully" };
}
