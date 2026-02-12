-- CS-Support Service Table Renaming Migration
-- Version: 1.0
-- Created: 2026-01-08
-- Description: Rename all tables with appropriate prefixes to identify department/function
-- 
-- This migration renames all tables to use the "cs_" prefix to clearly identify
-- which department/function they belong to in the CS Support Service.
--
-- Benefits:
-- 1. Clear Organization: Easy to identify which department/function a table belongs to
-- 2. Namespace Separation: Prevents naming conflicts
-- 3. Better Documentation: Self-documenting table names
-- 4. Easier Maintenance: Grouped by function for easier management

-- ============================================================================
-- TABLE RENAMING
-- ============================================================================
-- 
-- IMPORTANT: This migration only runs if:
--   1. The old table names exist, AND
--   2. The new table names do NOT exist
--
-- If your database is fresh/empty, use database/migrations/001_initial_schema.sql instead,
-- which already creates tables with the new cs_ prefix names.
--
-- If tables already have the cs_ prefix, this migration will safely skip them.
--
-- This migration is idempotent - safe to run multiple times.

-- Check if migration is needed
DO $$
DECLARE
    old_count INTEGER;
    new_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO old_count FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'support_%';
    SELECT COUNT(*) INTO new_count FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'cs_%';
    
    IF old_count = 0 AND new_count > 0 THEN
        RAISE NOTICE 'All tables already use cs_ prefix. Migration not needed.';
    ELSIF old_count > 0 AND new_count = 0 THEN
        RAISE NOTICE 'Found % tables with old names. Proceeding with migration.', old_count;
    ELSIF old_count > 0 AND new_count > 0 THEN
        RAISE WARNING 'Both old and new table names exist. Please check your database state.';
    ELSE
        RAISE NOTICE 'No tables found. Database may be empty.';
    END IF;
END $$;

