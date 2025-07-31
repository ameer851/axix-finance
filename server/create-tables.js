import { pool } from './db.ts';

async function createTables() {
  try {
    console.log('Creating audit_logs table...');
    
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
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
    `);

    console.log('Creating deposits_history table...');
    
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
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_deposits_history_user_id ON deposits_history(user_id);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_deposits_history_status ON deposits_history(status);
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_deposits_history_created_at ON deposits_history(created_at);
    `);

    console.log('Tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
}

createTables();
