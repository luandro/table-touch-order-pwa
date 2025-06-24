-- Create table_history table for comprehensive action logging
CREATE TABLE IF NOT EXISTS table_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    details JSONB DEFAULT '{}',
    admin_user_id UUID,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_table_history_table_id ON table_history(table_id);
CREATE INDEX IF NOT EXISTS idx_table_history_timestamp ON table_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_table_history_action ON table_history(action);

-- Add RLS policies
ALTER TABLE table_history ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read all history
CREATE POLICY "Authenticated users can read table history" ON table_history
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert table history" ON table_history
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Add comment for documentation
COMMENT ON TABLE table_history IS 'Tracks all actions performed on tables for audit and history purposes';
COMMENT ON COLUMN table_history.action IS 'Type of action: order_created, order_confirmed, order_cancelled, table_freed, table_reserved, etc.';
COMMENT ON COLUMN table_history.details IS 'Additional context about the action (customer_name, order_total, etc.)';