-- Core Support Tables
DO $$
BEGIN
    -- Only rename if old table exists AND new table doesn't exist
    -- Using pg_tables for more reliable checking
    BEGIN
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'support_tickets')
           AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cs_tickets') THEN
            ALTER TABLE support_tickets RENAME TO cs_tickets;
            RAISE NOTICE 'Renamed support_tickets to cs_tickets';
        ELSE
            RAISE NOTICE 'Skipped support_tickets (already renamed or does not exist)';
        END IF;
    EXCEPTION
        WHEN duplicate_table THEN
            RAISE NOTICE 'cs_tickets already exists. Skipping rename.';
        WHEN undefined_table THEN
            RAISE NOTICE 'support_tickets does not exist. Skipping rename.';
    END;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'support_messages')
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cs_messages') THEN
        ALTER TABLE support_messages RENAME TO cs_messages;
        RAISE NOTICE 'Renamed support_messages to cs_messages';
    ELSE
        RAISE NOTICE 'Skipped support_messages (already renamed or does not exist)';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'support_team_activity_feed')
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cs_team_activity_feed') THEN
        ALTER TABLE support_team_activity_feed RENAME TO cs_team_activity_feed;
        RAISE NOTICE 'Renamed support_team_activity_feed to cs_team_activity_feed';
    ELSE
        RAISE NOTICE 'Skipped support_team_activity_feed (already renamed or does not exist)';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'support_notifications')
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cs_notifications') THEN
        ALTER TABLE support_notifications RENAME TO cs_notifications;
        RAISE NOTICE 'Renamed support_notifications to cs_notifications';
    ELSE
        RAISE NOTICE 'Skipped support_notifications (already renamed or does not exist)';
    END IF;
    
    -- Agent & Performance Tables
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'support_agent_performance_metrics')
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cs_agent_performance_metrics') THEN
        ALTER TABLE support_agent_performance_metrics RENAME TO cs_agent_performance_metrics;
        RAISE NOTICE 'Renamed support_agent_performance_metrics to cs_agent_performance_metrics';
    ELSE
        RAISE NOTICE 'Skipped support_agent_performance_metrics (already renamed or does not exist)';
    END IF;
    
    -- Communication Logs
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'support_email_logs')
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cs_email_logs') THEN
        ALTER TABLE support_email_logs RENAME TO cs_email_logs;
        RAISE NOTICE 'Renamed support_email_logs to cs_email_logs';
    ELSE
        RAISE NOTICE 'Skipped support_email_logs (already renamed or does not exist)';
    END IF;
    
    -- Knowledge Base Tables
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'support_kb_articles')
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cs_kb_articles') THEN
        ALTER TABLE support_kb_articles RENAME TO cs_kb_articles;
        RAISE NOTICE 'Renamed support_kb_articles to cs_kb_articles';
    ELSE
        RAISE NOTICE 'Skipped support_kb_articles (already renamed or does not exist)';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'support_kb_categories')
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cs_kb_categories') THEN
        ALTER TABLE support_kb_categories RENAME TO cs_kb_categories;
        RAISE NOTICE 'Renamed support_kb_categories to cs_kb_categories';
    ELSE
        RAISE NOTICE 'Skipped support_kb_categories (already renamed or does not exist)';
    END IF;
    
    -- SLA & Quality Tables
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'support_sla_policies')
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cs_sla_policies') THEN
        ALTER TABLE support_sla_policies RENAME TO cs_sla_policies;
        RAISE NOTICE 'Renamed support_sla_policies to cs_sla_policies';
    ELSE
        RAISE NOTICE 'Skipped support_sla_policies (already renamed or does not exist)';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'support_csat_surveys')
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cs_survey_csat') THEN
        ALTER TABLE support_csat_surveys RENAME TO cs_survey_csat;
        RAISE NOTICE 'Renamed support_csat_surveys to cs_survey_csat';
    ELSE
        RAISE NOTICE 'Skipped support_csat_surveys (already renamed or does not exist)';
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'support_nps_scores')
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cs_survey_nps') THEN
        ALTER TABLE support_nps_scores RENAME TO cs_survey_nps;
        RAISE NOTICE 'Renamed support_nps_scores to cs_survey_nps';
    ELSE
        RAISE NOTICE 'Skipped support_nps_scores (already renamed or does not exist)';
    END IF;
    
    -- Customer Success Tables
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customer_health_scores')
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cs_customer_health_scores') THEN
        ALTER TABLE customer_health_scores RENAME TO cs_customer_health_scores;
        RAISE NOTICE 'Renamed customer_health_scores to cs_customer_health_scores';
    ELSE
        RAISE NOTICE 'Skipped customer_health_scores (already renamed or does not exist)';
    END IF;
    
    -- Team Management Tables
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'support_team_members')
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cs_team_members') THEN
        ALTER TABLE support_team_members RENAME TO cs_team_members;
        RAISE NOTICE 'Renamed support_team_members to cs_team_members';
    ELSE
        RAISE NOTICE 'Skipped support_team_members (already renamed or does not exist)';
    END IF;
END $$;

-- ============================================================================
-- FOREIGN KEY CONSTRAINT UPDATES
-- ============================================================================

-- Drop old foreign key constraints (if they exist)
DO $$
BEGIN
    -- Drop old constraints
    ALTER TABLE cs_messages DROP CONSTRAINT IF EXISTS support_messages_ticket_id_fkey;
    ALTER TABLE cs_messages DROP CONSTRAINT IF EXISTS support_messages_in_reply_to_fkey;
    ALTER TABLE cs_team_activity_feed DROP CONSTRAINT IF EXISTS support_team_activity_feed_ticket_id_fkey;
    ALTER TABLE cs_email_logs DROP CONSTRAINT IF EXISTS support_email_logs_ticket_id_fkey;
    ALTER TABLE cs_email_logs DROP CONSTRAINT IF EXISTS support_email_logs_message_id_fkey;
    ALTER TABLE cs_notifications DROP CONSTRAINT IF EXISTS support_notifications_ticket_id_fkey;
    ALTER TABLE cs_kb_articles DROP CONSTRAINT IF EXISTS fk_kb_articles_category;
    ALTER TABLE cs_kb_categories DROP CONSTRAINT IF EXISTS support_kb_categories_parent_category_id_fkey;
    ALTER TABLE cs_survey_csat DROP CONSTRAINT IF EXISTS support_csat_surveys_ticket_id_fkey;
END $$;

