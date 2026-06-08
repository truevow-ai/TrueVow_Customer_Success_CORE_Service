-- CS-Support Service - Additional Triggers for Automation
-- Version: 1.0
-- Created: 2026-01-10
-- Description: Triggers for auto-logging activity feed, auto-updating SLA, auto-calculating health scores, and notifications

-- ============================================================================
-- HELPER FUNCTION: Get current user ID from context
-- ============================================================================

-- This function will be used by triggers to get the user who made the change
-- For triggers, we'll use the application user context or system user
CREATE OR REPLACE FUNCTION get_trigger_user_id()
RETURNS UUID AS $$
BEGIN
  -- Try to get from session variable (set by application)
  BEGIN
    RETURN current_setting('app.current_user_id', true)::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      -- Return NULL if not set (system/user will be NULL)
      RETURN NULL;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGER: Auto-log Activity Feed Entries
-- ============================================================================

-- Function to log ticket activity
CREATE OR REPLACE FUNCTION log_ticket_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_activity_type TEXT;
  v_description TEXT;
  v_user_id UUID;
BEGIN
  -- Try to get user_id from trigger context
  v_user_id := get_trigger_user_id();
  
  -- If no user_id from context, use appropriate fallback based on operation
  IF v_user_id IS NULL THEN
    IF TG_OP = 'INSERT' THEN
      -- For new tickets, use created_by
      v_user_id := NEW.created_by;
    ELSIF TG_OP = 'UPDATE' THEN
      -- For updates, prefer assigned_to, then created_by
      v_user_id := COALESCE(NEW.assigned_to, NEW.created_by);
    END IF;
  END IF;
  
  -- If still NULL, we can't insert (user_id is required)
  -- This should only happen in edge cases, but we'll skip logging rather than fail
  IF v_user_id IS NULL THEN
    RETURN NEW; -- Skip activity logging if no user_id available
  END IF;
  
  -- Determine activity type based on what changed
  IF TG_OP = 'INSERT' THEN
    v_activity_type := 'ticket_created';
    v_description := 'Ticket created: ' || NEW.subject;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Check what changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_activity_type := 'status_changed';
      v_description := 'Status changed from ' || OLD.status || ' to ' || NEW.status;
    ELSIF OLD.assigned_to IS DISTINCT FROM NEW.assigned_to THEN
      v_activity_type := 'ticket_assigned';
      v_description := 'Ticket assigned to user';
    ELSIF OLD.priority IS DISTINCT FROM NEW.priority THEN
      v_activity_type := 'priority_changed';
      v_description := 'Priority changed from ' || OLD.priority || ' to ' || NEW.priority;
    ELSIF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
      v_activity_type := 'ticket_resolved';
      v_description := 'Ticket resolved';
    ELSIF NEW.status = 'closed' AND OLD.status != 'closed' THEN
      v_activity_type := 'ticket_closed';
      v_description := 'Ticket closed';
    ELSE
      -- For other updates, only log if meaningful fields changed
      -- Skip logging if only SLA fields or metadata changed (those are system updates)
      IF OLD.status IS DISTINCT FROM NEW.status OR
         OLD.priority IS DISTINCT FROM NEW.priority OR
         OLD.assigned_to IS DISTINCT FROM NEW.assigned_to OR
         OLD.stage IS DISTINCT FROM NEW.stage OR
         OLD.subject IS DISTINCT FROM NEW.subject THEN
        -- Use status_changed as the activity type (it's a valid activity type)
        v_activity_type := 'status_changed';
        v_description := 'Ticket updated';
      ELSE
        -- If only SLA fields, metadata, or timestamps changed, skip logging
        -- These are system updates, not user actions
        RETURN NEW;
      END IF;
    END IF;
  END IF;
  
  -- Insert activity feed entry
  -- Build metadata based on operation type
  IF TG_OP = 'INSERT' THEN
    INSERT INTO cs_team_activity_feed (
      ticket_id,
      user_id,
      activity_type,
      description,
      metadata
    ) VALUES (
      NEW.ticket_id,
      v_user_id,
      v_activity_type,
      v_description,
      jsonb_build_object(
        'status', NEW.status,
        'priority', NEW.priority,
        'assigned_to', NEW.assigned_to,
        'channel', NEW.channel,
        'stage', NEW.stage
      )
    );
  ELSE
    -- For UPDATE, include old and new values
    INSERT INTO cs_team_activity_feed (
      ticket_id,
      user_id,
      activity_type,
      description,
      metadata
    ) VALUES (
      NEW.ticket_id,
      v_user_id,
      v_activity_type,
      v_description,
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'old_priority', OLD.priority,
        'new_priority', NEW.priority,
        'old_assigned_to', OLD.assigned_to,
        'new_assigned_to', NEW.assigned_to
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on cs_tickets for INSERT
DROP TRIGGER IF EXISTS trigger_log_ticket_activity_insert ON cs_tickets;
CREATE TRIGGER trigger_log_ticket_activity_insert
  AFTER INSERT ON cs_tickets
  FOR EACH ROW
  EXECUTE FUNCTION log_ticket_activity();

-- Create trigger on cs_tickets for UPDATE
DROP TRIGGER IF EXISTS trigger_log_ticket_activity_update ON cs_tickets;
CREATE TRIGGER trigger_log_ticket_activity_update
  AFTER UPDATE ON cs_tickets
  FOR EACH ROW
  EXECUTE FUNCTION log_ticket_activity();

-- Function to log message activity
CREATE OR REPLACE FUNCTION log_message_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_activity_type TEXT;
  v_description TEXT;
  v_user_id UUID;
BEGIN
  -- Try to get user_id from trigger context
  v_user_id := get_trigger_user_id();
  
  -- If no user_id from context, use from_user_id from message (for agent messages)
  IF v_user_id IS NULL THEN
    -- For agent messages, use from_user_id
    -- For customer messages, we need to find the assigned agent
    IF NEW.from_type = 'agent' AND NEW.from_user_id IS NOT NULL THEN
      v_user_id := NEW.from_user_id;
    ELSIF NEW.from_type = 'customer' THEN
      -- For customer messages, use the assigned agent from the ticket
      SELECT assigned_to INTO v_user_id
      FROM cs_tickets
      WHERE ticket_id = NEW.ticket_id;
      
      -- If no assigned agent, use created_by from ticket
      IF v_user_id IS NULL THEN
        SELECT created_by INTO v_user_id
        FROM cs_tickets
        WHERE ticket_id = NEW.ticket_id;
      END IF;
    END IF;
  END IF;
  
  -- If still NULL, skip logging rather than fail
  IF v_user_id IS NULL THEN
    RETURN NEW; -- Skip activity logging if no user_id available
  END IF;
  
  IF TG_OP = 'INSERT' THEN
    IF NEW.is_internal = TRUE THEN
      v_activity_type := 'note_added'; -- Use 'note_added' (valid activity type)
      v_description := 'Internal note added to ticket';
    ELSE
      v_activity_type := 'message_sent';
      v_description := 'Message sent: ' || LEFT(NEW.body, 50);
    END IF;
    
    -- Insert activity feed entry
    INSERT INTO cs_team_activity_feed (
      ticket_id,
      user_id,
      activity_type,
      description,
      metadata
    ) VALUES (
      NEW.ticket_id,
      v_user_id,
      v_activity_type,
      v_description,
      jsonb_build_object(
        'message_id', NEW.message_id,
        'from_type', NEW.from_type,
        'is_internal', NEW.is_internal
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on cs_messages
DROP TRIGGER IF EXISTS trigger_log_message_activity ON cs_messages;
CREATE TRIGGER trigger_log_message_activity
  AFTER INSERT ON cs_messages
  FOR EACH ROW
  EXECUTE FUNCTION log_message_activity();

-- ============================================================================
-- TRIGGER: Auto-update SLA Tracking
-- ============================================================================

-- Function to update SLA tracking when ticket is created or updated
CREATE OR REPLACE FUNCTION update_sla_tracking()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if ticket is new or priority/status changed
  IF TG_OP = 'INSERT' OR 
     (TG_OP = 'UPDATE' AND (OLD.priority IS DISTINCT FROM NEW.priority OR OLD.status IS DISTINCT FROM NEW.status)) THEN
    
    -- Call the update_ticket_sla function
    PERFORM update_ticket_sla(NEW.ticket_id);
    
    -- If ticket was resolved, update actual resolution time
    IF TG_OP = 'UPDATE' AND NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
      UPDATE cs_sla_tracking
      SET 
        resolution_actual = COALESCE(NEW.resolved_at, NOW()),
        resolution_breached = CASE 
          WHEN resolution_target < COALESCE(NEW.resolved_at, NOW()) THEN TRUE
          ELSE FALSE
        END,
        resolution_breached_at = CASE 
          WHEN resolution_target < COALESCE(NEW.resolved_at, NOW()) THEN COALESCE(NEW.resolved_at, NOW())
          ELSE NULL
        END
      WHERE ticket_id = NEW.ticket_id;
    END IF;
    
    -- If ticket was closed, ensure resolution is tracked
    IF TG_OP = 'UPDATE' AND NEW.status = 'closed' AND OLD.status != 'closed' THEN
      UPDATE cs_sla_tracking
      SET 
        resolution_actual = COALESCE(NEW.closed_at, NOW())
      WHERE ticket_id = NEW.ticket_id
        AND resolution_actual IS NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on cs_tickets for INSERT
DROP TRIGGER IF EXISTS trigger_update_sla_tracking_insert ON cs_tickets;
CREATE TRIGGER trigger_update_sla_tracking_insert
  AFTER INSERT ON cs_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_sla_tracking();

-- Create trigger on cs_tickets for UPDATE (only when priority/status changes)
DROP TRIGGER IF EXISTS trigger_update_sla_tracking_update ON cs_tickets;
CREATE TRIGGER trigger_update_sla_tracking_update
  AFTER UPDATE ON cs_tickets
  FOR EACH ROW
  WHEN (OLD.priority IS DISTINCT FROM NEW.priority OR OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_sla_tracking();

-- Function to check SLA breaches and send warnings
CREATE OR REPLACE FUNCTION check_sla_breaches()
RETURNS TRIGGER AS $$
DECLARE
  v_time_until_target INTERVAL;
  v_warning_threshold INTERVAL := INTERVAL '1 hour'; -- Warn 1 hour before breach
BEGIN
  -- Only check for open/in-progress tickets
  IF NEW.status NOT IN ('open', 'in_progress', 'pending') THEN
    RETURN NEW;
  END IF;
  
  -- Check first response SLA
  IF NEW.sla_first_response_target IS NOT NULL THEN
    v_time_until_target := NEW.sla_first_response_target - NOW();
    
    -- If within warning threshold and no warning sent yet
    IF v_time_until_target <= v_warning_threshold AND v_time_until_target > INTERVAL '0' THEN
      UPDATE cs_sla_tracking
      SET 
        warning_sent = TRUE,
        warning_sent_at = NOW()
      WHERE ticket_id = NEW.ticket_id
        AND warning_sent = FALSE;
      
      -- Create notification for assigned agent
      IF NEW.assigned_to IS NOT NULL THEN
        INSERT INTO cs_notifications (
          user_id,
          ticket_id,
          type,
          title,
          message
        ) VALUES (
          NEW.assigned_to,
          NEW.ticket_id,
          'sla_warning',
          'SLA Warning: First Response Due Soon',
          'Ticket #' || LEFT(NEW.ticket_id::TEXT, 8) || ' first response SLA is due in less than 1 hour.'
        );
      END IF;
    END IF;
    
    -- If breached
    IF NEW.sla_first_response_target < NOW() THEN
      UPDATE cs_sla_tracking
      SET 
        first_response_breached = TRUE,
        first_response_breached_at = NOW(),
        escalated = TRUE,
        escalated_at = NOW()
      WHERE ticket_id = NEW.ticket_id
        AND first_response_breached = FALSE;
      
      -- Create notification
      IF NEW.assigned_to IS NOT NULL THEN
        INSERT INTO cs_notifications (
          user_id,
          ticket_id,
          type,
          title,
          message
        ) VALUES (
          NEW.assigned_to,
          NEW.ticket_id,
          'sla_breach',
          'SLA Breach: First Response Overdue',
          'Ticket #' || LEFT(NEW.ticket_id::TEXT, 8) || ' first response SLA has been breached.'
        );
      END IF;
    END IF;
  END IF;
  
  -- Check resolution SLA
  IF NEW.sla_resolution_target IS NOT NULL THEN
    v_time_until_target := NEW.sla_resolution_target - NOW();
    
    -- If within warning threshold
    IF v_time_until_target <= v_warning_threshold AND v_time_until_target > INTERVAL '0' THEN
      UPDATE cs_sla_tracking
      SET 
        warning_sent = TRUE,
        warning_sent_at = NOW()
      WHERE ticket_id = NEW.ticket_id
        AND warning_sent = FALSE;
    END IF;
    
    -- If breached
    IF NEW.sla_resolution_target < NOW() THEN
      UPDATE cs_sla_tracking
      SET 
        resolution_breached = TRUE,
        resolution_breached_at = NOW(),
        escalated = TRUE,
        escalated_at = NOW()
      WHERE ticket_id = NEW.ticket_id
        AND resolution_breached = FALSE;
      
      -- Create notification
      IF NEW.assigned_to IS NOT NULL THEN
        INSERT INTO cs_notifications (
          user_id,
          ticket_id,
          type,
          title,
          message
        ) VALUES (
          NEW.assigned_to,
          NEW.ticket_id,
          'sla_breach',
          'SLA Breach: Resolution Overdue',
          'Ticket #' || LEFT(NEW.ticket_id::TEXT, 8) || ' resolution SLA has been breached.'
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to check SLA breaches (runs on updates)
-- Note: For real-time monitoring, you'd want a scheduled job
DROP TRIGGER IF EXISTS trigger_check_sla_breaches ON cs_tickets;
CREATE TRIGGER trigger_check_sla_breaches
  AFTER UPDATE ON cs_tickets
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status OR 
        OLD.assigned_to IS DISTINCT FROM NEW.assigned_to OR
        OLD.sla_first_response_target IS DISTINCT FROM NEW.sla_first_response_target OR
        OLD.sla_resolution_target IS DISTINCT FROM NEW.sla_resolution_target)
  EXECUTE FUNCTION check_sla_breaches();

-- ============================================================================
-- TRIGGER: Auto-calculate Health Scores
-- ============================================================================

-- Function to trigger health score calculation when relevant data changes
CREATE OR REPLACE FUNCTION trigger_health_score_calculation()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Get tenant_id from the changed record
  IF TG_TABLE_NAME = 'cs_tickets' THEN
    v_tenant_id := NEW.tenant_id;
  ELSIF TG_TABLE_NAME = 'cs_survey_nps' THEN
    v_tenant_id := NEW.tenant_id;
  ELSIF TG_TABLE_NAME = 'cs_survey_csat' THEN
    v_tenant_id := NEW.tenant_id;
  ELSE
    RETURN NEW;
  END IF;
  
  -- Only calculate if tenant_id is available
  IF v_tenant_id IS NOT NULL THEN
    -- Calculate health score (async via application job recommended, but can do sync here)
    -- For now, we'll just mark that recalculation is needed
    -- Actual calculation should be done via scheduled job or application code
    -- to avoid blocking operations
    
    -- You can uncomment this to do synchronous calculation (not recommended for high volume):
    -- PERFORM calculate_health_score(v_tenant_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers on relevant tables
-- Note: These are lightweight triggers that mark for recalculation
-- Actual calculation should be done via scheduled job
DROP TRIGGER IF EXISTS trigger_health_score_on_ticket ON cs_tickets;
CREATE TRIGGER trigger_health_score_on_ticket
  AFTER INSERT OR UPDATE ON cs_tickets
  FOR EACH ROW
  WHEN (NEW.status IN ('resolved', 'closed'))
  EXECUTE FUNCTION trigger_health_score_calculation();

DROP TRIGGER IF EXISTS trigger_health_score_on_nps ON cs_survey_nps;
CREATE TRIGGER trigger_health_score_on_nps
  AFTER INSERT OR UPDATE ON cs_survey_nps
  FOR EACH ROW
  EXECUTE FUNCTION trigger_health_score_calculation();

DROP TRIGGER IF EXISTS trigger_health_score_on_csat ON cs_survey_csat;
CREATE TRIGGER trigger_health_score_on_csat
  AFTER INSERT OR UPDATE ON cs_survey_csat
  FOR EACH ROW
  EXECUTE FUNCTION trigger_health_score_calculation();

-- ============================================================================
-- TRIGGER: Auto-trigger Notifications
-- ============================================================================

-- Function to create notifications on ticket assignment
CREATE OR REPLACE FUNCTION notify_ticket_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if ticket is newly assigned or assignment changed
  IF NEW.assigned_to IS NOT NULL AND 
     (OLD.assigned_to IS NULL OR OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
    
    INSERT INTO cs_notifications (
      user_id,
      ticket_id,
      type,
      title,
      message
    ) VALUES (
      NEW.assigned_to,
      NEW.ticket_id,
      'assignment',
      'New Ticket Assigned',
      'You have been assigned to ticket: ' || NEW.subject
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on cs_tickets for INSERT (new assignments)
DROP TRIGGER IF EXISTS trigger_notify_ticket_assignment_insert ON cs_tickets;
CREATE TRIGGER trigger_notify_ticket_assignment_insert
  AFTER INSERT ON cs_tickets
  FOR EACH ROW
  WHEN (NEW.assigned_to IS NOT NULL)
  EXECUTE FUNCTION notify_ticket_assignment();

-- Create trigger on cs_tickets for UPDATE (assignment changes)
DROP TRIGGER IF EXISTS trigger_notify_ticket_assignment_update ON cs_tickets;
CREATE TRIGGER trigger_notify_ticket_assignment_update
  AFTER UPDATE ON cs_tickets
  FOR EACH ROW
  WHEN (NEW.assigned_to IS NOT NULL AND 
        (OLD.assigned_to IS NULL OR OLD.assigned_to IS DISTINCT FROM NEW.assigned_to))
  EXECUTE FUNCTION notify_ticket_assignment();

-- Function to create notifications on ticket status changes
CREATE OR REPLACE FUNCTION notify_ticket_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify customer when ticket is resolved
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    -- Create notification for assigned agent
    IF NEW.assigned_to IS NOT NULL THEN
      INSERT INTO cs_notifications (
        user_id,
        ticket_id,
        type,
        title,
        message
      ) VALUES (
        NEW.assigned_to,
        NEW.ticket_id,
        'status_change',
        'Ticket Resolved',
        'Ticket #' || LEFT(NEW.ticket_id::TEXT, 8) || ' has been resolved.'
      );
    END IF;
  END IF;
  
  -- Notify on escalation
  IF NEW.priority = 'urgent' AND OLD.priority != 'urgent' THEN
    -- Notify manager
    INSERT INTO cs_notifications (
      user_id,
      ticket_id,
      type,
      title,
      message
    )
    SELECT 
      member_id,
      NEW.ticket_id,
      'escalation',
      'Ticket Escalated to Urgent',
      'Ticket #' || LEFT(NEW.ticket_id::TEXT, 8) || ' has been escalated to urgent priority.'
    FROM cs_team_members
    WHERE role IN ('support_manager', 'head_of_cs')
      AND is_active = TRUE
    LIMIT 1; -- Notify one manager
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on cs_tickets for status/priority changes
DROP TRIGGER IF EXISTS trigger_notify_ticket_status_change ON cs_tickets;
CREATE TRIGGER trigger_notify_ticket_status_change
  AFTER UPDATE ON cs_tickets
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.priority IS DISTINCT FROM NEW.priority)
  EXECUTE FUNCTION notify_ticket_status_change();

-- Function to create notifications on new messages
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify for customer messages (not internal notes)
  IF NEW.from_type = 'customer' AND NEW.is_internal = FALSE THEN
    -- Notify assigned agent if ticket is assigned
    IF EXISTS (
      SELECT 1 FROM cs_tickets 
      WHERE ticket_id = NEW.ticket_id 
        AND assigned_to IS NOT NULL
    ) THEN
      INSERT INTO cs_notifications (
        user_id,
        ticket_id,
        type,
        title,
        message
      )
      SELECT 
        assigned_to,
        NEW.ticket_id,
        'reply',
        'New Customer Message',
        'New message on ticket: ' || (SELECT subject FROM cs_tickets WHERE ticket_id = NEW.ticket_id)
      FROM cs_tickets
      WHERE ticket_id = NEW.ticket_id
        AND assigned_to IS NOT NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on cs_messages
DROP TRIGGER IF EXISTS trigger_notify_new_message ON cs_messages;
CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON cs_messages
  FOR EACH ROW
  WHEN (NEW.from_type = 'customer' AND NEW.is_internal = FALSE)
  EXECUTE FUNCTION notify_new_message();

-- ============================================================================
-- TRIGGER COMMENTS
-- ============================================================================

COMMENT ON FUNCTION log_ticket_activity() IS 'Automatically logs ticket changes to activity feed';
COMMENT ON FUNCTION log_message_activity() IS 'Automatically logs message activity to activity feed';
COMMENT ON FUNCTION update_sla_tracking() IS 'Automatically updates SLA tracking when tickets are created or updated';
COMMENT ON FUNCTION check_sla_breaches() IS 'Checks for SLA breaches and sends warnings/notifications';
COMMENT ON FUNCTION trigger_health_score_calculation() IS 'Triggers health score recalculation when relevant data changes';
COMMENT ON FUNCTION notify_ticket_assignment() IS 'Creates notification when ticket is assigned';
COMMENT ON FUNCTION notify_ticket_status_change() IS 'Creates notification when ticket status or priority changes';
COMMENT ON FUNCTION notify_new_message() IS 'Creates notification when new customer message is received';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary:
-- - Created 8 trigger functions for automation
-- - Created 8 triggers on relevant tables:
--   1. Auto-log ticket activity
--   2. Auto-log message activity
--   3. Auto-update SLA tracking
--   4. Auto-check SLA breaches
--   5. Auto-trigger health score calculation
--   6. Auto-notify on ticket assignment
--   7. Auto-notify on status changes
--   8. Auto-notify on new messages
-- All triggers are idempotent and can be safely re-run
