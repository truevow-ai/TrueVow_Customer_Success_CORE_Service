-- ============================================================================
-- REPORTING SYSTEM
-- ============================================================================
-- Migration: 019_reporting_system.sql
-- Description: Database schema for report generation and scheduled reports
-- Created: 2026-01-11

-- Report Templates
CREATE TABLE IF NOT EXISTS cs_report_templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID, -- NULL for default templates
    
    -- Template Identification
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN (
        'ticket_summary',
        'agent_performance',
        'team_performance',
        'customer_satisfaction',
        'sla_compliance',
        'usage_analytics',
        'health_scores',
        'churn_risk',
        'custom'
    )),
    description TEXT,
    
    -- Report Configuration
    report_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    /*
    Report config structure:
    {
        "sections": [
            {
                "name": "Ticket Summary",
                "data_source": "tickets",
                "filters": { "status": "resolved", "period": "last_30_days" },
                "metrics": ["total_tickets", "resolution_rate", "avg_resolution_time"]
            }
        ],
        "format": "pdf",
        "include_charts": true,
        "include_tables": true
    }
    */
    
    -- Schedule Configuration (if scheduled)
    schedule_type VARCHAR(50) CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'none')),
    schedule_config JSONB DEFAULT '{}'::jsonb,
    /*
    Schedule config structure:
    {
        "day_of_week": 1, // Monday (0-6, Sunday=0)
        "day_of_month": 1, // 1st of month
        "time": "09:00", // Time in HH:MM format
        "timezone": "America/New_York",
        "recipients": ["email1@example.com", "email2@example.com"]
    }
    */
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Generated Reports
CREATE TABLE IF NOT EXISTS cs_reports (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    template_id UUID REFERENCES cs_report_templates(template_id) ON DELETE SET NULL,
    
    -- Report Identification
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    
    -- Report Data
    report_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- Aggregated report data
    report_config JSONB NOT NULL DEFAULT '{}'::jsonb, -- Config used to generate report
    
    -- File Storage
    file_path TEXT, -- Path to PDF file (if generated)
    file_size_bytes BIGINT,
    file_url TEXT, -- URL to access the report file
    
    -- Generation Info
    generated_by UUID, -- User who generated the report
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    generation_duration_ms INT, -- Time taken to generate report
    
    -- Period Covered
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'generating' CHECK (status IN (
        'generating',
        'completed',
        'failed',
        'expired'
    )),
    error_message TEXT,
    
    -- Expiration
    expires_at TIMESTAMPTZ, -- Reports expire after 90 days by default
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scheduled Report Executions
CREATE TABLE IF NOT EXISTS cs_scheduled_report_executions (
    execution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES cs_report_templates(template_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    
    -- Execution Info
    scheduled_at TIMESTAMPTZ NOT NULL, -- When it was scheduled to run
    executed_at TIMESTAMPTZ, -- When it actually ran
    execution_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (execution_status IN (
        'pending',
        'running',
        'completed',
        'failed',
        'skipped'
    )),
    
    -- Generated Report
    report_id UUID REFERENCES cs_reports(report_id) ON DELETE SET NULL,
    
    -- Error Info
    error_message TEXT,
    retry_count INT DEFAULT 0,
    next_retry_at TIMESTAMPTZ,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Report Access Logs (Track who viewed/downloaded reports)
CREATE TABLE IF NOT EXISTS cs_report_access_logs (
    log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES cs_reports(report_id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    access_type VARCHAR(50) NOT NULL CHECK (access_type IN ('viewed', 'downloaded', 'shared')),
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_report_templates_tenant ON cs_report_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_templates_type ON cs_report_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_report_templates_schedule ON cs_report_templates(schedule_type);

CREATE INDEX IF NOT EXISTS idx_reports_tenant ON cs_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reports_template ON cs_reports(template_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON cs_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON cs_reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_generated ON cs_reports(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_period ON cs_reports(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_scheduled_executions_template ON cs_scheduled_report_executions(template_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_executions_tenant ON cs_scheduled_report_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_executions_status ON cs_scheduled_report_executions(execution_status);
CREATE INDEX IF NOT EXISTS idx_scheduled_executions_scheduled ON cs_scheduled_report_executions(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_report_access_report ON cs_report_access_logs(report_id);
CREATE INDEX IF NOT EXISTS idx_report_access_user ON cs_report_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_report_access_at ON cs_report_access_logs(accessed_at DESC);

-- Triggers
CREATE OR REPLACE FUNCTION update_cs_report_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_cs_report_templates_updated_at ON cs_report_templates;
CREATE TRIGGER trigger_update_cs_report_templates_updated_at
    BEFORE UPDATE ON cs_report_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_cs_report_templates_updated_at();

CREATE OR REPLACE FUNCTION update_cs_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_cs_reports_updated_at ON cs_reports;
CREATE TRIGGER trigger_update_cs_reports_updated_at
    BEFORE UPDATE ON cs_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_cs_reports_updated_at();

CREATE OR REPLACE FUNCTION update_cs_scheduled_report_executions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_cs_scheduled_report_executions_updated_at ON cs_scheduled_report_executions;
CREATE TRIGGER trigger_update_cs_scheduled_report_executions_updated_at
    BEFORE UPDATE ON cs_scheduled_report_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_cs_scheduled_report_executions_updated_at();

-- Auto-expire old reports (90 days)
CREATE OR REPLACE FUNCTION expire_old_reports()
RETURNS void AS $$
BEGIN
    UPDATE cs_reports
    SET status = 'expired'
    WHERE status = 'completed'
      AND expires_at IS NOT NULL
      AND expires_at < NOW()
      AND status != 'expired';
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE cs_report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_scheduled_report_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_report_access_logs ENABLE ROW LEVEL SECURITY;

-- Report Templates: Users can view templates for their tenant or default templates
DROP POLICY IF EXISTS report_templates_select ON cs_report_templates;
CREATE POLICY report_templates_select ON cs_report_templates
    FOR SELECT
    USING (
        tenant_id IS NULL OR -- Default templates
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = current_setting('app.current_clerk_user_id', true)
        )
    );

-- Reports: Users can view reports for their tenant
DROP POLICY IF EXISTS reports_select ON cs_reports;
CREATE POLICY reports_select ON cs_reports
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = current_setting('app.current_clerk_user_id', true)
        )
    );

-- Scheduled Executions: Users can view executions for their tenant
DROP POLICY IF EXISTS scheduled_executions_select ON cs_scheduled_report_executions;
CREATE POLICY scheduled_executions_select ON cs_scheduled_report_executions
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM cs_team_members
            WHERE clerk_user_id = current_setting('app.current_clerk_user_id', true)
        )
    );

-- Report Access Logs: Users can view their own access logs
DROP POLICY IF EXISTS report_access_logs_select ON cs_report_access_logs;
CREATE POLICY report_access_logs_select ON cs_report_access_logs
    FOR SELECT
    USING (
        user_id::text = current_setting('app.current_clerk_user_id', true)
    );

-- Comments
COMMENT ON TABLE cs_report_templates IS 'Report templates for generating various types of reports';
COMMENT ON TABLE cs_reports IS 'Generated reports with aggregated data and file storage';
COMMENT ON TABLE cs_scheduled_report_executions IS 'Execution history for scheduled reports';
COMMENT ON TABLE cs_report_access_logs IS 'Access logs for report viewing and downloading';
