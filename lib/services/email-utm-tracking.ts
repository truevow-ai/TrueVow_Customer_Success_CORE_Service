/**
 * Email UTM Tracking Service
 * 
 * Adds UTM parameters to all links in HTML emails
 */

export interface UTMOptions {
  source?: string
  medium?: string
  campaign?: string
  term?: string
  content?: string
  leadId?: string
  emailId?: string
  sequenceId?: string
}

export class EmailUTMTrackingService {
  /**
   * Add UTM parameters to a URL
   */
  static addUTMToUrl(url: string, options: UTMOptions = {}): string {
    try {
      const urlObj = new URL(url)
      
      // Don't add UTM to unsubscribe links or internal links
      if (url.includes('/unsubscribe/') || url.includes('mailto:') || urlObj.hostname === new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://truevow.com').hostname) {
        return url
      }

      // Standard UTM parameters
      if (options.source) {
        urlObj.searchParams.set('utm_source', options.source)
      }
      if (options.medium) {
        urlObj.searchParams.set('utm_medium', options.medium || 'email')
      }
      if (options.campaign) {
        urlObj.searchParams.set('utm_campaign', options.campaign)
      }
      if (options.term) {
        urlObj.searchParams.set('utm_term', options.term)
      }
      if (options.content) {
        urlObj.searchParams.set('utm_content', options.content)
      }

      // Custom tracking parameters
      if (options.leadId) {
        urlObj.searchParams.set('lead_id', options.leadId)
      }
      if (options.emailId) {
        urlObj.searchParams.set('email_id', options.emailId)
      }
      if (options.sequenceId) {
        urlObj.searchParams.set('sequence_id', options.sequenceId)
      }

      return urlObj.toString()
    } catch (error) {
      // If URL parsing fails, return original
      console.error('Error adding UTM to URL:', error)
      return url
    }
  }

  /**
   * Add UTM parameters to all links in HTML
   */
  static addUTMToHTML(html: string, options: UTMOptions = {}): string {
    // Match all href attributes in anchor tags
    const hrefRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi

    return html.replace(hrefRegex, (match, url) => {
      const utmUrl = this.addUTMToUrl(url, options)
      return match.replace(url, utmUrl)
    })
  }

  /**
   * Extract UTM parameters from URL
   */
  static extractUTMFromUrl(url: string): UTMOptions {
    try {
      const urlObj = new URL(url)
      const params = urlObj.searchParams

      return {
        source: params.get('utm_source') || undefined,
        medium: params.get('utm_medium') || undefined,
        campaign: params.get('utm_campaign') || undefined,
        term: params.get('utm_term') || undefined,
        content: params.get('utm_content') || undefined,
        leadId: params.get('lead_id') || undefined,
        emailId: params.get('email_id') || undefined,
        sequenceId: params.get('sequence_id') || undefined,
      }
    } catch (error) {
      return {}
    }
  }
}
