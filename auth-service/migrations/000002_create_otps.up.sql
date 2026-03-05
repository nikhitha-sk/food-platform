-- 000002_create_otps.up.sql
CREATE TABLE otps (
    id          SERIAL PRIMARY KEY,
    phone       VARCHAR(20) NOT NULL,
    code        VARCHAR(10) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used        BOOLEAN DEFAULT false
);

CREATE INDEX idx_otps_phone_used ON otps(phone, used);
