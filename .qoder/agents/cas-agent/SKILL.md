---
name: cas-agent
description: Customer Automation Specialist agents - 6 deterministic workflow agents (CAS-Onboarding, CAS-Renewal, CAS-Health, CAS-Engagement, CAS-Surveys, CAS-Playbooks).
---

# CAS Agent (Customer Automation Specialist)

## Purpose

I am the family of 6 Customer Automation Specialist (CAS) agents. Each handles a specific deterministic workflow.

**Objective:** Automate repetitive CS tasks so CSMs focus on high-value interactions.

---

## The 6 CAS Agents

| Agent | Focus | JTBD | Target |
|-------|-------|------|--------|
| CAS-Onboarding | Post-onboarding | Execute Day 1,3,7,14,30,60,90 touchpoints | 95% completion |
| CAS-Renewal | Renewal pipeline | Manage renewals 90 days out | 90% success |
| CAS-Health | Health monitoring | Detect and alert on health changes | 80% detection |
| CAS-Engagement | Customer engagement | Trigger engagement campaigns | 25% response |
| CAS-Surveys | Survey automation | Send CSAT/NPS at optimal moments | 40% response |
| CAS-Playbooks | Playbook execution | Execute playbooks based on triggers | 90% completion |

---

## Shared Characteristics

- **Mode:** Deterministic workflow (LLM-free)
- **Autonomy:** LEVEL_1 (full autonomous)
- **Rollout:** full_autonomous
- **Training:** 24-hour review cadence
- **Quadrant:** top_right (high autonomy, high attribution)

---

## Attribution Metrics

| Agent | Primary Metric | Secondary |
|-------|---------------|-----------|
| CAS-Onboarding | onboarding_completion_rate | time_to_first_value |
| CAS-Renewal | renewal_success_rate | early_renewal_signals |
| CAS-Health | early_churn_detection_rate | health_alert_accuracy |
| CAS-Engagement | engagement_response_rate | campaign_open_rate |
| CAS-Surveys | survey_response_rate | nps_score |
| CAS-Playbooks | playbook_completion_rate | playbook_outcome_success |

---

## Integration Points

### Data Sources

- cs_customer_post_onboarding
- cs_onboarding_sequences
- cs_renewal_records
- health_scores (via proxy)
- cs_knowledge_base
- cs_playbook_* tables

### Common Actions

| Action | Service |
|--------|---------|
| Send email | communication-sender.ts |
| Send SMS | unified-dialer-service.ts |
| Create ticket | tickets repository |
| Log activity | activity-feed repository |

---

## Escalation Triggers

| Trigger | Agent | Priority |
|---------|-------|----------|
| Customer unresponsive | CAS-Onboarding | MEDIUM |
| Health score critical | CAS-Health | CRITICAL |
| Renewal at risk | CAS-Renewal | HIGH |
| Survey negative | CAS-Surveys | HIGH |
| Playbook failed | CAS-Playbooks | LOW |

---

## Key Files

- Definitions: `libs/core/agents/agent-definitions.ts`
- Onboarding: `libs/core/services/post-onboarding-flows.ts`
- Renewal: `libs/core/services/renewal-orchestration.ts`
- Health: `libs/core/services/health-scoring.ts`
- Surveys: `libs/core/services/csat-nps-survey.ts`
- Playbooks: `libs/core/services/success-playbooks.ts`

---

**Version:** 1.0 | **Updated:** 2026-03-10
