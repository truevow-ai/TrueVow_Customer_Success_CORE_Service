-- ============================================================================
-- FAQ ENTRIES TABLE
-- ============================================================================
-- Pre-approved FAQ questions and answers for Tier 1 Rule-Based FAQ Agent

CREATE TABLE IF NOT EXISTS cs_faq_entries (
    faq_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID, -- NULL for default FAQs available to all tenants
    
    -- FAQ Content
    question VARCHAR(500) NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100), -- e.g., 'onboarding', 'technical', 'billing', 'compliance'
    
    -- Matching
    match_keywords TEXT[], -- Keywords for matching queries
    match_intents TEXT[], -- Intent patterns (e.g., 'how_to', 'what_is', 'can_i')
    
    -- Metadata
    tags TEXT[],
    priority INT DEFAULT 0, -- Higher priority = shown first
    usage_count INT DEFAULT 0,
    helpful_count INT DEFAULT 0,
    not_helpful_count INT DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE, -- Default FAQs available to all tenants
    
    -- Links
    related_article_id UUID REFERENCES cs_kb_articles(article_id) ON DELETE SET NULL,
    related_link_url VARCHAR(500),
    related_link_text VARCHAR(255),
    
    -- Metadata
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_faq_entries_tenant ON cs_faq_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_faq_entries_category ON cs_faq_entries(category);
CREATE INDEX IF NOT EXISTS idx_faq_entries_active ON cs_faq_entries(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_faq_entries_default ON cs_faq_entries(is_default) WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_faq_entries_priority ON cs_faq_entries(priority DESC);

-- Full-text search index on question and answer
CREATE INDEX IF NOT EXISTS idx_faq_entries_search ON cs_faq_entries USING gin(to_tsvector('english', question || ' ' || answer));

-- Triggers
CREATE TRIGGER update_faq_entries_updated_at
    BEFORE UPDATE ON cs_faq_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE cs_faq_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Team members can view FAQs for their tenant
CREATE POLICY "team_members_view_own_tenant_faqs" ON cs_faq_entries
    FOR SELECT
    USING (
        tenant_id IS NULL OR tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = get_current_clerk_user_id()
        )
    );

-- Service role can insert/update (for automated processes)
-- Service role bypasses RLS automatically

COMMENT ON TABLE cs_faq_entries IS 'Pre-approved FAQ entries for Tier 1 Rule-Based FAQ Agent';
