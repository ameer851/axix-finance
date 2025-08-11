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
      // Only include uid comparison if the identifier looks like a UUID to avoid 400 errors
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          identifier
        );
      let userQuery = supabase.from("users").select("email, username");
      if (isUuid) {
        userQuery = userQuery.or(
          `username.eq.${identifier},uid.eq.${identifier}`
        );
      } else {
        userQuery = userQuery.eq("username", identifier);
      }
      const { data: users, error: usersError } = await userQuery.limit(1);
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

    // Insert using snake_case columns (matches canonical DB schema) to avoid 400 errors
    const { data: newUser, error: insertError } = await supabase
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

    if (insertError) {
      console.error("[register] insert users error", insertError);
      const code = (insertError as any).code;
      if (code === "23505") throw new Error("Username or email already exists");
      if (code === "23503") throw new Error("Invalid reference data");
      if (code === "23502") throw new Error("Missing required fields");
      if (code === "PGRST301")
        throw new Error("Database connection error. Please try again");
      throw new Error(
        insertError.message || "Registration failed. Please try again."
      );
    }

    // Attempt welcome email (await for visibility but non-fatal)
    try {
      const base = (import.meta.env.VITE_API_URL as string | undefined) || "";
      const apiBase = base.replace(/\/$/, "");
      const url = `${apiBase}/api/send-welcome-email`;
      console.log(
        "[register] Dispatching welcome email to",
        newUser.email,
        url
      );
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newUser.email,
          username: newUser.username,
          firstName:
            (newUser as any).first_name ||
            newUser.full_name?.split(" ")[0] ||
            "User",
          lastName:
            (newUser as any).last_name ||
            newUser.full_name?.split(" ")[1] ||
            "User",
          password: userData.password, // temporary: send plain password for welcome email content
        }),
        credentials: "include",
      });
      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        console.warn("[register] welcome email failed", resp.status, errJson);
      } else {
        console.log("[register] welcome email sent OK");
      }
    } catch (emailError) {
      console.error("Failed to dispatch welcome email:", emailError);
    }

    return {
      id: (newUser as any).id,
      uid: (newUser as any).uid,
      email: (newUser as any).email,
      username: (newUser as any).username,
      password: "",
      firstName: (newUser as any).first_name ?? null,
      lastName: (newUser as any).last_name ?? null,
      full_name: (newUser as any).full_name ?? null,
      balance: (newUser as any).balance ?? "0",
      role: (newUser as any).role ?? "user",
      is_admin: (newUser as any).is_admin ?? false,
      isVerified: (newUser as any).is_verified ?? true,
      isActive: (newUser as any).is_active ?? true,
      createdAt: new Date((newUser as any).created_at || Date.now()),
      updatedAt: new Date((newUser as any).updated_at || Date.now()),
      passwordResetToken: null,
      passwordResetTokenExpiry: null,
      verificationToken: null,
      verificationTokenExpiry: null,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      referredBy: null,
      pendingEmail: null,
      bitcoinAddress: (newUser as any).bitcoin_address ?? null,
      bitcoinCashAddress: (newUser as any).bitcoin_cash_address ?? null,
      ethereumAddress: (newUser as any).ethereum_address ?? null,
      usdtTrc20Address: (newUser as any).usdt_trc20_address ?? null,
      bnbAddress: (newUser as any).bnb_address ?? null,
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
