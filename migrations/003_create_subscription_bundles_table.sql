-- Create subscription_bundles table
CREATE TABLE IF NOT EXISTS subscription_bundles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier VARCHAR(50) NOT NULL CHECK (tier IN ('Basic', 'Pro', 'Enterprise')),
    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
    max_messages INTEGER NOT NULL,
    remaining_messages INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    renewal_date TIMESTAMP,
    auto_renew BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscription_bundles_user_id ON subscription_bundles(user_id);
CREATE INDEX idx_subscription_bundles_is_active ON subscription_bundles(is_active);
CREATE INDEX idx_subscription_bundles_renewal_date ON subscription_bundles(renewal_date);

