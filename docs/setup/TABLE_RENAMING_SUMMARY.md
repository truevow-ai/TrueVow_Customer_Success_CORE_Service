# Table Renaming Migration Summary

**Date:** January 10, 2026  
**Migration File:** `docs/setup/TABLE_RENAMING_MIGRATION.sql`  
**Status:** ✅ Complete

## Overview

All tables in the CS Support Service database have been renamed with the `cs_` prefix to clearly identify which department/function they belong to.

## Table Renaming Map

| Old Table Name | New Table Name | Function/Department |
|---------------|----------------|---------------------|
| `support_tickets` | `cs_tickets` | Core Support - Tickets |
| `support_messages` | `cs_messages` | Core Support - Messages |
| `support_team_activity_feed` | `cs_team_activity_feed` | Team - Activity Tracking |
| `support_notifications` | `cs_notifications` | Team - Notifications |
| `support_agent_performance_metrics` | `cs_agent_performance_metrics` | Agent - Performance |
| `support_email_logs` | `cs_email_logs` | Communication - Email |
| `support_kb_articles` | `cs_kb_articles` | Knowledge Base - Articles |
| `support_kb_categories` | `cs_kb_categories` | Knowledge Base - Categories |
| `support_sla_policies` | `cs_sla_policies` | SLA - Policies |
| `support_csat_surveys` | `cs_survey_csat` | Survey - CSAT |
| `support_nps_scores` | `cs_survey_nps` | Survey - NPS |
| `customer_health_scores` | `cs_customer_health_scores` | Customer Success - Health |
| `support_team_members` | `cs_team_members` | Team - Members |

## Files Updated

### 1. Migration File
- ✅ Created `docs/setup/TABLE_RENAMING_MIGRATION.sql`
  - Renames all 13 tables
  - Updates all foreign key constraints
  - Renames all indexes (40+ indexes)
  - Renames all triggers (6 triggers)
  - Updates all table comments

### 2. Database Schema
- ✅ Updated `database/migrations/001_initial_schema.sql`
  - All CREATE TABLE statements updated
  - All foreign key references updated
  - All indexes renamed
  - All triggers renamed
  - All comments updated

### 3. TypeScript Types
- ✅ Updated `types/database.ts`
  - Table interface names updated
  - Type exports updated

### 4. Repository Files
- ✅ Updated `lib/repositories/tickets.ts` - All `support_tickets` → `cs_tickets`
- ✅ Updated `lib/repositories/messages.ts` - All `support_messages` → `cs_messages`
- ✅ Updated `lib/repositories/kb.ts` - All `support_kb_*` → `cs_kb_*`
- ✅ Updated `lib/repositories/activity-feed.ts` - All `support_team_activity_feed` → `cs_team_activity_feed`
- ✅ Updated `lib/repositories/team-members.ts` - All `support_team_members` → `cs_team_members`
- ✅ Updated `lib/repositories/customer-health.ts` - All `customer_health_scores` → `cs_customer_health_scores`

## Benefits

1. **Clear Organization**: Easy to identify which department/function a table belongs to
2. **Namespace Separation**: Prevents naming conflicts with other services
3. **Better Documentation**: Self-documenting table names
4. **Easier Maintenance**: Grouped by function for easier management

## Next Steps

1. **Run Migration**: Execute `docs/setup/TABLE_RENAMING_MIGRATION.sql` on the database
2. **Verify**: Check that all tables, indexes, and constraints are correctly renamed
3. **Test**: Run application tests to ensure all queries work with new table names
4. **Update Documentation**: Update any external documentation that references old table names

## Migration Instructions

```bash
# Using psql
psql $DATABASE_URL -f docs/setup/TABLE_RENAMING_MIGRATION.sql

# Or using Supabase CLI
supabase db push
```

## Rollback

If needed, the migration can be reversed by running the reverse operations:
- Rename tables back to original names
- Rename indexes back to original names
- Rename triggers back to original names
- Update foreign key constraints

**Note:** A rollback script should be created if rollback capability is required.
