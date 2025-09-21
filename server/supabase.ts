import { createClient } from "@supabase/supabase-js";

// Supabase configuration for server-side
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL not set; please configure environment");
}
if (!supabaseServiceKey) {
  throw new Error(
    "Neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_ANON_KEY set; no embedded fallback"
  );
}

// Create Supabase client for server-side operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    fetch: (...args) => fetch(...args),
    headers: { "x-application-name": "axix-finance" },
  },
  db: {
    schema: "public",
  },
  // Add timeouts to prevent hanging requests
  realtime: {
    timeout: 10000,
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
export async function testSupabaseConnection(maxRetries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `🔄 Testing Supabase connection (attempt ${attempt}/${maxRetries})`
      );
      console.log(`🔗 Using Supabase URL: ${supabaseUrl}`);

      const startTime = Date.now();
      const { data, error } = await supabase
        .from("users")
        .select("count")
        .limit(1);
      const endTime = Date.now();

      if (error) {
        console.error("❌ Supabase connection test failed:", {
          error,
          attempt,
          responseTime: `${endTime - startTime}ms`,
          url: supabaseUrl,
          statusCode: error.code,
          message: error.message,
          details: error.details,
        });

        if (attempt < maxRetries) {
          console.log(`⏳ Waiting ${delayMs}ms before retry...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
        return false;
      }

      console.log("✅ Supabase connection successful", {
        attempt,
        responseTime: `${endTime - startTime}ms`,
        url: supabaseUrl,
      });
      return true;
    } catch (error) {
      const errorObj =
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : { message: String(error) };

      console.error("❌ Supabase connection test failed:", {
        error: errorObj,
        attempt,
        url: supabaseUrl,
      });

      if (attempt < maxRetries) {
        console.log(`⏳ Waiting ${delayMs}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      return false;
    }
  }
  return false;
}
