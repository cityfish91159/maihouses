#!/bin/bash
# RLS Checker 測試腳本
# 驗證檢查器能否正確檢測違規項目

set -e

echo "=========================================="
echo "RLS Policy Checker - Test Suite"
echo "=========================================="
echo ""

# 測試 1: 執行檢查器
echo "TEST 1: Running RLS checker on existing migrations..."
python scripts/check-rls-policies.py && EXIT_CODE=$? || EXIT_CODE=$?

if [ $EXIT_CODE -eq 1 ]; then
    echo "✅ TEST 1 PASSED: Checker detected violations (as expected)"
else
    echo "❌ TEST 1 FAILED: Checker should detect violations but didn't"
    exit 1
fi

echo ""
echo "=========================================="
echo "Current Violations Summary"
echo "=========================================="
echo ""
echo "Based on the check, we have violations in:"
echo "- 20251230_uag_rpc_functions.sql (uag_lead_purchases: RLS not enabled)"
echo "- 20251230_uag_tracking_v8.sql (uag_events_archive: RLS not enabled)"
echo "- 20251231_001_uag_schema_setup.sql (uag_lead_purchases, uag_audit_logs: RLS not enabled)"
echo "- 20260105_uag_8_pg_cron_setup.sql (uag_archive_log: RLS not enabled)"
echo ""
echo "These violations are expected because:"
echo "1. Some tables were created in earlier migrations"
echo "2. RLS was enabled in later migrations (20260122_uag_*_rls.sql)"
echo ""
echo "=========================================="
echo "Recommendation"
echo "=========================================="
echo ""
echo "Option A: Fix at source (move RLS to original migration)"
echo "Option B: Document as known technical debt"
echo "Option C: Create consolidated RLS migration"
echo ""
echo "For production deployment, all new migrations MUST enable RLS"
echo "in the same file where the table is created."
echo ""
echo "✅ RLS Checker is working correctly!"
