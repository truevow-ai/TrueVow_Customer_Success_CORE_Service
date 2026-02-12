-- ============================================================================
-- SHARED DRAFTS TABLE
-- ============================================================================
-- Enables collaborative draft editing for team members
-- ============================================================================

-- Create cs_shared_drafts table
CREATE TABLE IF NOT EXISTS cs_shared_drafts (
    draft_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES cs_conversations(conversation_id) ON DELETE CASCADE,
    ticket_id UUID REFERENCES cs_tickets(ticket_id) ON DELETE CASCADE,
    subject VARCHAR(500),
    body TEXT NOT NULL,
    body_html TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    shared_with_team VARCHAR(50) NOT NULL DEFAULT 'all' CHECK (shared_with_team IN ('all', 'assigned_team', 'specific_role')),
    shared_with_role VARCHAR(50),
    editable_by_all BOOLEAN DEFAULT TRUE,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'sent', 'discarded')),
    created_by UUID NOT NULL, -- References cs_team_members(member_id)
    last_edited_by UUID, -- References cs_team_members(member_id)
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shared_drafts_conversation_id ON cs_shared_drafts(conversation_id);
CREATE INDEX IF NOT EXISTS idx_shared_drafts_ticket_id ON cs_shared_drafts(ticket_id);
CREATE INDEX IF NOT EXISTS idx_shared_drafts_status ON cs_shared_drafts(status);
CREATE INDEX IF NOT EXISTS idx_shared_drafts_updated_at ON cs_shared_drafts(updated_at);

-- Add comments
COMMENT ON TABLE cs_shared_drafts IS 'Collaborative drafts that can be edited by multiple team members';
COMMENT ON COLUMN cs_shared_drafts.version IS 'Increments on each edit for conflict detection';
