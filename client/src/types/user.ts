export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "user" | "admin";
  balance: string;
  isVerified: boolean;
  isActive: boolean;
  referredBy?: number;
  createdAt: string;
  updatedAt: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  verificationToken?: string;
  verificationTokenExpiry?: string;
  passwordResetToken?: string;
  passwordResetTokenExpiry?: string;
  pendingEmail?: string;
  bitcoinAddress?: string;
  bitcoinCashAddress?: string;
  ethereumAddress?: string;
  bnbAddress?: string;
  usdtTrc20Address?: string;
}
