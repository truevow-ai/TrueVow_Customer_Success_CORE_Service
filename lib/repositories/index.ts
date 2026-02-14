// Central export for all repositories
export { TicketRepository } from './tickets'
export { KBRepository } from './kb'
export { TeamMemberRepository } from './team-members'
export { CustomerHealthRepository } from './customer-health'
export { IntegrationRepository } from './integrations'
export { CustomerSuccessMetricRepository } from './customer-success-metrics'
export { CustomerChurnRiskRepository } from './customer-churn-risk'

// Export types
export type { KBArticle, KBArticleInsert, KBArticleUpdate, KBCategory } from './kb'
export type { TeamMember, TeamMemberInsert } from './team-members'
export type { CustomerHealthScore, CustomerHealthScoreInsert } from './customer-health'
export type { Integration, IntegrationInsert, IntegrationUpdate } from './integrations'
export type { CustomerSuccessMetric, CustomerSuccessMetricInsert, CustomerSuccessMetricUpdate } from './customer-success-metrics'
export type { CustomerChurnRisk, CustomerChurnRiskInsert, CustomerChurnRiskUpdate } from './customer-churn-risk'

