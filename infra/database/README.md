# Database Migrations

This directory contains database migration scripts for the CS-Support Service.

## Migration Files

- `001_initial_schema.sql` - Initial database schema with all tables, indexes, and triggers

## Running Migrations

### Using Supabase CLI

```bash
# Apply migrations
supabase db push

# Or apply specific migration
psql $DATABASE_URL < database/migrations/001_initial_schema.sql
```

### Using psql

```bash
psql $DATABASE_URL -f database/migrations/001_initial_schema.sql
```

### Using Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the migration SQL
3. Run the query

## Schema Overview

The database schema includes:

- **support_tickets** - Main support ticket table
- **support_messages** - Conversation thread messages
- **support_team_activity_feed** - Team activity tracking
- **support_agent_performance_metrics** - Agent performance data
- **support_email_logs** - Email delivery tracking
- **support_notifications** - Team notifications
- **support_kb_articles** - Knowledge base articles
- **support_kb_categories** - KB article categories
- **customer_health_scores** - Customer health tracking
- **support_sla_policies** - SLA policy definitions
- **support_csat_surveys** - CSAT survey responses
- **support_nps_scores** - NPS survey responses
- **support_team_members** - Team member profiles

## Indexes

All tables have appropriate indexes for:
- Foreign key lookups
- Status/priority filtering
- Date range queries
- Full-text search (KB articles)

## Row Level Security (RLS)

RLS policies should be configured in Supabase Dashboard or via additional migration files to enforce:
- Tenant isolation
- Role-based access control
- Data privacy

