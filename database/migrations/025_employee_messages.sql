-- Migration: Employee Messages Table
-- Description: Creates employee_messages table for unified messaging service (SMS and WhatsApp)
-- Date: January 2026

-- Create employee_messages table
CREATE TABLE IF NOT EXISTS employee_messages (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'whatsapp')),
  sender_id UUID, -- NULL for inbound messages, references Clerk user ID
  recipient_phone TEXT NOT NULL,
  message_text TEXT NOT NULL,
  media_urls JSONB DEFAULT '[]'::jsonb, -- For WhatsApp: images, documents, videos
  message_status TEXT NOT NULL DEFAULT 'pending' CHECK (message_status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  read_at TIMESTAMPTZ, -- WhatsApp read receipt
  lead_id UUID, -- References lead (in Sales CRM service)
  contact_id UUID, -- References contact (in CS-Support or Sales CRM service)
  ticket_id UUID REFERENCES cs_tickets(ticket_id) ON DELETE SET NULL, -- For CS-Support tickets
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  external_message_id TEXT, -- Twilio message SID or WhatsApp message ID
  error_message TEXT, -- Error details if message failed
  service_type TEXT CHECK (service_type IN ('sales_crm', 'cs_support')), -- Which service sent/received
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_employee_messages_sender_id ON employee_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_employee_messages_recipient_phone ON employee_messages(recipient_phone);
CREATE INDEX IF NOT EXISTS idx_employee_messages_channel ON employee_messages(channel);
CREATE INDEX IF NOT EXISTS idx_employee_messages_status ON employee_messages(message_status);
CREATE INDEX IF NOT EXISTS idx_employee_messages_direction ON employee_messages(direction);
CREATE INDEX IF NOT EXISTS idx_employee_messages_lead_id ON employee_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_employee_messages_contact_id ON employee_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_employee_messages_ticket_id ON employee_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_employee_messages_service_type ON employee_messages(service_type);
CREATE INDEX IF NOT EXISTS idx_employee_messages_external_message_id ON employee_messages(external_message_id);
CREATE INDEX IF NOT EXISTS idx_employee_messages_created_at ON employee_messages(created_at DESC);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_employee_messages_recipient_channel ON employee_messages(recipient_phone, channel);
CREATE INDEX IF NOT EXISTS idx_employee_messages_sender_status ON employee_messages(sender_id, message_status) WHERE sender_id IS NOT NULL;

-- Enable RLS
ALTER TABLE employee_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Team members can view messages" ON employee_messages;
DROP POLICY IF EXISTS "Team members can send messages" ON employee_messages;
DROP POLICY IF EXISTS "System can manage all messages" ON employee_messages;

-- RLS Policies
-- Team members can view messages (their own or team-wide)
CREATE POLICY "Team members can view messages"
  ON employee_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cs_team_members
      WHERE cs_team_members.clerk_user_id = get_current_clerk_user_id()
    )
  );

-- Team members can send messages (create outbound messages)
CREATE POLICY "Team members can send messages"
  ON employee_messages
  FOR INSERT
  WITH CHECK (
    direction = 'outbound' AND
    EXISTS (
      SELECT 1 FROM cs_team_members
      WHERE cs_team_members.clerk_user_id = get_current_clerk_user_id()
    )
  );

-- System can manage all messages (for webhooks and automated processes)
CREATE POLICY "System can manage all messages"
  ON employee_messages
  FOR ALL
  USING (
    -- Allow if no user context (system/webhook) or if user is team member
    get_current_clerk_user_id() IS NULL OR
    EXISTS (
      SELECT 1 FROM cs_team_members
      WHERE cs_team_members.clerk_user_id = get_current_clerk_user_id()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_employee_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS update_employee_messages_updated_at ON employee_messages;

-- Create trigger for updated_at
CREATE TRIGGER update_employee_messages_updated_at
  BEFORE UPDATE ON employee_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_employee_messages_updated_at();

-- Comments
COMMENT ON TABLE employee_messages IS 'Unified messaging table for SMS and WhatsApp messages from Sales CRM and CS-Support services';
COMMENT ON COLUMN employee_messages.channel IS 'Message channel: sms or whatsapp';
COMMENT ON COLUMN employee_messages.sender_id IS 'Clerk user ID of sender (NULL for inbound messages)';
COMMENT ON COLUMN employee_messages.recipient_phone IS 'Recipient phone number in E.164 format';
COMMENT ON COLUMN employee_messages.media_urls IS 'Array of media URLs for WhatsApp messages';
COMMENT ON COLUMN employee_messages.message_status IS 'Message delivery status: pending, sent, delivered, read, failed';
COMMENT ON COLUMN employee_messages.read_at IS 'Timestamp when message was read (WhatsApp read receipt)';
COMMENT ON COLUMN employee_messages.lead_id IS 'Associated lead ID from Sales CRM service';
COMMENT ON COLUMN employee_messages.contact_id IS 'Associated contact ID';
COMMENT ON COLUMN employee_messages.ticket_id IS 'Associated support ticket ID (for CS-Support service)';
COMMENT ON COLUMN employee_messages.direction IS 'Message direction: inbound or outbound';
COMMENT ON COLUMN employee_messages.external_message_id IS 'External message ID (Twilio SID, WhatsApp message ID)';
COMMENT ON COLUMN employee_messages.service_type IS 'Service that sent/received message: sales_crm or cs_support';
