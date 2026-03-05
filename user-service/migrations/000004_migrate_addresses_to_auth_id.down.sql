-- 000004_migrate_addresses_to_auth_id.down.sql
-- Rollback - recreate addresses with old schema (if needed)
DROP TABLE IF EXISTS addresses CASCADE;

CREATE TABLE addresses (
    id          SERIAL PRIMARY KEY,
    user_id     BIGINT,
    label       VARCHAR(50),
    line1       TEXT,
    city        VARCHAR(100),
    pincode     VARCHAR(10),
    latitude    DECIMAL(10,8),
    longitude   DECIMAL(11,8),
    is_default  BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_addresses_user_id ON addresses(user_id);
