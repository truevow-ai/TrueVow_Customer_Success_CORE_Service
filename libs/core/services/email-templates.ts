/**
 * HTML Email Templates
 * 
 * Professional, responsive email templates for various customer success scenarios.
 * All templates are designed to work across email clients and are mobile-responsive.
 */

interface EmailTemplateVariables {
  [key: string]: string | number | boolean | null | undefined
}

/**
 * Base template structure with common elements
 */
const BASE_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{subject}}</title>
    <style>
        /* Reset styles */
        body, table, td, div, p, a, li, blockquote {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }
        
        table, td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        
        img {
            -ms-interpolation-mode: bicubic;
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }
        
        /* Main styles */
        body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #f5f7fa;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        
        .header {
            background-color: #1e40af;
            padding: 30px 20px;
            text-align: center;
        }
        
        .logo {
            color: #ffffff;
            font-size: 24px;
            font-weight: bold;
            text-decoration: none;
        }
        
        .content {
            padding: 30px 20px;
            color: #374151;
            line-height: 1.6;
        }
        
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #1e40af;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
        
        .button-secondary {
            background-color: #6b7280;
        }
        
        .footer {
            background-color: #f3f4f6;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
        
        .card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            background-color: #f9fafb;
        }
        
        .alert {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 0 4px 4px 0;
        }
        
        .success {
            background-color: #dcfce7;
            border-left: 4px solid #22c55e;
        }
        
        .warning {
            background-color: #ffedd5;
            border-left: 4px solid #f97316;
        }
        
        .divider {
            border-top: 1px solid #e5e7eb;
            margin: 30px 0;
        }
        
        /* Responsive adjustments */
        @media screen and (max-width: 600px) {
            .container {
                width: 100% !important;
            }
            
            .content {
                padding: 20px 15px;
            }
            
            .button {
                display: block;
                text-align: center;
                margin: 10px 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <a href="{{company_website}}" class="logo">{{company_name}}</a>
        </div>
        
        <!-- Content -->
        <div class="content">
            {{content}}
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p>{{company_name}} • {{company_address}}</p>
            <p>This email was sent to {{recipient_email}}</p>
            {{unsubscribe_link}}
        </div>
    </div>
</body>
</html>
`

/**
 * Welcome Email Template - Sent to new customers after onboarding
 */
export function welcomeEmail(variables: EmailTemplateVariables): string {
  const content = `
    <h1 style="color: #1e40af; margin-bottom: 20px;">Welcome to {{company_name}}!</h1>
    
    <p>Hi {{customer_first_name}},</p>
    
    <p>Welcome aboard! We're excited to have {{law_firm_name}} as part of our community. Your account is now fully set up and ready to use.</p>
    
    <div class="card">
        <h2 style="margin-top: 0; color: #1f2937;">Getting Started</h2>
        <p>Here are some helpful resources to get you started:</p>
        <ul>
            <li><strong>User Guide:</strong> <a href="{{user_guide_url}}" style="color: #1e40af;">Download our comprehensive user guide</a></li>
            <li><strong>Video Tutorials:</strong> <a href="{{video_tutorials_url}}" style="color: #1e40af;">Watch our getting started videos</a></li>
            <li><strong>Support Portal:</strong> <a href="{{support_portal_url}}" style="color: #1e40af;">Visit our support center</a></li>
        </ul>
    </div>
    
    <div class="alert success">
        <strong>Your Account Details:</strong><br>
        <strong>Login:</strong> {{login_url}}<br>
        <strong>Username:</strong> {{username}}<br>
        <strong>Go-Live Date:</strong> {{go_live_date}}
    </div>
    
    <p>If you have any questions or need assistance, don't hesitate to reach out to our support team.</p>
    
    <a href="{{support_contact_url}}" class="button">Contact Support</a>
    
    <div class="divider"></div>
    
    <p>We're here to help you succeed!</p>
    <p>Best regards,<br>The {{company_name}} Team</p>
  `
  
  return renderTemplate(BASE_TEMPLATE, {
    ...variables,
    content
  })
}

/**
 * Onboarding Reminder Template - Sent when onboarding milestones are approaching
 */
export function onboardingReminder(variables: EmailTemplateVariables): string {
  const content = `
    <h1 style="color: #1e40af; margin-bottom: 20px;">Onboarding Update Required</h1>
    
    <p>Hi {{customer_first_name}},</p>
    
    <p>We noticed that there are some pending items in your onboarding process that need your attention.</p>
    
    <div class="alert warning">
        <strong>Action Required:</strong> {{pending_action_description}}
    </div>
    
    <div class="card">
        <h2 style="margin-top: 0; color: #1f2937;">Next Steps</h2>
        <ol>
            {{#each next_steps}}
            <li>{{this}}</li>
            {{/each}}
        </ol>
    </div>
    
    <p>Please complete these items by <strong>{{due_date}}</strong> to keep your onboarding on track.</p>
    
    <a href="{{onboarding_portal_url}}" class="button">Complete Onboarding Steps</a>
    
    <div class="divider"></div>
    
    <p>Need help? Our onboarding specialist {{onboarding_specialist_name}} is available to assist you.</p>
    <p>Email: {{onboarding_specialist_email}} | Phone: {{onboarding_specialist_phone}}</p>
  `
  
  return renderTemplate(BASE_TEMPLATE, {
    ...variables,
    content
  })
}

/**
 * Health Score Alert Template - Sent when customer health score drops
 */
export function healthScoreAlert(variables: EmailTemplateVariables): string {
  const content = `
    <h1 style="color: #1e40af; margin-bottom: 20px;">Account Health Update</h1>
    
    <p>Hi {{customer_first_name}},</p>
    
    <p>We wanted to check in regarding your account health. We've noticed some areas that could use attention to help you get the most from our platform.</p>
    
    <div class="card">
        <h2 style="margin-top: 0; color: #1f2937;">Current Health Status</h2>
        <p><strong>Health Score:</strong> {{health_score}}/100</p>
        <p><strong>Status:</strong> {{health_status}}</p>
        <p><strong>Last Updated:</strong> {{last_updated}}</p>
    </div>
    
    <div class="alert">
        <strong>Areas for Improvement:</strong>
        <ul>
            {{#each improvement_areas}}
            <li>{{this}}</li>
            {{/each}}
        </ul>
    </div>
    
    <p>We're here to help you improve your experience and achieve better results. Would you like to schedule a call to discuss how we can help?</p>
    
    <a href="{{schedule_call_url}}" class="button">Schedule a Call</a>
    <a href="{{support_portal_url}}" class="button button-secondary">View Recommendations</a>
    
    <div class="divider"></div>
    
    <p>Our goal is your success. Let's work together to improve your experience.</p>
  `
  
  return renderTemplate(BASE_TEMPLATE, {
    ...variables,
    content
  })
}

/**
 * Training Invitation Template - Sent for upcoming training sessions
 */
export function trainingInvitation(variables: EmailTemplateVariables): string {
  const content = `
    <h1 style="color: #1e40af; margin-bottom: 20px;">Training Session Invitation</h1>
    
    <p>Hi {{customer_first_name}},</p>
    
    <p>You're invited to join our upcoming training session on <strong>{{training_topic}}</strong>.</p>
    
    <div class="card">
        <h2 style="margin-top: 0; color: #1f2937;">Session Details</h2>
        <p><strong>Date:</strong> {{session_date}}</p>
        <p><strong>Time:</strong> {{session_time}} ({{timezone}})</p>
        <p><strong>Duration:</strong> {{duration}} hours</p>
        <p><strong>Format:</strong> {{format}}</p>
        {{#if meeting_link}}
        <p><strong>Meeting Link:</strong> <a href="{{meeting_link}}" style="color: #1e40af;">Join Session</a></p>
        {{/if}}
    </div>
    
    <div class="alert success">
        <strong>What You'll Learn:</strong>
        <ul>
            {{#each learning_objectives}}
            <li>{{this}}</li>
            {{/each}}
        </ul>
    </div>
    
    <p>This training will help you {{benefit_description}}.</p>
    
    <a href="{{register_url}}" class="button">Register Now</a>
    {{#if materials_url}}
    <a href="{{materials_url}}" class="button button-secondary">Download Materials</a>
    {{/if}}
    
    <div class="divider"></div>
    
    <p>Questions? Contact {{trainer_name}} at {{trainer_email}}</p>
  `
  
  return renderTemplate(BASE_TEMPLATE, {
    ...variables,
    content
  })
}

/**
 * Escalation Notification Template - Sent when tickets are escalated
 */
export function escalationNotification(variables: EmailTemplateVariables): string {
  const content = `
    <h1 style="color: #1e40af; margin-bottom: 20px;">Ticket Escalated - {{ticket_subject}}</h1>
    
    <p>Hi {{customer_first_name}},</p>
    
    <p>We're writing to inform you that your support ticket has been escalated to our Customer Success team for immediate attention.</p>
    
    <div class="card">
        <h2 style="margin-top: 0; color: #1f2937;">Ticket Details</h2>
        <p><strong>Ticket ID:</strong> {{ticket_id}}</p>
        <p><strong>Subject:</strong> {{ticket_subject}}</p>
        <p><strong>Priority:</strong> {{priority}}</p>
        <p><strong>Submitted:</strong> {{submitted_date}}</p>
    </div>
    
    <div class="alert">
        <strong>What This Means:</strong>
        <p>Your issue has been prioritized and assigned to {{assigned_csm_name}}, our Customer Success Manager, who will work directly with you to resolve this matter.</p>
    </div>
    
    <p>{{assigned_csm_name}} will reach out to you within {{response_timeframe}} to discuss next steps and provide a resolution timeline.</p>
    
    <a href="{{ticket_url}}" class="button">View Ticket Details</a>
    
    <div class="divider"></div>
    
    <p>We apologize for any inconvenience and appreciate your patience as we work to resolve this issue.</p>
    <p>Best regards,<br>{{assigned_csm_name}}<br>Customer Success Manager</p>
  `
  
  return renderTemplate(BASE_TEMPLATE, {
    ...variables,
    content
  })
}

/**
 * Renewal Reminder Template - Sent before subscription renewal
 */
export function renewalReminder(variables: EmailTemplateVariables): string {
  const content = `
    <h1 style="color: #1e40af; margin-bottom: 20px;">Subscription Renewal Reminder</h1>
    
    <p>Hi {{customer_first_name}},</p>
    
    <p>This is a friendly reminder that your {{company_name}} subscription is coming up for renewal.</p>
    
    <div class="card">
        <h2 style="margin-top: 0; color: #1f2937;">Renewal Details</h2>
        <p><strong>Current Plan:</strong> {{current_plan}}</p>
        <p><strong>Renewal Date:</strong> {{renewal_date}}</p>
        <p><strong>Amount:</strong> {{amount}}</p>
        <p><strong>Billing Cycle:</strong> {{billing_cycle}}</p>
    </div>
    
    <div class="alert success">
        <strong>What's Included:</strong>
        <ul>
            {{#each plan_features}}
            <li>{{this}}</li>
            {{/each}}
        </ul>
    </div>
    
    <p>No action is needed if you wish to continue with your current plan. Your subscription will automatically renew on {{renewal_date}}.</p>
    
    <a href="{{manage_subscription_url}}" class="button">Manage Subscription</a>
    <a href="{{cancel_url}}" class="button button-secondary">Questions or Changes</a>
    
    <div class="divider"></div>
    
    <p>Thank you for being a valued {{company_name}} customer!</p>
  `
  
  return renderTemplate(BASE_TEMPLATE, {
    ...variables,
    content
  })
}

/**
 * Template renderer with variable substitution
 */
function renderTemplate(template: string, variables: EmailTemplateVariables): string {
  let result = template
  
  // Handle simple variable substitution {{variable_name}}
  Object.keys(variables).forEach(key => {
    const value = variables[key]
    if (value !== undefined && value !== null) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
    }
  })
  
  // Handle conditional blocks {{#if condition}}...{{/if}}
  result = result.replace(/{{#if (.*?)}}([\s\S]*?){{\/if}}/g, (match, condition, content) => {
    const value = variables[condition]
    return value ? content : ''
  })
  
  // Handle loops {{#each array}}...{{/each}}
  result = result.replace(/{{#each (.*?)}}([\s\S]*?){{\/each}}/g, (match, arrayName, content) => {
    const array = variables[arrayName]
    if (Array.isArray(array)) {
      return array.map(item => {
        let itemContent = content
        // Replace {{this}} with current item
        itemContent = itemContent.replace(/{{this}}/g, String(item))
        // Replace {{@index}} with current index
        itemContent = itemContent.replace(/{{@index}}/g, String(array.indexOf(item)))
        return itemContent
      }).join('')
    }
    return ''
  })
  
  return result
}

/**
 * Export all templates for easy access
 */
export const EmailTemplates = {
  welcome: welcomeEmail,
  onboardingReminder: onboardingReminder,
  healthScoreAlert: healthScoreAlert,
  trainingInvitation: trainingInvitation,
  escalationNotification: escalationNotification,
  renewalReminder: renewalReminder
}