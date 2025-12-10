-- Drop the validate_admin_key function first (it depends on the tables)
DROP FUNCTION IF EXISTS public.validate_admin_key(text, text, text);

-- Drop the admin_key_attempts table
DROP TABLE IF EXISTS public.admin_key_attempts;

-- Drop the admin_keys table
DROP TABLE IF EXISTS public.admin_keys;