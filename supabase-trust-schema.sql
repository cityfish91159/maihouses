-- 交易狀態表
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    state JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 審計日誌表
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id TEXT NOT NULL REFERENCES transactions(id),
    action TEXT NOT NULL,
    role TEXT NOT NULL,
    ip TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_transactions_updated ON transactions(updated_at DESC);
CREATE INDEX idx_audit_logs_tx ON audit_logs(transaction_id);

-- RLS (Row Level Security)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 允許 Service Role 完全存取
CREATE POLICY "Service role full access" ON transactions FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON audit_logs FOR ALL TO service_role USING (true);
