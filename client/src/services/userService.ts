import { api } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Transaction, User } from "@shared/schema";

// Define UserRole type since it's not in the schema
type UserRole = "user" | "admin";

export type UserFilters = {
  role?: UserRole;
  is_admin?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "asc" | "desc";
};

/**
 * Get current user profile
 */
export async function getCurrentUserProfile(): Promise<any> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Error getting auth user:", userError);
      throw new Error(userError.message);
    }

    if (!user) {
      throw new Error("No authenticated user found");
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      throw new Error(profileError.message);
    }

    return {
      ...profile,
      transactions: {
        deposits: await getUserTransactionStats(user.id, "deposit"),
        withdrawals: await getUserTransactionStats(user.id, "withdrawal"),
      },
    };
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
}

async function getUserTransactionStats(
  userId: string,
  type: "deposit" | "withdrawal"
) {
  const { data, error, count } = await supabase
    .from("transactions")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .eq("type", type)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error(`Error fetching user ${type}s:`, error);
    return { recent: [], total: 0 };
  }

  return {
    recent: data || [],
    total: count || 0,
  };
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId?: number | string): Promise<any> {
  try {
    // If no userId provided, get current user profile
    if (!userId) {
      return getCurrentUserProfile();
    }

    // For specific user ID, check if there's an admin route or fallback to current user
    const endpoint = `/users/${userId}/profile`;
    return await api.get(endpoint);
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    if (error.status === 403) {
      throw new Error("You do not have permission to view this profile.");
    } else if (error.status === 404) {
      throw new Error("User not found.");
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error(
        "Cannot connect to server. Please check your internet connection and try again."
      );
    }
    throw new Error(
      error.message || "Failed to fetch user profile. Please try again later."
    );
  }
}

/**
 * Get user activity log
 */
export async function getUserActivity(
  userId?: number | string
): Promise<any[]> {
  if (!userId) {
    throw new Error("User ID is required");
  }
  try {
    return await api.get(`/users/${userId}/activity`);
  } catch (error: any) {
    console.error("Error fetching user activity:", error);
    if (error.status === 403) {
      throw new Error("You do not have permission to view this activity log.");
    } else if (error.status === 404) {
      throw new Error("User not found.");
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error(
        "Cannot connect to server. Please check your internet connection and try again."
      );
    }
    throw new Error(
      error.message || "Failed to fetch user activity. Please try again later."
    );
  }
}

/**
 * Get user balance
 */
export async function getUserBalance(userId?: number | string): Promise<{
  availableBalance: number;
  pendingBalance: number;
  totalBalance: number;
  lastUpdated: string;
}> {
  if (!userId) {
    throw new Error("User ID is required to fetch balance");
  }

  try {
    const raw = await api.get<any>(`/users/${userId}/balance`);
    if (!raw || typeof raw !== "object")
      throw new Error("Empty balance response");

    const available =
      raw.availableBalance !== undefined
        ? Number(raw.availableBalance)
        : raw.balance !== undefined
          ? Number(raw.balance)
          : 0;
    const pending = Number(raw.pendingBalance || 0);
    const total = Number(
      raw.totalBalance !== undefined ? raw.totalBalance : available + pending
    );
    return {
      availableBalance: available,
      pendingBalance: pending,
      totalBalance: total,
      lastUpdated: raw.lastUpdated || new Date().toISOString(),
    };
  } catch (error: any) {
    console.error("Error fetching user balance:", error);
    // Fallback to stored user
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user?.balance != null) {
          const balance = Number(user.balance) || 0;
          return {
            availableBalance: balance,
            pendingBalance: 0,
            totalBalance: balance,
            lastUpdated: new Date().toISOString(),
          };
        }
      }
    } catch {}
    return {
      availableBalance: 0,
      pendingBalance: 0,
      totalBalance: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId?: number | string,
  data?: any
): Promise<any> {
  if (!userId) {
    throw new Error("User ID is required");
  }
  try {
    return await api.patch(`/users/${userId}/profile`, data);
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    if (error.status === 400) {
      throw new Error(
        error.message || "Invalid profile data. Please check your inputs."
      );
    } else if (error.status === 403) {
      throw new Error("You do not have permission to update this profile.");
    } else if (error.status === 404) {
      throw new Error("User not found.");
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error(
        "Cannot connect to server. Please check your internet connection and try again."
      );
    }
    throw new Error(
      error.message || "Failed to update user profile. Please try again later."
    );
  }
}

/**
 * Update user profile with general data
 */
export async function updateUserProfileGeneral(
  userId?: number | string,
  data?: any
): Promise<any> {
  if (!userId) {
    throw new Error("User ID is required");
  }
  try {
    return await api.patch(`/users/${userId}/profile`, data);
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    if (error.status === 400) {
      throw new Error(
        error.message || "Invalid profile data. Please check your inputs."
      );
    } else if (error.status === 403) {
      throw new Error("You do not have permission to update this profile.");
    } else if (error.status === 404) {
      throw new Error("User not found.");
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error(
        "Cannot connect to server. Please check your internet connection and try again."
      );
    }
    throw new Error(
      error.message || "Failed to update user profile. Please try again later."
    );
  }
}

/**
 * Update user security settings
 */
