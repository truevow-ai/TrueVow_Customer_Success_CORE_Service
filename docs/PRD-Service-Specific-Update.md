# CS-Support Service PRD - TrueVow Service-Specific Update Summary

**Date:** January 8, 2026  
**Version:** 2.0 (Service-Specific Customer Journey & JTBD Framework)  
**Status:** ✅ Complete

---

## 📋 **EXECUTIVE SUMMARY**

Updated the CS-Support Service PRD and Implementation Plan to align with TrueVow's service structure and rollout timeline, similar to the Sales CRM Service updates. The customer journey and JTBD framework now map to TrueVow's actual services (INTAKE, DRAFT, VERIFY, SETTLE, CONNECT) and reflect the service adoption progression.

---

## 🔄 **UPDATES MADE**

### **1. TrueVow Service Structure & Rollout Timeline**

Added service-specific information throughout the PRD:

- **INTAKE (Benjamin):** Primary service, available now
- **SETTLE:** Coming Q3 2026
- **DRAFT:** Coming Q4 2026
- **CONNECT:** Coming Q1 2027
- **VERIFY:** Integrated with INTAKE (enhanced with DRAFT)

### **2. Customer Journey Stages**

Updated customer journey to align with TrueVow's services:

**PRE-SALE STAGES:**
1. **Awareness** → "Help me understand if I have a problem"
2. **Consideration** → "Help me evaluate if TrueVow's services solve my problems" (Focus on INTAKE as primary service)
3. **Decision** → "Help me make the right decision to purchase"
4. **Onboarding** → "Help me get started quickly (6-hour SLA)" (INTAKE configuration: phone forwarding, calendar, practice-specific scripts)

**POST-SALE SERVICE STAGES:**
5. **INTAKE** → "Help me capture and process client intake efficiently" (Available Now)
6. **SETTLE** → "Help me manage settlement processes efficiently" (Coming Q3 2026)
7. **DRAFT** → "Help me draft legal documents quickly and accurately" (Coming Q4 2026)
8. **VERIFY** → "Help me verify information and documents accurately" (Integrated with INTAKE)
9. **CONNECT** → "Help me maintain strong client relationships" (Coming Q1 2027)

**GROWTH STAGES:**
10. **Retention & Expansion** → "Help me succeed and expand service usage"

### **3. Service Adoption Funnel**

Added service adoption progression:

```
Entry Point: INTAKE (Benjamin) - Primary Service (Available Now)
    ↓
Early Adopters: INTAKE + SETTLE (Q3 2026)
    ↓
Power Users: INTAKE + SETTLE + DRAFT (Q4 2026)
    ↓
Complete Suite: INTAKE + SETTLE + DRAFT + VERIFY + CONNECT (Q1 2027)
    ↓
Founding Members: All services + Community contribution + Exclusive pricing
```

### **4. JTBD Framework Updates**

#### **4.1 JTBD Structure Enhanced**

Added service-specific fields to JTBD structure:
- **Service Stage:** Pre-sale, Post-sale, Retention
- **TrueVow Service:** INTAKE, DRAFT, VERIFY, SETTLE, CONNECT, ALL
- **Role Responsibilities:** Mapping of roles to responsibilities per service
- **Service Status:** Available Now / Coming Q3 2026 / Coming Q4 2026 / Coming Q1 2027

#### **4.2 Service-Specific JTBD Examples**

Created detailed JTBD examples for each service:

**Customer Support Digital Agent - INTAKE Service JTBD:**
- Primary issues: Phone forwarding, calendar integration, practice-specific scripts, Benjamin FSM configuration
- Support agents: Customer Support Digital Agent (first contact), Solutions Engineer Digital Agent (technical)
- Knowledge base: INTAKE configuration guides, practice-specific setup (PI, Family Law, Immigration), Benjamin troubleshooting
- RevOps attribution: 1 point per ticket resolved (10% indirect credit if customer retained)

**Customer Support Digital Agent - SETTLE Service JTBD:**
- Primary issues: Settlement tracking, negotiation workflows, data synchronization, Founding Member data contribution
- Service status: Coming Q3 2026 - Support agents prepared but service not yet available
- RevOps attribution: 1 point per ticket resolved (10% indirect credit if customer retained)

**Customer Success Digital Agent - Service Adoption JTBD:**
- Service adoption funnel: INTAKE → SETTLE → DRAFT → CONNECT
- Monitor service usage and adoption
- Identify expansion opportunities
- Guide customers through service adoption progression
- RevOps attribution: Upsell closed (20 points, 100% direct credit), Customer retained (15 points, 100% direct credit), Service adoption (10 points, 10% indirect credit)

