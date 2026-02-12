/**
 * SendGrid Email Integration
 * Handles email sending and receiving via SendGrid
 */

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || ''
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'support@truevow.com'
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || 'TrueVow Support'

interface SendEmailOptions {
  to: string
  subject: string
  html?: string
  text?: string
  replyTo?: string
  inReplyTo?: string
  references?: string[]
  attachments?: Array<{
    content: string
    filename: string
    type?: string
  }>
}

interface SendGridResponse {
  messageId: string
  status: 'sent' | 'delivered' | 'bounced' | 'failed'
}

export class SendGridClient {
  private apiKey: string
  private fromEmail: string
  private fromName: string

  constructor(
    apiKey: string = SENDGRID_API_KEY,
    fromEmail: string = SENDGRID_FROM_EMAIL,
    fromName: string = SENDGRID_FROM_NAME
  ) {
    this.apiKey = apiKey
    this.fromEmail = fromEmail
    this.fromName = fromName
  }

  /**
   * Send an email via SendGrid
   */
  async sendEmail(options: SendEmailOptions): Promise<SendGridResponse> {
    if (!this.apiKey) {
      throw new Error('SendGrid API key not configured')
    }

    const payload = {
      personalizations: [
        {
          to: [{ email: options.to }],
          subject: options.subject,
        },
      ],
      from: {
        email: this.fromEmail,
        name: this.fromName,
      },
      content: [
        ...(options.html
          ? [{ type: 'text/html', value: options.html }]
          : []),
        ...(options.text
          ? [{ type: 'text/plain', value: options.text }]
          : []),
      ],
      ...(options.replyTo && { reply_to: { email: options.replyTo } }),
      ...(options.inReplyTo && {
        headers: {
          'In-Reply-To': options.inReplyTo,
          ...(options.references && {
            References: options.references.join(' '),
          }),
        },
      }),
      ...(options.attachments && {
        attachments: options.attachments.map((att) => ({
          content: att.content,
          filename: att.filename,
          type: att.type || 'application/octet-stream',
        })),
      }),
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`SendGrid API error: ${response.statusText} - ${error}`)
    }

    // Extract message ID from response headers
    const messageId = response.headers.get('x-message-id') || ''

    return {
      messageId,
      status: 'sent',
    }
  }

  /**
   * Parse incoming email from SendGrid webhook
   */
  parseIncomingEmail(webhookData: any): {
    from: string
    to: string
    subject: string
    text: string
    html: string
    messageId: string
    inReplyTo?: string
    references?: string[]
    attachments?: Array<{
      filename: string
      content: string
      type: string
    }>
  } {
    return {
      from: webhookData.from || webhookData.envelope?.from || '',
      to: webhookData.to || webhookData.envelope?.to || '',
      subject: webhookData.subject || '',
      text: webhookData.text || '',
      html: webhookData.html || '',
      messageId: webhookData.message_id || webhookData['message-id'] || '',
      inReplyTo: webhookData.headers?.['in-reply-to'],
      references: webhookData.headers?.references
        ? webhookData.headers.references.split(' ')
        : undefined,
      attachments: webhookData.attachments?.map((att: any) => ({
        filename: att.filename || att.name,
        content: att.content || att.data,
        type: att.type || att.content_type,
      })),
    }
  }
}

export const sendGridClient = new SendGridClient()

