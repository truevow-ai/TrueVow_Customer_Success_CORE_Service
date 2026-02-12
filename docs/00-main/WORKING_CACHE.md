# WORKING_CACHE - TrueVow CS-Support Service

## Repo Type
**Node/Next.js** (npm - package-lock.json exists)

## Repo Root
`C:\Users\yasha\OneDrive\Documents\TrueVow\Cursor\TrueVow_CS_Support_Service`

## Truth Commands (in order)
1. `npm ci 2>&1 | Out-File logs/npm_ci.log`
2. `npm run lint 2>&1 | Out-File logs/npm_lint.log`
3. `npm run typecheck 2>&1 | Out-File logs/npm_typecheck.log`
4. `npm run build 2>&1 | Out-File logs/npm_build.log`

## Current Status
**BLOCKED** - OneDrive sync corrupting node_modules during npm install

## Active Failing Command
`npm install` - TAR_ENTRY_ERROR ENOENT (thousands of files)

## First Error Summary
OneDrive file sync races with npm tar extraction, causing `ENOENT: no such file or directory` for nearly every extracted file. This corrupts node_modules making all npm scripts fail with `MODULE_NOT_FOUND`.

## Last Known State
- Jest tests: **83/83 PASSED** (all Phase C-F tests passing against real Supabase DB)
- lint: BLOCKED (next binary missing)
- typecheck: BLOCKED (tsc binary missing)
- build: BLOCKED (dependencies corrupted)

## Root Cause
Repo is in OneDrive-synced folder (`C:\Users\yasha\OneDrive\Documents\...`). OneDrive's real-time sync interferes with npm's file extraction.

## Resolution Options
1. Move repo to non-synced path (e.g., `C:\Dev\TrueVow_CS_Support_Service`)
2. Pause OneDrive sync during npm install
3. Add node_modules to OneDrive exclusion list

## Next Single Action
Move repo outside OneDrive OR pause OneDrive sync, then run `npm ci`