-- Recreate foreign key constraints with new table names (only if they don't exist)
DO $$
BEGIN
    -- cs_messages -> cs_tickets
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'cs_messages_ticket_id_fkey' 
        AND conrelid = 'cs_messages'::regclass
    ) THEN
        ALTER TABLE cs_messages 
            ADD CONSTRAINT cs_messages_ticket_id_fkey 
            FOREIGN KEY (ticket_id) REFERENCES cs_tickets(ticket_id) ON DELETE CASCADE;
        RAISE NOTICE 'Created constraint cs_messages_ticket_id_fkey';
    ELSE
        RAISE NOTICE 'Constraint cs_messages_ticket_id_fkey already exists. Skipping.';
    END IF;

    -- cs_messages -> cs_messages (self-reference)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'cs_messages_in_reply_to_fkey' 
        AND conrelid = 'cs_messages'::regclass
    ) THEN
        ALTER TABLE cs_messages 
            ADD CONSTRAINT cs_messages_in_reply_to_fkey 
            FOREIGN KEY (in_reply_to) REFERENCES cs_messages(message_id);
        RAISE NOTICE 'Created constraint cs_messages_in_reply_to_fkey';
    ELSE
        RAISE NOTICE 'Constraint cs_messages_in_reply_to_fkey already exists. Skipping.';
    END IF;

    -- cs_team_activity_feed -> cs_tickets
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'cs_team_activity_feed_ticket_id_fkey' 
        AND conrelid = 'cs_team_activity_feed'::regclass
    ) THEN
        ALTER TABLE cs_team_activity_feed 
            ADD CONSTRAINT cs_team_activity_feed_ticket_id_fkey 
            FOREIGN KEY (ticket_id) REFERENCES cs_tickets(ticket_id) ON DELETE CASCADE;
        RAISE NOTICE 'Created constraint cs_team_activity_feed_ticket_id_fkey';
    ELSE
        RAISE NOTICE 'Constraint cs_team_activity_feed_ticket_id_fkey already exists. Skipping.';
    END IF;

    -- cs_email_logs -> cs_tickets
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'cs_email_logs_ticket_id_fkey' 
        AND conrelid = 'cs_email_logs'::regclass
    ) THEN
        ALTER TABLE cs_email_logs 
            ADD CONSTRAINT cs_email_logs_ticket_id_fkey 
            FOREIGN KEY (ticket_id) REFERENCES cs_tickets(ticket_id) ON DELETE SET NULL;
        RAISE NOTICE 'Created constraint cs_email_logs_ticket_id_fkey';
    ELSE
        RAISE NOTICE 'Constraint cs_email_logs_ticket_id_fkey already exists. Skipping.';
    END IF;

    -- cs_email_logs -> cs_messages
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'cs_email_logs_message_id_fkey' 
        AND conrelid = 'cs_email_logs'::regclass
    ) THEN
        ALTER TABLE cs_email_logs 
            ADD CONSTRAINT cs_email_logs_message_id_fkey 
            FOREIGN KEY (message_id) REFERENCES cs_messages(message_id) ON DELETE SET NULL;
        RAISE NOTICE 'Created constraint cs_email_logs_message_id_fkey';
    ELSE
        RAISE NOTICE 'Constraint cs_email_logs_message_id_fkey already exists. Skipping.';
    END IF;

    -- cs_notifications -> cs_tickets
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'cs_notifications_ticket_id_fkey' 
        AND conrelid = 'cs_notifications'::regclass
    ) THEN
        ALTER TABLE cs_notifications 
            ADD CONSTRAINT cs_notifications_ticket_id_fkey 
            FOREIGN KEY (ticket_id) REFERENCES cs_tickets(ticket_id) ON DELETE CASCADE;
        RAISE NOTICE 'Created constraint cs_notifications_ticket_id_fkey';
    ELSE
        RAISE NOTICE 'Constraint cs_notifications_ticket_id_fkey already exists. Skipping.';
    END IF;

    -- cs_kb_articles -> cs_kb_categories
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'cs_kb_articles_category_id_fkey' 
        AND conrelid = 'cs_kb_articles'::regclass
    ) THEN
        ALTER TABLE cs_kb_articles 
            ADD CONSTRAINT cs_kb_articles_category_id_fkey 
            FOREIGN KEY (category_id) REFERENCES cs_kb_categories(category_id) ON DELETE SET NULL;
        RAISE NOTICE 'Created constraint cs_kb_articles_category_id_fkey';
    ELSE
        RAISE NOTICE 'Constraint cs_kb_articles_category_id_fkey already exists. Skipping.';
    END IF;

    -- cs_kb_categories -> cs_kb_categories (self-reference)
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'cs_kb_categories_parent_category_id_fkey' 
        AND conrelid = 'cs_kb_categories'::regclass
    ) THEN
        ALTER TABLE cs_kb_categories 
            ADD CONSTRAINT cs_kb_categories_parent_category_id_fkey 
            FOREIGN KEY (parent_category_id) REFERENCES cs_kb_categories(category_id) ON DELETE CASCADE;
        RAISE NOTICE 'Created constraint cs_kb_categories_parent_category_id_fkey';
    ELSE
        RAISE NOTICE 'Constraint cs_kb_categories_parent_category_id_fkey already exists. Skipping.';
    END IF;

    -- cs_survey_csat -> cs_tickets
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'cs_survey_csat_ticket_id_fkey' 
        AND conrelid = 'cs_survey_csat'::regclass
    ) THEN
        ALTER TABLE cs_survey_csat 
            ADD CONSTRAINT cs_survey_csat_ticket_id_fkey 
            FOREIGN KEY (ticket_id) REFERENCES cs_tickets(ticket_id) ON DELETE CASCADE;
        RAISE NOTICE 'Created constraint cs_survey_csat_ticket_id_fkey';
    ELSE
        RAISE NOTICE 'Constraint cs_survey_csat_ticket_id_fkey already exists. Skipping.';
    END IF;
