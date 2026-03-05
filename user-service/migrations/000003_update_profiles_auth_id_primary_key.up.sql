-- 000003_update_profiles_auth_id_primary_key.up.sql
-- Recreate profiles table with auth_id as PRIMARY KEY
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
    auth_id     BIGINT PRIMARY KEY,
    name        VARCHAR(100),
    avatar_url  VARCHAR(255),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_profiles_deleted_at ON profiles(deleted_at);