**Solutions Engineer Digital Agent - Service Integration JTBD:**
- Help customers integrate and configure all TrueVow services
- Troubleshoot technical issues across all services
- Optimize service performance
- RevOps attribution: 2 points per issue resolved (10% indirect credit)

### **5. Database Schema Updates**

#### **5.1 Support Tickets Table**

Added service-specific fields:
```sql
-- Service-Specific Fields
truevow_service VARCHAR(50) CHECK (truevow_service IN ('INTAKE', 'DRAFT', 'VERIFY', 'SETTLE', 'CONNECT', 'ALL', NULL)),
service_stage VARCHAR(50) CHECK (service_stage IN ('Pre-sale', 'Post-sale', 'Retention', NULL)),
service_adoption_status VARCHAR(50) CHECK (service_adoption_status IN (
    'intake_only', 'intake_settle', 'intake_settle_draft', 'complete_suite', 'founding_member', NULL
)),
practice_area VARCHAR(100), -- PI, Family Law, Immigration, etc.
```

Added indexes:
```sql
CREATE INDEX idx_support_tickets_service ON support_tickets(truevow_service);
CREATE INDEX idx_support_tickets_service_stage ON support_tickets(service_stage);
CREATE INDEX idx_support_tickets_adoption_status ON support_tickets(service_adoption_status);
CREATE INDEX idx_support_tickets_practice_area ON support_tickets(practice_area);
```

#### **5.2 Support LLM Agents Table**

Added service-specific fields:
```sql
-- Service-Specific Fields
service_stage VARCHAR(50) CHECK (service_stage IN ('Pre-sale', 'Post-sale', 'Retention', NULL)),
truevow_service VARCHAR(50) CHECK (truevow_service IN ('INTAKE', 'DRAFT', 'VERIFY', 'SETTLE', 'CONNECT', 'ALL', NULL)),
role_responsibilities JSONB, -- Mapping of roles to responsibilities per service
```

Updated `brief_config` comment to include service-specific fields:
```sql
brief_config JSONB NOT NULL, -- Role, JTBD, context, guardrails, steps, outcomes, service_stage, truevow_service
```

Added indexes:
```sql
CREATE INDEX idx_support_llm_agents_service ON support_llm_agents(truevow_service);
CREATE INDEX idx_support_llm_agents_service_stage ON support_llm_agents(service_stage);
```

### **6. Service-Specific Support Mapping**

Added detailed support mapping for each service:

**INTAKE Service Support (Available Now):**
- Primary issues: Phone forwarding, calendar integration, practice-specific scripts, Benjamin FSM configuration, intake call quality
- Practice areas: Personal Injury (PI), Family Law, Immigration, etc.

**SETTLE Service Support (Coming Q3 2026):**
- Primary issues: Settlement tracking, negotiation workflows, data synchronization, Founding Member data contribution
- Service status: Coming Q3 2026 - Support agents prepared but service not yet available

**DRAFT Service Support (Coming Q4 2026):**
- Primary issues: Document template configuration, practice-specific templates, automated generation, VERIFY integration
- Service status: Coming Q4 2026 - Support agents prepared but service not yet available

**VERIFY Service Support:**
- Primary issues: Information verification, document verification, integration with INTAKE and DRAFT
- Integration: VERIFY integrated with INTAKE, enhanced when DRAFT launches (Q4 2026)

**CONNECT Service Support (Coming Q1 2027):**
- Primary issues: Multi-channel client communication, relationship management, communication workflows
- Service status: Coming Q1 2027 - Support agents prepared but service not yet available

### **7. Customer Journey & Service Stage Mapping**

Added detailed mapping of customer journey stages to service support:

**Pre-Sale Stages:**
- **Awareness:** General TrueVow information, INTAKE service overview
- **Consideration:** INTAKE (Benjamin) as primary service, future services (SETTLE, DRAFT, CONNECT) mentioned
- **Decision:** INTAKE-focused onboarding, 6-hour SLA emphasis
- **Onboarding:** INTAKE configuration (phone forwarding, calendar, practice-specific scripts)

**Post-Sale Service Stages:**
- **INTAKE Stage:** Support for INTAKE service issues, Benjamin configuration, practice-specific setup
- **SETTLE Stage (Q3 2026):** Support for SETTLE service issues, settlement tracking, negotiation workflows
- **DRAFT Stage (Q4 2026):** Support for DRAFT service issues, template configuration, document generation
- **VERIFY Stage:** Support for VERIFY service issues, verification workflows, INTAKE/DRAFT integration
- **CONNECT Stage (Q1 2027):** Support for CONNECT service issues, multi-channel communication, relationship management

