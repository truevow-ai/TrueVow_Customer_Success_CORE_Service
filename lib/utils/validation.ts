import { z } from 'zod'

export const ticketSchema = z.object({
  tenant_id: z.string().min(1, 'Tenant ID is required').nullable().optional(),
  customer_email: z.string().email('Invalid email format'),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  message: z.string().min(1, 'Message is required').max(5000, 'Message too long'),
  channel: z.enum(['email', 'webchat', 'sms', 'phone', 'web_form']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).default('open'),
  stage: z.enum(['pre-sale', 'post-sale', 'converted']).optional(),
  source: z.enum(['lead', 'customer', 'internal']).default('customer'),
}).refine(
  (data) => {
    // tenant_id is required unless stage is 'pre-sale'
    if (data.stage === 'pre-sale') {
      return true; // tenant_id can be null for pre-sale
    }
    return data.tenant_id !== null && data.tenant_id !== undefined;
  },
  {
    message: 'Tenant ID is required for non-pre-sale tickets',
    path: ['tenant_id'],
  }
)

export const messageSchema = z.object({
  ticket_id: z.string().min(1, 'Ticket ID is required'),
  message: z.string().min(1, 'Message is required').max(5000, 'Message too long'),
  sender_id: z.string().min(1, 'Sender ID is required'),
  sender_type: z.enum(['agent', 'customer', 'system']),
})

export const replySchema = z.object({
  body: z.string().min(1, 'Message body is required').max(5000, 'Message too long'),
  is_internal: z.boolean().optional().default(false),
  attachments: z.array(z.object({
    id: z.string(),
    filename: z.string(),
    url: z.string(),
    size: z.number(),
    type: z.string(),
  })).optional().default([]),
})

export type TicketFormData = z.infer<typeof ticketSchema>
export type MessageFormData = z.infer<typeof messageSchema>

