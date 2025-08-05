import { createClient } from "@supabase/supabase-js";

// Supabase configuration for server-side
const supabaseUrl =
  process.env.SUPABASE_URL || "https://oyqanlnqfyyaqheehsmw.supabase.co";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cWFubG5xZnl5YXFoZWVoc213Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMzMzMzQsImV4cCI6MjA2OTkwOTMzNH0.9iuJ3lKSbmGOIblmdGFr08wiUaC7RKqRzY7DUc-pjWc";

// Create Supabase client for server-side operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
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
          firstName?: string;
          lastName?: string;
          password?: string;
          twoFactorEnabled?: boolean;
          referredBy?: number;
          bitcoinAddress?: string;
          bitcoinCashAddress?: string;
          ethereumAddress?: string;
          bnbAddress?: string;
          usdtTrc20Address?: string;
          verificationToken?: string;
          verificationTokenExpiry?: string;
          pendingEmail?: string;
          passwordResetToken?: string;
          passwordResetTokenExpiry?: string;
        };
        Insert: {
          email: string;
          username: string;
          role?: string;
          balance?: string;
          isActive?: boolean;
          isVerified?: boolean;
          firstName?: string;
          lastName?: string;
          password?: string;
          twoFactorEnabled?: boolean;
          referredBy?: number;
          bitcoinAddress?: string;
          bitcoinCashAddress?: string;
          ethereumAddress?: string;
          bnbAddress?: string;
          usdtTrc20Address?: string;
          verificationToken?: string;
          verificationTokenExpiry?: string;
          pendingEmail?: string;
          passwordResetToken?: string;
          passwordResetTokenExpiry?: string;
        };
        Update: {
          email?: string;
          username?: string;
          role?: string;
          balance?: string;
          isActive?: boolean;
          isVerified?: boolean;
          firstName?: string;
          lastName?: string;
          password?: string;
          twoFactorEnabled?: boolean;
          referredBy?: number;
          bitcoinAddress?: string;
          bitcoinCashAddress?: string;
          ethereumAddress?: string;
          bnbAddress?: string;
          usdtTrc20Address?: string;
          verificationToken?: string;
          verificationTokenExpiry?: string;
          pendingEmail?: string;
          passwordResetToken?: string;
          passwordResetTokenExpiry?: string;
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
          processedBy?: number;
          rejectionReason?: string;
          cryptoType?: string;
          walletAddress?: string;
          transactionHash?: string;
          planName?: string;
          planDuration?: string;
          dailyProfit?: number;
          totalReturn?: number;
          expectedCompletionDate?: string;
        };
        Insert: {
          userId: number;
          type: string;
          amount: string;
          status?: string;
          description?: string;
          processedBy?: number;
          rejectionReason?: string;
          cryptoType?: string;
          walletAddress?: string;
          transactionHash?: string;
          planName?: string;
          planDuration?: string;
          dailyProfit?: number;
          totalReturn?: number;
          expectedCompletionDate?: string;
        };
        Update: {
          status?: string;
          description?: string;
          processedBy?: number;
          rejectionReason?: string;
          cryptoType?: string;
          walletAddress?: string;
          transactionHash?: string;
          planName?: string;
          planDuration?: string;
          dailyProfit?: number;
          totalReturn?: number;
          expectedCompletionDate?: string;
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
          relatedEntityType?: string;
          relatedEntityId?: number;
          priority?: string;
          expiresAt?: string;
        };
        Insert: {
          userId: number;
          title: string;
          message: string;
          type?: string;
          isRead?: boolean;
          relatedEntityType?: string;
          relatedEntityId?: number;
          priority?: string;
          expiresAt?: string;
        };
        Update: {
          isRead?: boolean;
          title?: string;
          message?: string;
          type?: string;
          relatedEntityType?: string;
          relatedEntityId?: number;
          priority?: string;
          expiresAt?: string;
        };
      };
      audit_logs: {
        Row: {
          id: number;
          userId?: number;
          action: string;
          description: string;
          details?: string;
          ipAddress?: string;
          userAgent?: string;
          createdAt: string;
        };
        Insert: {
          userId?: number;
          action: string;
          description: string;
          details?: string;
          ipAddress?: string;
          userAgent?: string;
        };
        Update: {
          userId?: number;
          action?: string;
          description?: string;
          details?: string;
          ipAddress?: string;
          userAgent?: string;
        };
      };
      visitor_tracking: {
        Row: {
          id: number;
          ipAddress: string;
          userAgent: string;
          page: string;
          referrer?: string;
          sessionId: string;
          userId?: number;
          createdAt: string;
          lastActivity: string;
        };
        Insert: {
          ipAddress: string;
          userAgent: string;
          page: string;
          referrer?: string;
          sessionId: string;
          userId?: number;
        };
        Update: {
          ipAddress?: string;
          userAgent?: string;
          page?: string;
          referrer?: string;
          sessionId?: string;
          userId?: number;
          lastActivity?: string;
        };
      };
    };
  };
}

// Test Supabase connection
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("count")
      .limit(1);
    if (error) {
      console.error("Supabase connection test failed:", error);
      return false;
    }
    console.log("✅ Supabase connection successful");
    return true;
  } catch (error) {
    console.error("❌ Supabase connection test failed:", error);
    return false;
  }
}
