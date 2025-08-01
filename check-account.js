const { Client } = require('pg');

const pool = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password_placeholder@localhost:5432/postgres'
});

(async () => {
  try {
    await pool.connect();
    
    // Check your user balance
    const userQuery = 'SELECT id, username, balance FROM users WHERE username = $1';
    const userResult = await pool.query(userQuery, ['ameer12']);
    console.log('Your account:', userResult.rows[0]);
    
    // Check recent transactions
    const transactionsQuery = 'SELECT id, type, amount, status, created_at FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5';
    const transactionsResult = await pool.query(transactionsQuery, [userResult.rows[0].id]);
    console.log('Recent transactions:', transactionsResult.rows);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error);
  }
})();
