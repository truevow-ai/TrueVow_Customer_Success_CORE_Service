/**
 * Email Compliance Footer Service
 * 
 * Auto-appends CAN-SPAM/GDPR compliant footers to all emails
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://truevow.com'
const COMPANY_NAME = process.env.COMPANY_NAME || 'TrueVow'
const COMPANY_ADDRESS = process.env.COMPANY_ADDRESS || 'TrueVow, Inc.'

export interface ComplianceFooterOptions {
  unsubscribeToken?: string
  jurisdiction?: 'US' | 'EU' | 'CA' | 'UK' | 'AU' | 'GLOBAL'
  includeCompanyInfo?: boolean
}

export class EmailComplianceFooterService {
  /**
   * Generate unsubscribe URL
   */
  static generateUnsubscribeUrl(token: string): string {
    return `${APP_URL}/unsubscribe/${token}`
  }

  /**
   * Generate compliance footer for HTML emails
   */
  static generateHTMLFooter(options: ComplianceFooterOptions = {}): string {
    const {
      unsubscribeToken,
      jurisdiction = 'GLOBAL',
      includeCompanyInfo = true,
    } = options

    let footer = '<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; line-height: 1.6;">'

    // Unsubscribe link
    if (unsubscribeToken) {
      const unsubscribeUrl = this.generateUnsubscribeUrl(unsubscribeToken)
      footer += `<p style="margin: 0 0 10px 0;">
        <a href="${unsubscribeUrl}" style="color: #0066cc; text-decoration: underline;">Unsubscribe from these emails</a>
      </p>`
    }

    // Jurisdiction-specific disclaimers
    footer += this.getJurisdictionDisclaimer(jurisdiction)

    // Company info
    if (includeCompanyInfo) {
      footer += `<p style="margin: 10px 0 0 0; color: #999;">
        © ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.<br>
        ${COMPANY_ADDRESS}
      </p>`
    }

    footer += '</div>'

    return footer
  }

  /**
   * Generate compliance footer for plain text emails
   */
  static generateTextFooter(options: ComplianceFooterOptions = {}): string {
    const {
      unsubscribeToken,
      jurisdiction = 'GLOBAL',
      includeCompanyInfo = true,
    } = options

    let footer = '\n\n---\n\n'

    // Unsubscribe link
    if (unsubscribeToken) {
      const unsubscribeUrl = this.generateUnsubscribeUrl(unsubscribeToken)
      footer += `Unsubscribe: ${unsubscribeUrl}\n\n`
    }

    // Jurisdiction-specific disclaimers
    footer += this.getJurisdictionDisclaimerText(jurisdiction)

    // Company info
    if (includeCompanyInfo) {
      footer += `\n© ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.\n${COMPANY_ADDRESS}`
    }

    return footer
  }

  /**
   * Get jurisdiction-specific disclaimer (HTML)
   */
  private static getJurisdictionDisclaimer(jurisdiction: string): string {
    const disclaimers: Record<string, string> = {
      US: `
        <p style="margin: 10px 0; color: #666;">
          This email was sent to you because you are a customer or have expressed interest in ${COMPANY_NAME} services.
          You can unsubscribe at any time using the link above.
        </p>
      `,
      EU: `
        <p style="margin: 10px 0; color: #666;">
          This email is sent in accordance with GDPR. You have the right to unsubscribe and request deletion of your data.
          For more information, please contact us or use the unsubscribe link above.
        </p>
      `,
      CA: `
        <p style="margin: 10px 0; color: #666;">
          This email is sent in compliance with CASL (Canada's Anti-Spam Legislation). You can unsubscribe at any time.
        </p>
      `,
      UK: `
        <p style="margin: 10px 0; color: #666;">
          This email is sent in accordance with UK GDPR and PECR. You can unsubscribe at any time.
        </p>
      `,
      AU: `
        <p style="margin: 10px 0; color: #666;">
          This email is sent in compliance with the Spam Act 2003 (Australia). You can unsubscribe at any time.
        </p>
      `,
      GLOBAL: `
        <p style="margin: 10px 0; color: #666;">
          This email is sent in compliance with applicable email marketing laws. You can unsubscribe at any time.
        </p>
      `,
    }

    return disclaimers[jurisdiction] || disclaimers.GLOBAL
  }

  /**
   * Get jurisdiction-specific disclaimer (plain text)
   */
  private static getJurisdictionDisclaimerText(jurisdiction: string): string {
    const disclaimers: Record<string, string> = {
      US: `This email was sent to you because you are a customer or have expressed interest in ${COMPANY_NAME} services. You can unsubscribe at any time.\n\n`,
      EU: `This email is sent in accordance with GDPR. You have the right to unsubscribe and request deletion of your data. For more information, please contact us.\n\n`,
      CA: `This email is sent in compliance with CASL (Canada's Anti-Spam Legislation). You can unsubscribe at any time.\n\n`,
      UK: `This email is sent in accordance with UK GDPR and PECR. You can unsubscribe at any time.\n\n`,
      AU: `This email is sent in compliance with the Spam Act 2003 (Australia). You can unsubscribe at any time.\n\n`,
      GLOBAL: `This email is sent in compliance with applicable email marketing laws. You can unsubscribe at any time.\n\n`,
    }

    return disclaimers[jurisdiction] || disclaimers.GLOBAL
  }

  /**
   * Append footer to HTML email
   */
  static appendToHTML(html: string, options: ComplianceFooterOptions = {}): string {
    // Check if footer already exists
    if (html.includes('Unsubscribe from these emails') || html.includes('unsubscribe')) {
      return html
    }

    const footer = this.generateHTMLFooter(options)
    return html + footer
  }

  /**
   * Append footer to plain text email
   */
  static appendToText(text: string, options: ComplianceFooterOptions = {}): string {
    // Check if footer already exists
    if (text.includes('Unsubscribe:') || text.includes('unsubscribe')) {
      return text
    }

    const footer = this.generateTextFooter(options)
    return text + footer
  }
}
