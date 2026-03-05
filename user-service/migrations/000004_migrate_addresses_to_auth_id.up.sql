-- 000004_migrate_addresses_to_auth_id.up.sql
-- Drop and recreate addresses table with auth_id as foreign key
DROP TABLE IF EXISTS addresses CASCADE;

CREATE TABLE addresses (
    id          SERIAL PRIMARY KEY,
    auth_id     BIGINT NOT NULL,
    label       VARCHAR(50),
    line1       TEXT,
    city        VARCHAR(100),
    pincode     VARCHAR(10),
    latitude    DECIMAL(10,8),
    longitude   DECIMAL(11,8),
    is_default  BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX idx_addresses_auth_id ON addresses(auth_id);
CREATE INDEX idx_addresses_deleted_at ON addresses(deleted_at);
