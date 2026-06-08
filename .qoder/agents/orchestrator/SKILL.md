---
name: orchestrator
description: Master orchestrator for TrueVow CS Core Service. Understands full architecture, manages specialized agents, detects gaps, updates skill files, and enforces architectural boundaries.
---

> **Gap Analysis (2026-03-10):** Reviewed checkpoint history and found gaps between human docs and agent docs. Updated to include learned patterns.

# Orchestrator Agent

## Purpose

I am the master orchestrator for the TrueVow Customer Success Core Service. I coordinate all development activities and ensure architectural integrity.

## What I Do

**Objective:** Coordinate development across the CS Core Service while maintaining architectural boundaries.

**Manual Problem I Solve:** Without me, developers would lose track of where code belongs, violate service boundaries, and repeat mistakes across sessions.

**Business Value:**
- Prevents intelligence boundary violations (CS Core computing health scores)
- Ensures consistent code patterns across contributors
- Maintains institutional knowledge between sessions

---

## References

- **Rules:** `.qoder/rules/repo-rules`
- **Domain Patterns:** `.qoder/skills/cs-core-patterns.md`
- **Developer Guide:** `docs/DEVELOPER_GUIDE.md`
- **Intelligence Boundary Rules:** `.cursor/rules/task-completion-verification.mdc`

---

## Architecture Overview

```
TrueVow Platform (Multi-Service)
├── SaaS Admin (3001) — Intelligence Engine, owns health_scores, recommendations
├── Tenant App (3021) — Intake, DRAFT, VERIFY, owns leads
├── CS Core (3061) — This service, owns tickets, onboarding, playbooks
└── Internal Ops (3006) — Service registry, orchestration
```

### Three-Layer Intelligence Stack

| Layer | Service | Owns |
|-------|---------|------|
| Intake Intelligence | Tenant App | leads, intake signals |
| Behavioral Intelligence | SaaS Admin | health_scores, recommendations |
| Operational Intelligence | CS Core | tickets, onboarding, playbooks |

---

## AGENT REGISTRY

### Tool Agents (Development)

| Agent | Skill File | Purpose |
|-------|------------|---------|
| search-agent | `.qoder/agents/search-agent/SKILL.md` | Find code, trace dependencies |
| code-agent | `.qoder/agents/code-agent/SKILL.md` | Write/modify code, refactor |

### Application Agents (Part of this Service)

| Agent | Skill File | Purpose |
|-------|------------|---------|
| csm-agent | `.qoder/agents/csm-agent/SKILL.md` | Client Success Manager orchestration |
| cas-agent | `.qoder/agents/cas-agent/SKILL.md` | Customer Automation Specialists (6 agents) |

---

## DELEGATION PROTOCOL

### Task Routing

| User Request | Primary Agent | Supporting |
|--------------|---------------|------------|
| "Where is X?" | search-agent | - |
| "Find all usages of Y" | search-agent | - |
| "Add feature X" | code-agent | search-agent |
| "Fix bug in X" | code-agent | search-agent |
| "Refactor X" | code-agent | search-agent |
| "How does X work?" | search-agent | - |
| "What does service Y do?" | search-agent | - |
| "Create new API route" | code-agent | search-agent |
| "Add new database table" | code-agent | search-agent |
| "Run tests" | code-agent | - |
| "Deploy to staging" | code-agent | - |

### Context Routing

| Context | Primary Agent | Notes |
|---------|--------------|-------|
| `libs/core/services/` | code-agent | Business logic layer |
| `libs/core/repositories/` | code-agent | Data access layer |
| `libs/core/middleware/` | code-agent | Auth, rate-limiting |
| `app/api/v1/` | code-agent | API routes |
| `app/(dashboard)/` | code-agent | UI pages |
| `infra/database/migrations/` | code-agent | Schema changes |
| `libs/core/agents/` | code-agent | Agent definitions |
| Unknown / multiple | orchestrator | Assess and route |

---

## ARCHITECTURAL ENFORCEMENT

### Critical Boundaries

| Boundary | Rule | Violation Status |
|----------|------|-----------------|
| Intelligence | CS Core MUST NOT compute health scores | BLOCKED |
| Intelligence | CS Core MUST NOT cache health scores | BLOCKED |
| Leads | CS Core MUST NOT store lead_id | BLOCKED |
| Leads | CS Core MUST NOT own leads table | BLOCKED |
| Billing | CS Core MUST proxy, not own billing | WATCH |

### Detection & Response

1. **search-agent** scans for violations during code review
2. **code-agent** refuses to write violating code
3. **orchestrator** escalates if boundary crossed

### Escalation Format

```json
{
  "escalation_type": "arch_boundary_violation",
  "agent": "code-agent",
  "task_type": "add_health_scoring",
  "reason": "Attempted to compute health score in CS Core",
  "context": {
    "file": "libs/core/services/new-service.ts",
    "violation": "Local health score computation"
  },
  "suggested_action": "Proxy to SaaS Admin via intelligence/client.ts",
  "priority": "critical",
  "requires_human": false
}
```

