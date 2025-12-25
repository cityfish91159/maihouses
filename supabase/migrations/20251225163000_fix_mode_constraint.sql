-- Drop the restrictive check constraint on mode
ALTER TABLE shadow_logs DROP CONSTRAINT IF EXISTS shadow_logs_mode_check;

-- Optional: If you want to allow any text, no new constraint is needed.
-- If the constraint was created inline without a name, we might need to find it, but usually standard naming applies.
-- Worst case, we just alter the column to be type text (which it likely is).
