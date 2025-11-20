# UAG Optimization Todo List (v5.0)

This document tracks the pending tasks required to fully implement the "Three-Layer Architecture" and optimization strategies defined in `UAG_SYSTEM_SPEC.md` (v5.0).

## 1. Database Migration (Immediate)
- [ ] **Execute SQL Migration**: Run `supabase-uag-optimization.sql` in the Supabase SQL Editor.
    - Creates `uag_leads` table.
    - Creates `uag_event_logs_archive` table.
    - Adds performance indices.
- [ ] **Verify Schema**: Ensure `uag_leads` has the correct columns (`grade`, `score`, `pid`, `session_id`, `agent_id`).

## 2. Backend Integration (Completed in Code)
- [x] **Refactor `api/analyze-behavior.js`**:
    - [x] Remove JSONB parsing logic.
    - [x] Implement SQL aggregation from `uag_event_logs`.
    - [x] Implement `UPSERT` to `uag_leads`.
    - [x] Add 7-day window filter for anonymous sessions.
- [x] **Update `api/uag-track.js`**:
    - [x] Trigger analysis after event logging.

## 3. Admin Dashboard Update (Next Step)
- [ ] **Update Query Logic**: Modify the Admin Dashboard (e.g., `admin/leads.html` or backend API) to query `uag_leads` instead of parsing raw JSON logs.
    - **Old Query**: Scanning `uag_sessions` JSONB (Slow).
    - **New Query**: `SELECT * FROM uag_leads WHERE agent_id = ? AND grade IN ('S', 'A') ORDER BY updated_at DESC`.
- [ ] **Real-time Updates**: Implement polling or WebSocket to refresh the dashboard when `uag_leads` changes.

## 4. Data Maintenance (Scheduled)
- [ ] **Set up Cron Job**: Configure a daily job (e.g., via pg_cron or Vercel Cron) to call `archive_old_uag_logs()`.
    - Moves logs > 30 days to archive.
    - Keeps the main `uag_event_logs` table light and fast.

## 5. Future Enhancements (Phase 2)
- [ ] **Contact Binding**:
    - Create a UI flow (Popup/Form) before "Click Line/Call".
    - Capture Phone/LINE ID.
    - Update `uag_leads` with `contact_id` to merge anonymous sessions.
- [ ] **Device Fingerprinting**:
    - Implement lightweight fingerprinting (IP subnet + UserAgent + Screen) to link anonymous sessions across cache clears.

## 6. Ultimate Optimization Tasks (v7.0 - High Priority)
These tasks supersede previous optimization plans based on the "Ultimate Optimization" directive.

### Frontend (Tracker)
- [ ] **Rewrite `public/js/tracker.js`**:
    - [ ] Implement "Single Event Payload" (remove history array batching).
    - [ ] Add `visibilitychange` and `pagehide` listeners for reliable sending.
    - [ ] Implement Fingerprinting (FingerprintJS or custom) for Session Recovery.

### Database (Schema)
- [ ] **Update Schema to v8.0**:
    - [ ] Create `uag_events` (Normalized) with `idx_session_time` and `idx_property_agent`.
    - [ ] Create `uag_sessions` (Summary) with `summary` JSONB and `idx_grade_time`.
    - [ ] Create Materialized View `uag_lead_rankings` for fast filtering.
    - [ ] Create `uag_events_archive` for cold storage.

### Backend (API)
- [ ] **Rewrite `api/uag-track.js`**:
    - [ ] Implement Incremental Update Logic (Insert Event -> Update Session Summary).
    - [ ] Implement `calculate_lead_grade` PL/pgSQL function for DB-side calculation.
- [ ] **Implement `api/archive-handler.js`**:
    - [ ] Create cron job logic to move old events to archive every 30 mins.
- [ ] **Implement `api/quick-filter.js`**:
    - [ ] Query `uag_lead_rankings` for instant results.
- [ ] **Implement `api/session-recovery.js`**:
    - [ ] Logic to match fingerprint with recent sessions.

### Frontend (Tracker)
- [ ] **Rewrite `public/js/tracker.js`**:
    - [ ] Implement `EnhancedTracker` class (localStorage + sessionStorage + Cookie).
    - [ ] Implement `EventBatcher` class (Queue + Flush).
    - [ ] Implement Fingerprint generation.