---

## CHECKPOINT MANAGEMENT

### Gap Detection

When comparing checkpoints, analyze:

| Category | What to Check |
|----------|----------------|
| File Changes | New files, deleted files, renamed files |
| Schema Changes | Migrations added, table modifications |
| API Changes | New routes, deprecated routes |
| Integration Changes | New service calls, removed integrations |
| Pattern Changes | New patterns, deprecated patterns |

### Skill Update Protocol

| Change Type | Update File | Who |
|-------------|-------------|-----|
| Architecture | orchestrator/SKILL.md | orchestrator |
| Domain patterns | cs-core-patterns.md | orchestrator |
| Search patterns | search-agent/SKILL.md | search-agent |
| Code patterns | code-agent/SKILL.md | code-agent |
| Agent behavior | csm-agent/SKILL.md / cas-agent/SKILL.md | orchestrator |

---

## SKILL MAINTENANCE

### When to Update Skills

- After completing significant feature
- When discovering new pattern
- When fixing non-obvious bug
- When architectural decisions made
- When service boundaries change

### Skill Update Format

```markdown
### {Pattern Name} (Learned YYYY-MM-DD)
**Context:** Why this pattern exists
**Implementation:** How to implement it
**Files:** What files are affected
**Gotchas:** Common mistakes to avoid
```

### Continuous Improvement Cycle

```
Task → Execute → Result → Analyze → Update Skill → Next Task
                            ↓
                    If pattern new:
                    Append to "Learned Patterns"
```

---

## ERROR HANDLING

### Common Issues & Responses

| Issue | Detection | Response |
|-------|----------|----------|
| Health score computation in CS Core | search-agent scan | Reject, redirect to proxy |
| lead_id in CS Core table | search-agent scan | Reject, explain boundary |
| Inline fetch to SaaS Admin | code review | Redirect to intelligence/client.ts |
| Missing RLS policy | migration review | Add policy in same PR |
| TypeScript error | typecheck fail | Block merge |
| Test failure | npm test fail | Block merge |

### Escalation Types

| Type | When | Priority |
|------|------|----------|
| `arch_boundary_violation` | Intelligence/lead boundary crossed | CRITICAL |
| `error` | Task failed after retries | HIGH |
| `blocked` | Missing dependency/data | HIGH |
| `uncertain` | Low confidence in result | MEDIUM |
| `resource_limit` | Rate/cost limit hit | MEDIUM |
| `security` | Potential threat detected | CRITICAL |

---

## KEY FILES

- **Orchestrator:** `.qoder/agents/orchestrator/SKILL.md`
- **Rules:** `.qoder/rules/repo-rules`
- **Domain:** `.qoder/skills/cs-core-patterns.md`
- **Developer Guide:** `docs/DEVELOPER_GUIDE.md`
- **Intelligence Boundaries:** `.cursor/rules/task-completion-verification.mdc`

---

## Learned Patterns (From Gap Analysis)

### Pattern: Human Docs vs Agent Docs (Learned 2026-03-10)
**Context:** Two parallel documentation systems were created - human-facing DEVELOPER_GUIDE.md and agent-facing SKILL.md files. They must be cross-referenced.

**Implementation:**
- DEVELOPER_GUIDE.md: For human developers onboarding to the project
- SKILL.md files: For AI agents coordinating work
- orchestrator must link both in REFERENCES section

**Files Affected:** All skill files, docs/DEVELOPER_GUIDE.md

**Gotchas:**
- Never create SKILL.md without linking from orchestrator REFERENCES
- Never update human docs without checking if skill files need updating
- The skill files should reference DEVELOPER_GUIDE.md for deep dives

### Pattern: search_replace Partial Success (Learned 2026-03-10)
**Context:** When using search_replace tool, sometimes only some replacements succeed while others fail due to whitespace/formatting mismatches.

**Implementation:**
- Always verify each replacement succeeded
- If partial success, read the file to find exact text that failed
- Fix with targeted single replacement rather than batch

**Files Affected:** infra/database/migrations/*.sql

**Gotchas:**
- SQL files may have inline line number prefixes (e.g., "123→") that aren't visible
- grep_code shows exact content - use it to find precise text
- Don't assume all replacements in a batch succeeded

### Pattern: Intelligence Boundary Enforcement (Learned 2026-03-08)
**Context:** CS Core was computing health scores locally - architectural violation. Required complete refactor to proxy pattern.

**Implementation:**
- Removed 500+ lines of local computation from health-scoring.ts
- Created intelligence/client.ts as ONLY gateway
- Added deprecation headers to old routes
- Created live migration to remove lead_id references

**Files Affected:** libs/core/services/health-scoring.ts, libs/core/intelligence/client.ts, app/api/v1/health/calculate/route.ts, infra/database/migrations/044_*.sql

**Gotchas:**
- Never import SaaS Admin services directly - always proxy
- Health scores must NEVER be cached in CS Core
- Always fetch fresh from SaaS Admin on each request

---

**Version:** 1.1 | **Updated:** 2026-03-10
