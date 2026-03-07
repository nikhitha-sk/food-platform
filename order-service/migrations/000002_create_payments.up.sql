-- +migrate Up
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL UNIQUE REFERENCES orders(id),
    user_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(5) DEFAULT 'INR',
    status VARCHAR(30) NOT NULL,
    gateway VARCHAR(50),
    gateway_txn_id VARCHAR(255) UNIQUE,
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
