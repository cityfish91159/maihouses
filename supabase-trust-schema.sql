-- Create Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    state JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    transaction_id TEXT REFERENCES transactions(id),
    action TEXT NOT NULL,
    role TEXT,
    ip TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create Policy: Service Role only (since we use custom JWT in API functions)
-- We will access these tables via the Service Role Key in the Vercel API functions.
-- So we don't strictly need public policies if we don't expose them via Supabase Client directly.
-- However, if we want to allow reading via Supabase Client with the custom token, it's complicated.
-- Let's stick to the "Golden Master" architecture where the API handles the logic and DB access.
-- So we don't need permissive policies for 'anon' or 'authenticated' roles.