**Retention & Expansion Stage:**
- **Service Adoption:** Guide customers through service adoption funnel (INTAKE → SETTLE → DRAFT → CONNECT)
- **Expansion Opportunities:** Identify customers ready for next service
- **Health Monitoring:** Monitor customer health across all services
- **Retention:** Proactive outreach for at-risk customers

---

## 📝 **IMPLEMENTATION PLAN UPDATES**

### **Phase 7: AI Digital Agents Module - JTBD Framework Implementation**

Added new section for JTBD Framework Implementation:

**Day 1-2: Jobs-to-Be-Done (JTBD) Framework Implementation**

**Tasks:**
1. **Create JTBD Framework Structure**
   - `lib/ai/jtbd-framework.ts`
   - JTBD data model (role, jtbd, service_stage, truevow_service, context, guardrails, steps, outcomes)
   - Service-specific JTBD mapping (INTAKE, DRAFT, VERIFY, SETTLE, CONNECT)
   - Customer journey stage mapping (Pre-sale, Post-sale, Retention)

2. **Implement Service-Specific JTBD Definitions**
   - INTAKE service JTBD (Available Now)
   - SETTLE service JTBD (Coming Q3 2026)
   - DRAFT service JTBD (Coming Q4 2026)
   - VERIFY service JTBD (Integrated with INTAKE)
   - CONNECT service JTBD (Coming Q1 2027)
   - Service adoption funnel JTBD (INTAKE → SETTLE → DRAFT → CONNECT)

3. **Create JTBD Database Schema**
   - Update `support_llm_agents` table with service-specific fields
   - Update `support_tickets` table with service-specific fields

4. **Create JTBD API Routes**
   - `GET /api/v1/jtbd/definitions` - List all JTBD definitions
   - `GET /api/v1/jtbd/definitions/:service` - Get JTBD for specific service
   - `GET /api/v1/jtbd/customer-journey` - Get customer journey stages
   - `POST /api/v1/jtbd/validate` - Validate JTBD structure

5. **Implement JTBD Integration with Agent Briefs**
   - Store JTBD in `brief_config` JSONB column
   - Generate system prompts from JTBD
   - Map JTBD to agent performance metrics
   - Update agent briefs with service-specific JTBD

**Deliverables:**
- [ ] JTBD framework structure created
- [ ] Service-specific JTBD definitions implemented
- [ ] Database schema updated with service fields
- [ ] JTBD API routes created
- [ ] JTBD integrated with agent briefs
- [ ] Commit made

---

## ✅ **VALIDATION CHECKLIST**

- [x] Customer journey updated to align with TrueVow services
- [x] JTBD framework enhanced with service-specific fields
- [x] Database schema updated with service fields
- [x] Service-specific JTBD examples created
- [x] Service adoption funnel defined
- [x] Service-specific support mapping added
- [x] Customer journey & service stage mapping added
- [x] Implementation plan updated with JTBD framework implementation tasks
- [x] All service statuses and rollout timelines included
- [x] Practice area support (PI, Family Law, Immigration) included

---

## 📊 **KEY CHANGES SUMMARY**

### **PRD Updates:**
1. ✅ Section 8.9.3: JTBD Framework - Enhanced with service-specific structure
2. ✅ Database Schema: Added service-specific fields to `support_tickets` and `support_llm_agents` tables
3. ✅ Service-Specific Support Mapping: Added detailed mapping for each service
4. ✅ Customer Journey & Service Stage Mapping: Added comprehensive mapping

### **Implementation Plan Updates:**
1. ✅ Phase 7: Added JTBD Framework Implementation section
2. ✅ Service-specific JTBD definitions implementation tasks
3. ✅ Database schema update tasks
4. ✅ JTBD API routes implementation tasks

---

## 🎯 **NEXT STEPS**

1. **Review Updated Documents:**
   - Review `CS_SUPPORT_SERVICE_PRD.md` for service-specific updates
   - Review `CS_SUPPORT_SERVICE_IMPLEMENTATION_PLAN.md` for JTBD framework implementation tasks

2. **Implementation:**
   - Begin Phase 7: AI Digital Agents Module
   - Implement JTBD Framework (Day 1-2)
   - Create service-specific JTBD definitions
   - Update database schema with service fields

3. **Testing:**
   - Test service-specific JTBD definitions
   - Test customer journey stage mapping
   - Test service adoption funnel tracking
   - Test RevOps attribution per service

---

**Status:** ✅ **All Updates Complete**  
**Last Updated:** January 8, 2026  
**Version:** 2.0 (Service-Specific Customer Journey & JTBD Framework)
