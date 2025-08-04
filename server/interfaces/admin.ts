import { Transaction } from "@shared/schema";

export interface GetTransactionsOptions {
  limit: number;
  offset: number;
  search?: string;
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AdminTransactionResponse extends Transaction {
  user?: {
    username: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface GetUsersOptions {
  limit: number;
  offset: number;
  search?: string;
  status?: string;
}

export interface AdminRequestUser {
  id: number;
  role: string;
  email: string;
}

export interface AdminRequest {
  user?: AdminRequestUser;
  isAuthenticated(): boolean;
  query: { [key: string]: string | undefined };
  params: { [key: string]: string };
  body: any;
}

export interface PaginationResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
}
