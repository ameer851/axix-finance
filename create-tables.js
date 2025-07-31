import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createTables() {
  try {
    console.log('Connecting to database...');
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('Database connected successfully!');

    console.log('Creating audit_logs table...');
    
    // Create audit_logs table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        ip_address INET,
        user_agent TEXT,
        location VARCHAR(255),
        severity VARCHAR(20) DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high')),
        details JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for audit_logs
    await pool.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)');

    console.log('Creating deposits_history table...');

    // Create deposits_history table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS deposits_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        deposit_id INTEGER,
        amount DECIMAL(15,2) NOT NULL,
        plan_name VARCHAR(100) NOT NULL,
        payment_method VARCHAR(50),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'failed', 'cancelled')),
        daily_return_rate DECIMAL(5,2),
        duration_days INTEGER,
        total_return DECIMAL(15,2),
        earned_amount DECIMAL(15,2) DEFAULT 0,
        remaining_days INTEGER,
        start_date TIMESTAMP WITH TIME ZONE,
        end_date TIMESTAMP WITH TIME ZONE,
        payment_details JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for deposits_history
    await pool.query('CREATE INDEX IF NOT EXISTS idx_deposits_history_user_id ON deposits_history(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_deposits_history_status ON deposits_history(status)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_deposits_history_created_at ON deposits_history(created_at)');

    console.log('Creating update trigger function...');

    // Create trigger function for updated_at
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language plpgsql;
    `);

    // Create trigger for deposits_history
    await pool.query(`
      DROP TRIGGER IF EXISTS update_deposits_history_updated_at ON deposits_history;
      CREATE TRIGGER update_deposits_history_updated_at 
        BEFORE UPDATE ON deposits_history 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('Adding sample data to deposits_history...');

    // Check if we have any users to add sample data for
    const usersResult = await pool.query('SELECT id FROM users LIMIT 1');
    
    if (usersResult.rows.length > 0) {
      const userId = usersResult.rows[0].id;
      
      // Add some sample deposits history data
      await pool.query(`
        INSERT INTO deposits_history (
          user_id, amount, plan_name, payment_method, status, 
          daily_return_rate, duration_days, total_return, earned_amount, 
          remaining_days, start_date, end_date, created_at
        ) VALUES 
        ($1, 1000.00, 'STARTER PLAN', 'Credit Card', 'completed', 2.5, 14, 350.00, 350.00, 0, 
         CURRENT_TIMESTAMP - INTERVAL '20 days', CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP - INTERVAL '20 days'),
        ($1, 5000.00, 'DELUX PLAN', 'Bank Transfer', 'active', 5.0, 21, 5250.00, 1250.00, 16,
         CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_TIMESTAMP + INTERVAL '16 days', CURRENT_TIMESTAMP - INTERVAL '5 days'),
        ($1, 500.00, 'STARTER PLAN', 'Cryptocurrency', 'pending', 2.5, 14, 175.00, 0.00, 14,
         NULL, NULL, CURRENT_TIMESTAMP - INTERVAL '1 days')
        ON CONFLICT DO NOTHING
      `, [userId]);

      console.log('Adding sample audit logs...');

      // Add some sample audit logs
      await pool.query(`
        INSERT INTO audit_logs (
          user_id, action, description, ip_address, user_agent, location, severity, details, created_at
        ) VALUES 
        ($1, 'login_success', 'User logged in successfully', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'New York, US', 'low', 
         '{"method": "email_password"}', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
        ($1, 'profile_updated', 'Profile information updated', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'New York, US', 'low',
         '{"changes": ["firstName", "lastName", "phone"]}', CURRENT_TIMESTAMP - INTERVAL '2 hours'),
        ($1, 'deposit_created', 'New deposit created', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'New York, US', 'low',
         '{"amount": 1000, "plan": "STARTER PLAN"}', CURRENT_TIMESTAMP - INTERVAL '1 days')
        ON CONFLICT DO NOTHING
      `, [userId]);

      console.log('Sample data added successfully!');
    } else {
      console.log('No users found, skipping sample data.');
    }

    console.log('✅ All tables created successfully!');
    console.log('✅ Indexes created successfully!');
    console.log('✅ Triggers created successfully!');
    console.log('✅ Sample data added successfully!');

  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
createTables()
  .then(() => {
    console.log('Database setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database setup failed:', error);
    process.exit(1);
  });
