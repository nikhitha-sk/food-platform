-- 000001_create_users.up.sql
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(100) NOT NULL UNIQUE,
    password        VARCHAR(255) NOT NULL,
    phone           VARCHAR(20) UNIQUE,
    role            VARCHAR(50) DEFAULT 'USER',
    is_verified     BOOLEAN DEFAULT false,
    is_deleted      BOOLEAN DEFAULT false,
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email)
WHERE is_deleted = false;
