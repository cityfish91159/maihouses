-- ==============================================================================
-- Auto-increment Public ID Sequence
-- ==============================================================================

-- 1. Create a sequence for property IDs starting from 100002
CREATE SEQUENCE IF NOT EXISTS property_public_id_seq START 100002;

-- 2. Create a function to generate the ID
CREATE OR REPLACE FUNCTION generate_property_public_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Only generate if not provided
    IF NEW.public_id IS NULL THEN
        NEW.public_id := 'MH-' || nextval('property_public_id_seq');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create a trigger to call the function before insert
DROP TRIGGER IF EXISTS set_property_public_id ON public.properties;
CREATE TRIGGER set_property_public_id
    BEFORE INSERT ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION generate_property_public_id();
