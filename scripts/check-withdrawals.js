// Script to check for withdrawals in the database
import { pool } from '../server/db.js';

async function main() {
  try {
    // Check for any withdrawals
    const withdrawalsResult = await pool.query(`
      SELECT * FROM transactions 
      WHERE type = 'withdrawal'
      LIMIT 10
    `);
    
    console.log('Withdrawals found:', withdrawalsResult.rows.length);
    console.log('Sample withdrawals:', JSON.stringify(withdrawalsResult.rows, null, 2));
    
    // Check specifically for pending withdrawals
    const pendingResult = await pool.query(`
      SELECT * FROM transactions 
      WHERE type = 'withdrawal' AND status = 'pending'
      LIMIT 10
    `);
    
    console.log('Pending withdrawals found:', pendingResult.rows.length);
    console.log('Sample pending withdrawals:', JSON.stringify(pendingResult.rows, null, 2));
    
    // Create a test withdrawal if none exist
    if (pendingResult.rows.length === 0) {
      console.log('No pending withdrawals found. Creating a test withdrawal...');
      
      // First, find a valid user to associate with the withdrawal
      const userResult = await pool.query(`SELECT id FROM users LIMIT 1`);
      
      if (userResult.rows.length > 0) {
        const userId = userResult.rows[0].id;
        
        // Create a test withdrawal
        await pool.query(`
          INSERT INTO transactions (user_id, type, amount, description, status, crypto_type, wallet_address)
          VALUES ($1, 'withdrawal', 100.00, 'Test withdrawal', 'pending', 'BTC', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')
        `, [userId]);
        
        console.log('Test withdrawal created successfully.');
      } else {
        console.log('No users found to create a test withdrawal.');
      }
    }
    
  } catch (error) {
    console.error('Error checking withdrawals:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

main();