export async function updateUserSecurity(
  userId?: number | string,
  data?: any
): Promise<any> {
  if (!userId) {
    throw new Error("User ID is required");
  }
  try {
    return await api.patch(`/users/${userId}/security`, data);
  } catch (error: any) {
    console.error("Error updating security settings:", error);
    if (error.message === "Current password is incorrect") {
      throw new Error("Current password is incorrect. Please try again.");
    } else if (error.status === 400) {
      throw new Error(
        error.message || "Invalid security data. Please check your inputs."
      );
    } else if (error.status === 403) {
      throw new Error(
        "You do not have permission to update security settings."
      );
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error(
        "Cannot connect to server. Please check your internet connection and try again."
      );
    }
    throw new Error(
      error.message ||
        "Failed to update security settings. Please try again later."
    );
  }
}

/**
 * Update user notification preferences
 */
export async function updateUserNotifications(
  userId?: number | string,
  data?: any
): Promise<any> {
  if (!userId) {
    throw new Error("User ID is required");
  }
  try {
    return await api.patch(`/users/${userId}/notifications`, data);
  } catch (error: any) {
    console.error("Error updating notification preferences:", error);
    if (error.status === 400) {
      throw new Error(
        error.message || "Invalid notification data. Please check your inputs."
      );
    } else if (error.status === 403) {
      throw new Error(
        "You do not have permission to update notification preferences."
      );
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error(
        "Cannot connect to server. Please check your internet connection and try again."
      );
    }
    throw new Error(
      error.message ||
        "Failed to update notification preferences. Please try again later."
    );
  }
}

/**
 * Get user referrals
 */
export async function getUserReferrals(
  userId?: number | string
): Promise<any[]> {
  if (!userId) {
    throw new Error("User ID is required");
  }
  try {
    return await api.get(`/users/${userId}/referrals`);
  } catch (error: any) {
    console.error("Error fetching user referrals:", error);
    if (error.status === 403) {
      throw new Error("You do not have permission to view these referrals.");
    } else if (error.status === 404) {
      throw new Error("User not found.");
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error(
        "Cannot connect to server. Please check your internet connection and try again."
      );
    }
    throw new Error(
      error.message || "Failed to fetch user referrals. Please try again later."
    );
  }
}

/**
 * Get user referral statistics
 */
export async function getUserReferralStats(
  userId?: number | string
): Promise<any> {
  if (!userId) {
    throw new Error("User ID is required");
  }
  try {
    return await api.get(`/users/${userId}/referral-stats`);
  } catch (error: any) {
    console.error("Error fetching referral stats:", error);
    if (error.status === 403) {
      throw new Error(
        "You do not have permission to view these referral statistics."
      );
    } else if (error.status === 404) {
      throw new Error("User not found.");
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error(
        "Cannot connect to server. Please check your internet connection and try again."
      );
    }
    throw new Error(
      error.message ||
        "Failed to fetch referral statistics. Please try again later."
    );
  }
}

/**
 * Get a single user by ID
 */
export async function getUser(userId: number): Promise<User> {
  try {
    return await api.get(`/users/${userId}`);
  } catch (error: any) {
    console.error("Error fetching user:", error);
    if (error.status === 403) {
      throw new Error("You do not have permission to view this user profile.");
    } else if (error.status === 404) {
      throw new Error(
        "User not found. The user may have been deleted or you may not have access."
      );
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error(
        "Cannot connect to server. Please check your internet connection and try again."
      );
    }
    throw new Error(
      error.message ||
        "Failed to fetch user information. Please try again later."
    );
  }
}

/**
 * Get all users with optional filtering, pagination and sorting
 */
export async function getUsers(filters: UserFilters = {}): Promise<{
  users: User[];
  total: number;
  page: number;
  totalPages: number;
}> {
  try {
    const queryParams = new URLSearchParams();
    if (filters.role) queryParams.append("role", filters.role);
    if (filters.is_admin !== undefined)
      queryParams.append("is_admin", String(filters.is_admin));
    if (filters.search) queryParams.append("search", filters.search);
    if (filters.page) queryParams.append("page", String(filters.page));
    if (filters.limit) queryParams.append("limit", String(filters.limit));
    if (filters.sortBy) queryParams.append("sortBy", filters.sortBy);
    if (filters.order) queryParams.append("order", filters.order);

    const url = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    return await api.get(url);
  } catch (error: any) {
    console.error("Error fetching users:", error);
    if (error.status === 403) {
      throw new Error("You do not have permission to view user data.");
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error(
        "Cannot connect to server. Please check your internet connection and try again."
      );
    }
    throw new Error(
      error.message || "Failed to fetch users. Please try again later."
    );
  }
}

/**
 * Get user transactions with optional filtering
 */
export async function getUserTransactions(
  userId: number,
  filters: {
    status?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<{
  transactions: Transaction[];
  total: number;
  page: number;
  totalPages: number;
}> {
  try {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append("status", filters.status);
    if (filters.type) queryParams.append("type", filters.type);
    if (filters.startDate) queryParams.append("startDate", filters.startDate);
    if (filters.endDate) queryParams.append("endDate", filters.endDate);
    if (filters.page) queryParams.append("page", String(filters.page));
    if (filters.limit) queryParams.append("limit", String(filters.limit));

    const url = `/users/${userId}/transactions${
      queryParams.toString() ? `?${queryParams.toString()}` : ""
    }`;
    return await api.get(url);
  } catch (error: any) {
    console.error("Error fetching user transactions:", error);
    if (error.status === 403) {
      throw new Error("You do not have permission to view these transactions.");
    } else if (error.status === 404) {
      throw new Error("User not found.");
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error(
        "Cannot connect to server. Please check your internet connection and try again."
      );
    }
    throw new Error(
      error.message ||
        "Failed to fetch user transactions. Please try again later."
    );
  }
}