END $$;

-- ============================================================================
-- INDEX RENAMING
-- ============================================================================
-- Note: Indexes are automatically renamed when tables are renamed in PostgreSQL,
-- but we'll rename them explicitly to ensure consistency.

DO $$
BEGIN
    -- Support Tickets Indexes
    -- Only rename if old index exists AND new index doesn't exist
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_tickets_tenant')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_tickets_tenant') THEN
        ALTER INDEX idx_support_tickets_tenant RENAME TO idx_cs_tickets_tenant;
        RAISE NOTICE 'Renamed index idx_support_tickets_tenant to idx_cs_tickets_tenant';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_tickets_tenant (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_tickets_status')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_tickets_status') THEN
        ALTER INDEX idx_support_tickets_status RENAME TO idx_cs_tickets_status;
        RAISE NOTICE 'Renamed index idx_support_tickets_status to idx_cs_tickets_status';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_tickets_status (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_tickets_stage')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_tickets_stage') THEN
        ALTER INDEX idx_support_tickets_stage RENAME TO idx_cs_tickets_stage;
        RAISE NOTICE 'Renamed index idx_support_tickets_stage to idx_cs_tickets_stage';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_tickets_stage (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_tickets_source')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_tickets_source') THEN
        ALTER INDEX idx_support_tickets_source RENAME TO idx_cs_tickets_source;
        RAISE NOTICE 'Renamed index idx_support_tickets_source to idx_cs_tickets_source';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_tickets_source (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_tickets_assigned')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_tickets_assigned') THEN
        ALTER INDEX idx_support_tickets_assigned RENAME TO idx_cs_tickets_assigned;
        RAISE NOTICE 'Renamed index idx_support_tickets_assigned to idx_cs_tickets_assigned';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_tickets_assigned (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_tickets_created')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_tickets_created') THEN
        ALTER INDEX idx_support_tickets_created RENAME TO idx_cs_tickets_created;
        RAISE NOTICE 'Renamed index idx_support_tickets_created to idx_cs_tickets_created';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_tickets_created (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_tickets_priority')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_tickets_priority') THEN
        ALTER INDEX idx_support_tickets_priority RENAME TO idx_cs_tickets_priority;
        RAISE NOTICE 'Renamed index idx_support_tickets_priority to idx_cs_tickets_priority';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_tickets_priority (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_tickets_channel')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_tickets_channel') THEN
        ALTER INDEX idx_support_tickets_channel RENAME TO idx_cs_tickets_channel;
        RAISE NOTICE 'Renamed index idx_support_tickets_channel to idx_cs_tickets_channel';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_tickets_channel (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_tickets_customer_email')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_tickets_customer_email') THEN
        ALTER INDEX idx_support_tickets_customer_email RENAME TO idx_cs_tickets_customer_email;
        RAISE NOTICE 'Renamed index idx_support_tickets_customer_email to idx_cs_tickets_customer_email';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_tickets_customer_email (already renamed or does not exist)';
    END IF;

    -- Support Messages Indexes
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_messages_ticket')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_messages_ticket') THEN
        ALTER INDEX idx_support_messages_ticket RENAME TO idx_cs_messages_ticket;
        RAISE NOTICE 'Renamed index idx_support_messages_ticket to idx_cs_messages_ticket';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_messages_ticket (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_messages_created')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_messages_created') THEN
        ALTER INDEX idx_support_messages_created RENAME TO idx_cs_messages_created;
        RAISE NOTICE 'Renamed index idx_support_messages_created to idx_cs_messages_created';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_messages_created (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_messages_sender')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_messages_sender') THEN
        ALTER INDEX idx_support_messages_sender RENAME TO idx_cs_messages_sender;
        RAISE NOTICE 'Renamed index idx_support_messages_sender to idx_cs_messages_sender';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_messages_sender (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_messages_in_reply_to')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_messages_in_reply_to') THEN
        ALTER INDEX idx_support_messages_in_reply_to RENAME TO idx_cs_messages_in_reply_to;
        RAISE NOTICE 'Renamed index idx_support_messages_in_reply_to to idx_cs_messages_in_reply_to';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_messages_in_reply_to (already renamed or does not exist)';
    END IF;

    -- Activity Feed Indexes
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_activity_ticket')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_team_activity_ticket') THEN
        ALTER INDEX idx_support_activity_ticket RENAME TO idx_cs_team_activity_ticket;
        RAISE NOTICE 'Renamed index idx_support_activity_ticket to idx_cs_team_activity_ticket';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_activity_ticket (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_activity_user')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_team_activity_user') THEN
        ALTER INDEX idx_support_activity_user RENAME TO idx_cs_team_activity_user;
        RAISE NOTICE 'Renamed index idx_support_activity_user to idx_cs_team_activity_user';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_activity_user (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_activity_type')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_team_activity_type') THEN
        ALTER INDEX idx_support_activity_type RENAME TO idx_cs_team_activity_type;
        RAISE NOTICE 'Renamed index idx_support_activity_type to idx_cs_team_activity_type';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_activity_type (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_activity_created')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_team_activity_created') THEN
        ALTER INDEX idx_support_activity_created RENAME TO idx_cs_team_activity_created;
        RAISE NOTICE 'Renamed index idx_support_activity_created to idx_cs_team_activity_created';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_activity_created (already renamed or does not exist)';
    END IF;

    -- Agent Performance Indexes
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_metrics_user')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_agent_metrics_user') THEN
        ALTER INDEX idx_support_metrics_user RENAME TO idx_cs_agent_metrics_user;
        RAISE NOTICE 'Renamed index idx_support_metrics_user to idx_cs_agent_metrics_user';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_metrics_user (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_metrics_period')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_agent_metrics_period') THEN
        ALTER INDEX idx_support_metrics_period RENAME TO idx_cs_agent_metrics_period;
        RAISE NOTICE 'Renamed index idx_support_metrics_period to idx_cs_agent_metrics_period';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_metrics_period (already renamed or does not exist)';
    END IF;

    -- Email Logs Indexes
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_email_ticket')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_email_ticket') THEN
        ALTER INDEX idx_support_email_ticket RENAME TO idx_cs_email_ticket;
        RAISE NOTICE 'Renamed index idx_support_email_ticket to idx_cs_email_ticket';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_email_ticket (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_email_message')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_email_message') THEN
        ALTER INDEX idx_support_email_message RENAME TO idx_cs_email_message;
        RAISE NOTICE 'Renamed index idx_support_email_message to idx_cs_email_message';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_email_message (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_email_status')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_email_status') THEN
        ALTER INDEX idx_support_email_status RENAME TO idx_cs_email_status;
        RAISE NOTICE 'Renamed index idx_support_email_status to idx_cs_email_status';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_email_status (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_email_sent')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_email_sent') THEN
        ALTER INDEX idx_support_email_sent RENAME TO idx_cs_email_sent;
        RAISE NOTICE 'Renamed index idx_support_email_sent to idx_cs_email_sent';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_email_sent (already renamed or does not exist)';
    END IF;

    -- Notifications Indexes
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_notifications_user')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_notifications_user') THEN
        ALTER INDEX idx_support_notifications_user RENAME TO idx_cs_notifications_user;
        RAISE NOTICE 'Renamed index idx_support_notifications_user to idx_cs_notifications_user';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_notifications_user (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_notifications_ticket')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_notifications_ticket') THEN
        ALTER INDEX idx_support_notifications_ticket RENAME TO idx_cs_notifications_ticket;
        RAISE NOTICE 'Renamed index idx_support_notifications_ticket to idx_cs_notifications_ticket';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_notifications_ticket (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_notifications_read')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_notifications_read') THEN
        ALTER INDEX idx_support_notifications_read RENAME TO idx_cs_notifications_read;
        RAISE NOTICE 'Renamed index idx_support_notifications_read to idx_cs_notifications_read';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_notifications_read (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_notifications_type')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_notifications_type') THEN
        ALTER INDEX idx_support_notifications_type RENAME TO idx_cs_notifications_type;
        RAISE NOTICE 'Renamed index idx_support_notifications_type to idx_cs_notifications_type';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_notifications_type (already renamed or does not exist)';
    END IF;

    -- KB Articles Indexes
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_kb_status')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_kb_status') THEN
        ALTER INDEX idx_support_kb_status RENAME TO idx_cs_kb_status;
        RAISE NOTICE 'Renamed index idx_support_kb_status to idx_cs_kb_status';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_kb_status (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_kb_category')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_kb_category') THEN
        ALTER INDEX idx_support_kb_category RENAME TO idx_cs_kb_category;
        RAISE NOTICE 'Renamed index idx_support_kb_category to idx_cs_kb_category';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_kb_category (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_kb_published')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_kb_published') THEN
        ALTER INDEX idx_support_kb_published RENAME TO idx_cs_kb_published;
        RAISE NOTICE 'Renamed index idx_support_kb_published to idx_cs_kb_published';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_kb_published (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_kb_title_search')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_kb_title_search') THEN
        ALTER INDEX idx_support_kb_title_search RENAME TO idx_cs_kb_title_search;
        RAISE NOTICE 'Renamed index idx_support_kb_title_search to idx_cs_kb_title_search';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_kb_title_search (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_kb_content_search')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_kb_content_search') THEN
        ALTER INDEX idx_support_kb_content_search RENAME TO idx_cs_kb_content_search;
        RAISE NOTICE 'Renamed index idx_support_kb_content_search to idx_cs_kb_content_search';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_kb_content_search (already renamed or does not exist)';
    END IF;

    -- KB Categories Indexes
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_kb_categories_parent')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_kb_categories_parent') THEN
        ALTER INDEX idx_support_kb_categories_parent RENAME TO idx_cs_kb_categories_parent;
        RAISE NOTICE 'Renamed index idx_support_kb_categories_parent to idx_cs_kb_categories_parent';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_kb_categories_parent (already renamed or does not exist)';
    END IF;

    -- Customer Health Indexes
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_customer_health_tenant')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_customer_health_tenant') THEN
        ALTER INDEX idx_customer_health_tenant RENAME TO idx_cs_customer_health_tenant;
        RAISE NOTICE 'Renamed index idx_customer_health_tenant to idx_cs_customer_health_tenant';
    ELSE
        RAISE NOTICE 'Skipped index idx_customer_health_tenant (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_customer_health_level')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_customer_health_level') THEN
        ALTER INDEX idx_customer_health_level RENAME TO idx_cs_customer_health_level;
        RAISE NOTICE 'Renamed index idx_customer_health_level to idx_cs_customer_health_level';
    ELSE
        RAISE NOTICE 'Skipped index idx_customer_health_level (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_customer_health_calculated')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_customer_health_calculated') THEN
        ALTER INDEX idx_customer_health_calculated RENAME TO idx_cs_customer_health_calculated;
        RAISE NOTICE 'Renamed index idx_customer_health_calculated to idx_cs_customer_health_calculated';
    ELSE
        RAISE NOTICE 'Skipped index idx_customer_health_calculated (already renamed or does not exist)';
    END IF;

    -- CSAT Indexes
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_csat_ticket')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_survey_csat_ticket') THEN
        ALTER INDEX idx_support_csat_ticket RENAME TO idx_cs_survey_csat_ticket;
        RAISE NOTICE 'Renamed index idx_support_csat_ticket to idx_cs_survey_csat_ticket';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_csat_ticket (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_csat_tenant')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_survey_csat_tenant') THEN
        ALTER INDEX idx_support_csat_tenant RENAME TO idx_cs_survey_csat_tenant;
        RAISE NOTICE 'Renamed index idx_support_csat_tenant to idx_cs_survey_csat_tenant';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_csat_tenant (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_csat_submitted')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_survey_csat_submitted') THEN
        ALTER INDEX idx_support_csat_submitted RENAME TO idx_cs_survey_csat_submitted;
        RAISE NOTICE 'Renamed index idx_support_csat_submitted to idx_cs_survey_csat_submitted';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_csat_submitted (already renamed or does not exist)';
    END IF;

    -- NPS Indexes
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_nps_tenant')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_survey_nps_tenant') THEN
        ALTER INDEX idx_support_nps_tenant RENAME TO idx_cs_survey_nps_tenant;
        RAISE NOTICE 'Renamed index idx_support_nps_tenant to idx_cs_survey_nps_tenant';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_nps_tenant (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_nps_submitted')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_survey_nps_submitted') THEN
        ALTER INDEX idx_support_nps_submitted RENAME TO idx_cs_survey_nps_submitted;
        RAISE NOTICE 'Renamed index idx_support_nps_submitted to idx_cs_survey_nps_submitted';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_nps_submitted (already renamed or does not exist)';
    END IF;

    -- Team Members Indexes
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_team_user')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_team_user') THEN
        ALTER INDEX idx_support_team_user RENAME TO idx_cs_team_user;
        RAISE NOTICE 'Renamed index idx_support_team_user to idx_cs_team_user';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_team_user (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_team_clerk')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_team_clerk') THEN
        ALTER INDEX idx_support_team_clerk RENAME TO idx_cs_team_clerk;
        RAISE NOTICE 'Renamed index idx_support_team_clerk to idx_cs_team_clerk';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_team_clerk (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_team_role')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_team_role') THEN
        ALTER INDEX idx_support_team_role RENAME TO idx_cs_team_role;
        RAISE NOTICE 'Renamed index idx_support_team_role to idx_cs_team_role';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_team_role (already renamed or does not exist)';
    END IF;
    IF EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_support_team_active')
       AND NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_cs_team_active') THEN
        ALTER INDEX idx_support_team_active RENAME TO idx_cs_team_active;
        RAISE NOTICE 'Renamed index idx_support_team_active to idx_cs_team_active';
    ELSE
        RAISE NOTICE 'Skipped index idx_support_team_active (already renamed or does not exist)';
    END IF;
