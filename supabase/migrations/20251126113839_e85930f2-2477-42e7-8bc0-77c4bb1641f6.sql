-- Enable pgcrypto extension required for validate_admin_key hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;