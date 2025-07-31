-- Add plan tracking fields to transactions table
ALTER TABLE "transactions" ADD COLUMN "plan_duration" TEXT;
ALTER TABLE "transactions" ADD COLUMN "daily_profit" NUMERIC;
ALTER TABLE "transactions" ADD COLUMN "total_return" NUMERIC;
ALTER TABLE "transactions" ADD COLUMN "expected_completion_date" TIMESTAMP;

-- Create index for better query performance
CREATE INDEX "idx_transactions_plan_name" ON "transactions" ("plan_name");
CREATE INDEX "idx_transactions_status_type" ON "transactions" ("status", "type");
