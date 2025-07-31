-- Create audit_logs table for tracking user actions and security events
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Create deposits_history table for tracking deposit details and status
CREATE TABLE IF NOT EXISTS deposits_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deposit_id INTEGER REFERENCES deposits(id) ON DELETE SET NULL,
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

-- Create indexes for deposits_history
CREATE INDEX IF NOT EXISTS idx_deposits_history_user_id ON deposits_history(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_history_deposit_id ON deposits_history(deposit_id);
CREATE INDEX IF NOT EXISTS idx_deposits_history_status ON deposits_history(status);
CREATE INDEX IF NOT EXISTS idx_deposits_history_created_at ON deposits_history(created_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_deposits_history_updated_at 
    BEFORE UPDATE ON deposits_history 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE audit_logs IS 'Stores audit trail of user actions and security events';
COMMENT ON COLUMN audit_logs.action IS 'Type of action performed (e.g., login_success, profile_updated, password_changed)';
COMMENT ON COLUMN audit_logs.severity IS 'Risk level: low (normal activity), medium (important changes), high (security concerns)';
COMMENT ON COLUMN audit_logs.details IS 'Additional context data stored as JSON';

COMMENT ON TABLE deposits_history IS 'Detailed history and tracking of user deposits and investment plans';
COMMENT ON COLUMN deposits_history.plan_name IS 'Investment plan name (STARTER, PREMIUM, DELUX, LUXURY)';
COMMENT ON COLUMN deposits_history.status IS 'Current status of the deposit/investment';
COMMENT ON COLUMN deposits_history.payment_details IS 'Additional payment information stored as JSON';
