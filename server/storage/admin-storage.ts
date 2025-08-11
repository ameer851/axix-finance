// Stubbed admin storage implementation while database layer is disabled.
import type {
  GetTransactionsOptions,
  GetUsersOptions,
} from "../interfaces/admin";

export class DatabaseStorage {
  async searchUsers(_search: string) {
    return [];
  }
  async getUsers(_options: GetUsersOptions) {
    return [];
  }
  async getUserCount() {
    return 0;
  }
  async getPendingVerificationCount() {
    return 0;
  }
  async getPendingDepositCount() {
    return 0;
  }
  async getPendingWithdrawalCount() {
    return 0;
  }
  async getTotalDepositAmount() {
    return 0;
  }
  async getTotalWithdrawalAmount() {
    return 0;
  }
  async getRecentTransactions(_limit: number) {
    return [];
  }
  async getRecentLogins(_limit: number) {
    return [];
  }
  async getRecentRegistrations(_limit: number) {
    return [];
  }
  async getTransactionById(_id: number) {
    return undefined;
  }
  async updateTransactionStatus(_id: number, _status: string) {
    return undefined;
  }
  async getPendingDeposits(_opts: { limit: number; offset: number }) {
    return [];
  }
  async getActiveVisitors() {
    return [];
  }
  async createNotification(_data: any) {
    return undefined;
  }
  async getTransactions(_options: GetTransactionsOptions) {
    return [];
  }
  async getTransactionCount(_options: any = {}) {
    return 0;
  }
  async getAuditLogs(_options: {
    limit: number;
    offset: number;
    search?: string;
    action?: string;
  }) {
    return [];
  }
  async getAuditLogCount(_options: { search?: string; action?: string } = {}) {
    return 0;
  }
}