END $$;

-- ============================================================================
-- TRIGGER RENAMING
-- ============================================================================

-- Drop old triggers (if they exist)
DO $$
BEGIN
    DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON cs_tickets;
    DROP TRIGGER IF EXISTS update_support_kb_articles_updated_at ON cs_kb_articles;
    DROP TRIGGER IF EXISTS update_support_kb_categories_updated_at ON cs_kb_categories;
    DROP TRIGGER IF EXISTS update_support_team_members_updated_at ON cs_team_members;
    DROP TRIGGER IF EXISTS update_support_agent_performance_metrics_updated_at ON cs_agent_performance_metrics;
    DROP TRIGGER IF EXISTS update_support_sla_policies_updated_at ON cs_sla_policies;
END $$;

-- Recreate triggers with new names (only if they don't exist)
DO $$
BEGIN
    -- cs_tickets trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_cs_tickets_updated_at' 
        AND tgrelid = 'cs_tickets'::regclass
    ) THEN
        CREATE TRIGGER update_cs_tickets_updated_at BEFORE UPDATE ON cs_tickets
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger update_cs_tickets_updated_at';
    ELSE
        RAISE NOTICE 'Trigger update_cs_tickets_updated_at already exists. Skipping.';
    END IF;

    -- cs_kb_articles trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_cs_kb_articles_updated_at' 
        AND tgrelid = 'cs_kb_articles'::regclass
    ) THEN
        CREATE TRIGGER update_cs_kb_articles_updated_at BEFORE UPDATE ON cs_kb_articles
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger update_cs_kb_articles_updated_at';
    ELSE
        RAISE NOTICE 'Trigger update_cs_kb_articles_updated_at already exists. Skipping.';
    END IF;

    -- cs_kb_categories trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_cs_kb_categories_updated_at' 
        AND tgrelid = 'cs_kb_categories'::regclass
    ) THEN
        CREATE TRIGGER update_cs_kb_categories_updated_at BEFORE UPDATE ON cs_kb_categories
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger update_cs_kb_categories_updated_at';
    ELSE
        RAISE NOTICE 'Trigger update_cs_kb_categories_updated_at already exists. Skipping.';
    END IF;

    -- cs_team_members trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_cs_team_members_updated_at' 
        AND tgrelid = 'cs_team_members'::regclass
    ) THEN
        CREATE TRIGGER update_cs_team_members_updated_at BEFORE UPDATE ON cs_team_members
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger update_cs_team_members_updated_at';
    ELSE
        RAISE NOTICE 'Trigger update_cs_team_members_updated_at already exists. Skipping.';
    END IF;

    -- cs_agent_performance_metrics trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_cs_agent_performance_metrics_updated_at' 
        AND tgrelid = 'cs_agent_performance_metrics'::regclass
    ) THEN
        CREATE TRIGGER update_cs_agent_performance_metrics_updated_at BEFORE UPDATE ON cs_agent_performance_metrics
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger update_cs_agent_performance_metrics_updated_at';
    ELSE
        RAISE NOTICE 'Trigger update_cs_agent_performance_metrics_updated_at already exists. Skipping.';
    END IF;

    -- cs_sla_policies trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_cs_sla_policies_updated_at' 
        AND tgrelid = 'cs_sla_policies'::regclass
    ) THEN
        CREATE TRIGGER update_cs_sla_policies_updated_at BEFORE UPDATE ON cs_sla_policies
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created trigger update_cs_sla_policies_updated_at';
    ELSE
        RAISE NOTICE 'Trigger update_cs_sla_policies_updated_at already exists. Skipping.';
    END IF;
