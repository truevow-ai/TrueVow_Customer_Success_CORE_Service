-- ============================================================================
-- MENTIONS TABLE
-- ============================================================================
-- Tracks @mentions in messages for notifications and collaboration
-- ============================================================================

-- Create cs_mentions table
CREATE TABLE IF NOT EXISTS cs_mentions (
    mention_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES cs_messages(message_id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES cs_conversations(conversation_id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES cs_tickets(ticket_id) ON DELETE CASCADE,
    mentioned_user_id UUID NOT NULL, -- References cs_team_members(member_id)
    mentioned_clerk_user_id VARCHAR(255) NOT NULL, -- Clerk user ID for notifications
    mentioned_by UUID NOT NULL, -- User who created the mention (Clerk user ID)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_mentions_message_id ON cs_mentions(message_id);
CREATE INDEX IF NOT EXISTS idx_mentions_conversation_id ON cs_mentions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_mentions_ticket_id ON cs_mentions(ticket_id);
CREATE INDEX IF NOT EXISTS idx_mentions_mentioned_user_id ON cs_mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS idx_mentions_mentioned_clerk_user_id ON cs_mentions(mentioned_clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_mentions_created_at ON cs_mentions(created_at);

-- Add comment
COMMENT ON TABLE cs_mentions IS 'Tracks @mentions in messages for notifications and team collaboration';
