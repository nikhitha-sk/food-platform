-- 000003_update_profiles_auth_id_primary_key.down.sql
-- Rollback to the previous profiles table structure
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
    id          SERIAL PRIMARY KEY,
    auth_id     BIGINT NOT NULL UNIQUE,
    name        VARCHAR(100),
    avatar_url  VARCHAR(255),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);