END $$;

-- ============================================================================
-- TABLE COMMENTS UPDATE
-- ============================================================================

COMMENT ON TABLE cs_tickets IS 'Support tickets for customer inquiries and issues';
COMMENT ON TABLE cs_messages IS 'Messages in support ticket conversation threads';
COMMENT ON TABLE cs_team_activity_feed IS 'Activity feed for team collaboration and tracking';
COMMENT ON TABLE cs_agent_performance_metrics IS 'Performance metrics for support agents';
COMMENT ON TABLE cs_email_logs IS 'Email logs for tracking email delivery and engagement';
COMMENT ON TABLE cs_notifications IS 'Notifications for support team members';
COMMENT ON TABLE cs_kb_articles IS 'Knowledge base articles for self-service support';
COMMENT ON TABLE cs_kb_categories IS 'Categories for organizing knowledge base articles';
COMMENT ON TABLE cs_customer_health_scores IS 'Customer health scores for proactive customer success';
COMMENT ON TABLE cs_sla_policies IS 'SLA policies for ticket response and resolution times';
COMMENT ON TABLE cs_survey_csat IS 'Customer Satisfaction (CSAT) survey responses';
COMMENT ON TABLE cs_survey_nps IS 'Net Promoter Score (NPS) survey responses';
COMMENT ON TABLE cs_team_members IS 'Support team member profiles and configurations';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary of changes:
-- - 13 tables renamed with cs_ prefix
-- - All foreign key constraints updated
-- - All indexes renamed
-- - All triggers renamed
-- - All table comments updated
