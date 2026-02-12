-- ============================================================================
-- RESEND EMAIL TRACKING TABLES
-- ============================================================================
-- Tables for tracking email sends, events, unsubscribes, and suppressions

-- CS Email Sends (Track all emails sent)
CREATE TABLE IF NOT EXISTS cs_email_sends (
    email_id VARCHAR(255) PRIMARY KEY, -- Resend message ID
    tenant_id UUID,
    from_domain VARCHAR(255) NOT NULL,
    to_email VARCHAR(255) NOT NULL,
    subject TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'bounced', 'complained', 'unsubscribed', 'failed')),
    
    -- Timestamps
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    complained_at TIMESTAMPTZ,
    unsubscribed_at TIMESTAMPTZ,
    
    -- Counts
    opened_count INT DEFAULT 0,
    clicked_count INT DEFAULT 0,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Email Events (Track individual email events)
CREATE TABLE IF NOT EXISTS cs_email_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_id VARCHAR(255) NOT NULL REFERENCES cs_email_sends(email_id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed')),
    recipient_email VARCHAR(255),
    event_data JSONB DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Email Unsubscribes (Track unsubscribe tokens)
CREATE TABLE IF NOT EXISTS cs_email_unsubscribes (
    token VARCHAR(255) PRIMARY KEY, -- Unsubscribe token
    email VARCHAR(255) NOT NULL,
    email_id VARCHAR(255), -- Resend message ID
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
    unsubscribed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CS Email Suppressions (Suppression list)
CREATE TABLE IF NOT EXISTS cs_email_suppressions (
    suppression_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('bounced', 'complaint', 'unsubscribed', 'manual')),
    bounce_type VARCHAR(50), -- 'hard' or 'soft' for bounces
    email_id VARCHAR(255), -- Resend message ID that triggered suppression
    suppressed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(email, reason) -- Prevent duplicate suppressions
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cs_email_sends_tenant ON cs_email_sends(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cs_email_sends_domain ON cs_email_sends(from_domain);
CREATE INDEX IF NOT EXISTS idx_cs_email_sends_to ON cs_email_sends(to_email);
CREATE INDEX IF NOT EXISTS idx_cs_email_sends_status ON cs_email_sends(status);
CREATE INDEX IF NOT EXISTS idx_cs_email_sends_sent_at ON cs_email_sends(sent_at);

CREATE INDEX IF NOT EXISTS idx_cs_email_events_email_id ON cs_email_events(email_id);
CREATE INDEX IF NOT EXISTS idx_cs_email_events_type ON cs_email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_cs_email_events_occurred_at ON cs_email_events(occurred_at);

CREATE INDEX IF NOT EXISTS idx_cs_email_unsubscribes_email ON cs_email_unsubscribes(email);
CREATE INDEX IF NOT EXISTS idx_cs_email_unsubscribes_status ON cs_email_unsubscribes(status);

CREATE INDEX IF NOT EXISTS idx_cs_email_suppressions_email ON cs_email_suppressions(email);
CREATE INDEX IF NOT EXISTS idx_cs_email_suppressions_reason ON cs_email_suppressions(reason);

-- Triggers
CREATE OR REPLACE FUNCTION update_cs_email_sends_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_update_cs_email_sends_updated_at'
    ) THEN
        DROP TRIGGER trigger_update_cs_email_sends_updated_at ON cs_email_sends;
    END IF;
END $$;

CREATE TRIGGER trigger_update_cs_email_sends_updated_at
    BEFORE UPDATE ON cs_email_sends
    FOR EACH ROW
    EXECUTE FUNCTION update_cs_email_sends_updated_at();
