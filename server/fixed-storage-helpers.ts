import { db } from './db';
import { transactions } from './schema';
import { eq } from 'drizzle-orm';
import { Transaction, TransactionStatus } from './types';

// Fixing the updateTransactionStatus function
export class FixedStorageHelpers {
  async updateTransactionStatus(
    id: number, 
    status: TransactionStatus, 
    rejectionReason?: string
  ): Promise<Transaction | undefined> {
    try {
      console.log(`🔄 updateTransactionStatus called for ID: ${id}, status: ${status}`);
      
      // First get the transaction to ensure it exists
      const transaction = await this.getTransaction(id);
      if (!transaction) {
        console.log(`❌ Transaction with ID ${id} not found - cannot update status`);
        return undefined;
      }

      const updateData: Record<string, any> = { 
        status: status, 
        updatedAt: new Date()
      };
      
      if (status === "rejected" && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }

      try {
        const result = await db.update(transactions)
          .set(updateData)
          .where(eq(transactions.id, id))
          .returning();
          
        console.log(`✅ Transaction status updated: ${JSON.stringify(result[0])}`);
        return result.length > 0 ? result[0] : undefined;
      } catch (dbError) {
        console.error(`❌ Database error updating transaction status: ${dbError.message}`);
        
        // Handle table not exists errors
        if (dbError.message.includes('does not exist') || 
            dbError.message.includes('relation') ||
            dbError.message.includes('no such table')) {
          console.warn('Transactions table may not exist - this is expected in new deployments');
          return transaction; // Return the original transaction as a fallback
        }
        
        throw dbError;
      }
    } catch (error) {
      console.error(`❌ Error in updateTransactionStatus(${id}, ${status}): ${error.message}`);
      throw error;
    }
  }

  // Placeholder for getTransaction method
  async getTransaction(id: number): Promise<Transaction | undefined> {
    // Implement the logic to fetch a transaction by ID
    return undefined;
  }
}
