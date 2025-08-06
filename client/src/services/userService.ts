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
    .eq("userId", userId)
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
    const response = await apiRequest("GET", endpoint);
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Unexpected response format: ${text}`);
    }
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
    const response = await apiRequest("GET", `/users/${userId}/activity`);
    return await response.json();
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
    const response = await apiRequest("GET", `/users/${userId}/balance`);

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();

    const {
      availableBalance = 0,
      pendingBalance = 0,
      totalBalance,
      lastUpdated,
    } = data;

    return {
      availableBalance: Number(availableBalance),
      pendingBalance: Number(pendingBalance),
      totalBalance: Number(totalBalance || availableBalance + pendingBalance),
      lastUpdated: lastUpdated || new Date().toISOString(),
    };
  } catch (error: any) {
    console.error("Error fetching user balance:", error);

    // Try to get balance from localStorage as fallback
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user?.balance) {
        const balance = Number(user.balance);
        return {
          availableBalance: balance,
          pendingBalance: 0,
          totalBalance: balance,
          lastUpdated: new Date().toISOString(),
        };
      }
    }

    throw new Error(error.message || "Failed to fetch balance");
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
    const response = await apiRequest(
      "PATCH",
      `/users/${userId}/profile`,
      data
    );
    return await response.json();
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
    const response = await apiRequest(
      "PATCH",
      `/users/${userId}/profile`,
      data
    );
    return await response.json();
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
    const response = await apiRequest(
      "PATCH",
      `/users/${userId}/security`,
      data
    );
    return await response.json();
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
    const response = await apiRequest(
      "PATCH",
      `/users/${userId}/notifications`,
      data
    );
    return await response.json();
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
    const response = await apiRequest("GET", `/users/${userId}/referrals`);
    return await response.json();
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
    const response = await apiRequest("GET", `/users/${userId}/referral-stats`);
    return await response.json();
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
    const response = await apiRequest("GET", `/users/${userId}`);
    return await response.json();
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
    const response = await apiRequest("GET", url);

    return await response.json();
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
  if (!userId) {
    throw new Error("User ID is required to fetch transactions");
  }

  try {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append("status", filters.status);
    if (filters.type) queryParams.append("type", filters.type);
    if (filters.startDate) queryParams.append("startDate", filters.startDate);
    if (filters.endDate) queryParams.append("endDate", filters.endDate);
    if (filters.page) queryParams.append("page", String(filters.page));
    if (filters.limit) queryParams.append("limit", String(filters.limit));

    const url = `/users/${userId}/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    const response = await apiRequest("GET", url);

    // Check for empty response
    const responseText = await response.text();
    if (!responseText || responseText.trim() === "") {
      return {
        transactions: [],
        total: 0,
        page: filters.page || 1,
        totalPages: 0,
      };
    }

    try {
      // Try to parse as JSON
      const data = JSON.parse(responseText);
      return data;
    } catch (parseError) {
      console.error("Error parsing transaction response:", parseError);
      throw new Error(
        "Unable to parse server response. The data may be corrupted."
      );
    }
  } catch (error: any) {
    console.error("Error fetching user transactions:", error);

    // Handle specific error cases
    if (error.status === 403) {
      throw new Error("You do not have permission to view these transactions.");
    } else if (error.status === 404) {
      throw new Error(
        "User not found. The user may have been deleted or you may not have access."
      );
    } else if (error.isOffline || error.isNetworkError) {
      throw new Error(
        "Cannot connect to server. Please check your internet connection and try again."
      );
    } else if (error.status === 500) {
      throw new Error(
        "Server error occurred. Our team has been notified and is working on the issue."
      );
    } else if (error.status === 429) {
      throw new Error("Too many requests. Please try again later.");
    }

    // Generic error fallback
    throw new Error(
      error.message || "Failed to fetch transactions. Please try again later."
    );
  }
}

/**
 * Update user profile with specific user data
 */
export async function updateUserProfileDetails(
  userId: number,
  profileData: Partial<User>
): Promise<User> {
  try {
    const response = await apiRequest("PATCH", `/users/${userId}`, profileData);
    const updatedUser = await response.json();

    return updatedUser;
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    if (error.status === 403) {
      throw new Error(
        "You do not have permission to update this user profile."
      );
    } else if (error.status === 404) {
      throw new Error(
        "User not found. The user may have been deleted or you may not have access."
      );
    } else if (error.status === 400) {
      throw new Error(
        error.message || "Invalid profile data. Please check your inputs."
      );
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
 * Get user dashboard statistics
 */
export async function getDashboardStats(userId: number): Promise<{
  balance: string;
  pendingTransactions: number;
  completedTransactions: number;
  totalInvestment: string;
  monthlyProfit: string;
  yearlyProfit: string;
  portfolioPerformance: {
    labels: string[];
    data: number[];
  };
}> {
  try {
    const response = await apiRequest(
      "GET",
      `/users/${userId}/dashboard-stats`
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Error ${response.status}: Failed to fetch dashboard statistics`
      );
    }

    return await response.json();
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error);
    throw new Error(error.message || "Failed to fetch dashboard statistics");
  }
}

/**
 * Update user password - requires old password verification
 */
export async function updatePassword(
  userId: number,
  data: { currentPassword: string; newPassword: string }
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiRequest(
      "POST",
      `/users/${userId}/change-password`,
      data
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Error ${response.status}: Failed to update password`
      );
    }

    return {
      success: true,
      message: "Password updated successfully",
    };
  } catch (error: any) {
    console.error("Error updating password:", error);
    return {
      success: false,
      message: error.message || "Failed to update password",
    };
  }
}

/**
 * Update user notification preferences
 */
export async function updateNotificationPreferences(
  userId: number,
  preferences: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    marketingEmails?: boolean;
    transactionAlerts?: boolean;
  }
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiRequest(
      "PATCH",
      `/users/${userId}/notification-preferences`,
      preferences
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Error ${response.status}: Failed to update notification preferences`
      );
    }

    return {
      success: true,
      message: "Notification preferences updated successfully",
    };
  } catch (error: any) {
    console.error("Error updating notification preferences:", error);
    return {
      success: false,
      message: error.message || "Failed to update notification preferences",
    };
  }
}
