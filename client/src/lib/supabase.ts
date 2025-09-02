import { createClient } from "@supabase/supabase-js";

// Attempt to get from env variables first
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// If env variables are not available, use hardcoded values
const fallbackUrl = "https://oyqanlnqfyyaqheehsmw.supabase.co";
const fallbackKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWFubG5xZnl5YXFoZWVoc213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzMzMzQsImV4cCI6MjA2OTkwOTMzNH0.9iuJ3lKSbmGOIblmdGFr08wiUaC7RKqRzY7DUc-pjWc";

// Use fallback values if env variables are missing
const finalUrl = supabaseUrl || fallbackUrl;
const finalKey = supabaseAnonKey || fallbackKey;

// Log what's being used (only in development)
if (import.meta.env.DEV || import.meta.env.MODE === "development") {
  console.log("Supabase Configuration:");
  console.log("URL:", finalUrl);
  console.log(
    "ANON KEY (first 10 chars):",
    finalKey ? finalKey.substring(0, 10) + "..." : "undefined"
  );
}

// Create Supabase client with better error handling
export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
  global: {
    headers: {
      "X-Client-Info": "axix-finance-web",
      apikey: finalKey,
    },
  },
  db: {
    schema: "public",
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number;
          email: string;
          username: string;
          role: string;
          balance: string;
          isActive: boolean;
          isVerified: boolean;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          email: string;
          username: string;
          role?: string;
          balance?: string;
          isActive?: boolean;
          isVerified?: boolean;
        };
        Update: {
          email?: string;
          username?: string;
          role?: string;
          balance?: string;
          isActive?: boolean;
          isVerified?: boolean;
        };
      };
      transactions: {
        Row: {
          id: number;
          userId: number;
          type: string;
          amount: string;
          status: string;
          description: string;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          userId: number;
          type: string;
          amount: string;
          status?: string;
          description?: string;
        };
        Update: {
          status?: string;
          description?: string;
        };
      };
      notifications: {
        Row: {
          id: number;
          userId: number;
          title: string;
          message: string;
          type: string;
          isRead: boolean;
          createdAt: string;
        };
        Insert: {
          userId: number;
          title: string;
          message: string;
          type?: string;
          isRead?: boolean;
        };
        Update: {
          isRead?: boolean;
        };
      };
    };
  };
}

// Auth helper functions
export const authHelpers = {
  signUp: async (email: string, password: string, userData?: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    return { user, error };
  },

  getCurrentSession: async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    return { session, error };
  },
};

// Database helper functions
export const dbHelpers = {
  // Users
  getUserProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    return { data, error };
  },

  updateUserProfile: async (userId: string, updates: any) => {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();
    return { data, error };
  },

  // Transactions
  getUserTransactions: async (userId: string, limit = 50, offset = 0) => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    return { data, error };
  },

  createTransaction: async (
    transaction: Database["public"]["Tables"]["transactions"]["Insert"]
  ) => {
    const { data, error } = await supabase
      .from("transactions")
      .insert(transaction)
      .select()
      .single();
    return { data, error };
  },

  // Notifications
  getUserNotifications: async (userId: string, limit = 20) => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    return { data, error };
  },

  markNotificationAsRead: async (notificationId: number) => {
    const { data, error } = await supabase
      .from("notifications")
      .update({ isRead: true })
      .eq("id", notificationId)
      .select()
      .single();
    return { data, error };
  },
};

// Real-time subscriptions
export const subscriptions = {
  subscribeToUserTransactions: (
    userId: string,
    callback: (payload: any) => void
  ) => {
    return supabase
      .channel("transactions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  },

  subscribeToUserNotifications: (
    userId: string,
    callback: (payload: any) => void
  ) => {
    return supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  },
};
