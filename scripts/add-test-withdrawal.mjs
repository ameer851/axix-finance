// Simple script to add a test pending withdrawal
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: "postgresql://postgres:postgres@localhost:5432/axix_finance",
  max: 10
});

async function main() {
  try {
    // Get a user to associate the withdrawal with
    const userRes = await pool.query('SELECT id FROM users LIMIT 1');
    if (userRes.rows.length === 0) {
      console.log('No users found in the database. Please create a user first.');
      return;
    }
    
    const userId = userRes.rows[0].id;
    
    // Check for existing withdrawals
    const withdrawals = await pool.query('SELECT * FROM transactions WHERE type = \'withdrawal\'');
    console.log(`Found ${withdrawals.rows.length} withdrawals`);
    
    // Check for pending withdrawals
    const pendingWithdrawals = await pool.query('SELECT * FROM transactions WHERE type = \'withdrawal\' AND status = \'pending\'');
    console.log(`Found ${pendingWithdrawals.rows.length} pending withdrawals`);
    
    // Create a new test withdrawal if none exist
    if (pendingWithdrawals.rows.length === 0) {
      await pool.query(
        'INSERT INTO transactions (user_id, type, amount, status, description, created_at) VALUES ($1, $2, $3, $4, $5, NOW())',
        [userId, 'withdrawal', 500.00, 'pending', 'Test withdrawal for admin approval']
      );
      console.log('Created a new test pending withdrawal');
    }
    
  } catch (error) {
    console.error('Database error:', error);
  } finally {
    await pool.end();
  }
}

main();
