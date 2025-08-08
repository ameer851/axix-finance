// Minimal user type, only guaranteed fields
interface MinimalUser {
  id: string;
  email: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role?: "user" | "admin";
  balance?: string | null;
  isVerified?: boolean;
  isActive?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface UserFormData {
  email: string;
  firstName: string;
  lastName: string;
  role: "user" | "admin";
  isActive: boolean;
  isVerified: boolean;
}

interface FundingFormData {
  amount: number;
  description?: string;
}
