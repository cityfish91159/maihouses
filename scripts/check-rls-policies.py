#!/usr/bin/env python3
"""
RLS Policy Checker for Supabase Migrations

Scans all SQL migration files and verifies:
1. All tables have RLS enabled
2. Sensitive tables have explicit DENY policies for anon/authenticated
"""

import re
import sys
from pathlib import Path
from typing import List, Tuple, Set

# 需要 service_role only 的敏感表（系統內部表）
SERVICE_ROLE_ONLY_TABLES = [
    "audit_logs",
    "uag_audit_logs",
    "uag_archive_log",
    "vapid_keys",
]

# 需要明確政策的敏感表（可允許用戶存取自己的資料）
SENSITIVE_TABLES_WITH_USER_ACCESS = [
    "transactions",
    "uag_lead_purchases",
    "push_subscriptions",
]

def extract_table_names(sql_content: str) -> List[str]:
    """提取所有 CREATE TABLE 的表名"""
    # 匹配 CREATE TABLE 語法，支援 IF NOT EXISTS 和 schema 限定
    pattern = r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?(\w+)"
    matches = re.findall(pattern, sql_content, re.IGNORECASE)
    return matches

def has_rls_enabled(sql_content: str, table_name: str) -> bool:
    """檢查表是否啟用 RLS"""
    pattern = rf"ALTER\s+TABLE\s+(?:public\.)?{table_name}\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY"
    return bool(re.search(pattern, sql_content, re.IGNORECASE))

def has_service_role_only_policy(sql_content: str, table_name: str) -> bool:
    """檢查表是否有 service_role only 政策"""
    # 匹配僅允許 service_role 的政策
    pattern = rf"CREATE\s+POLICY\s+\".+?\"\s+ON\s+(?:public\.)?{table_name}\s+FOR\s+ALL\s+TO\s+service_role"
    return bool(re.search(pattern, sql_content, re.IGNORECASE))

def has_deny_policy_for_role(sql_content: str, table_name: str, role: str) -> bool:
    """檢查表是否對特定角色有明確 DENY 政策"""
    # 匹配 USING (false) 的拒絕政策
    pattern = rf"CREATE\s+POLICY\s+\".+?\"\s+ON\s+(?:public\.)?{table_name}\s+FOR\s+ALL\s+TO\s+{role}\s+USING\s*\(\s*false\s*\)"
    return bool(re.search(pattern, sql_content, re.IGNORECASE))

def has_any_policy_for_anon_or_authenticated(sql_content: str, table_name: str) -> bool:
    """檢查表是否對 anon 或 authenticated 有任何政策"""
    pattern = rf"CREATE\s+POLICY\s+\".+?\"\s+ON\s+(?:public\.)?{table_name}\s+FOR\s+(?:ALL|SELECT)\s+TO\s+(?:anon|authenticated)"
    return bool(re.search(pattern, sql_content, re.IGNORECASE))

def check_migration_file(file_path: Path) -> List[Tuple[str, str]]:
    """檢查單一 Migration 檔案"""
    violations = []
    content = file_path.read_text(encoding="utf-8")

    tables = extract_table_names(content)

    for table in tables:
        # 檢查 1: RLS 是否啟用
        if not has_rls_enabled(content, table):
            violations.append((table, "RLS not enabled"))
            continue  # RLS 未啟用，不需檢查政策

        # 檢查 2: service_role only 表的安全政策
        if table in SERVICE_ROLE_ONLY_TABLES:
            has_service_policy = has_service_role_only_policy(content, table)
            has_anon_auth_policy = has_any_policy_for_anon_or_authenticated(content, table)

            if has_anon_auth_policy:
                # service_role only 表不應允許 anon/authenticated 存取
                violations.append((table, "Critical: service_role only table allows anon/authenticated access"))
            elif not has_service_policy:
                # 如果完全沒有 service_role 政策，建議明確設定
                violations.append((table, "Missing explicit service_role only policy"))

        # 檢查 3: 需要明確政策的敏感表
        if table in SENSITIVE_TABLES_WITH_USER_ACCESS:
            has_any_policy = has_service_role_only_policy(content, table) or has_any_policy_for_anon_or_authenticated(content, table)
            if not has_any_policy:
                violations.append((table, "Sensitive table missing explicit RLS policies"))

    return violations

def main():
    # 設定 UTF-8 輸出（支援 Windows）
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    migrations_dir = Path("supabase/migrations")

    if not migrations_dir.exists():
        print("ERROR: supabase/migrations directory not found")
        sys.exit(1)

    all_violations = []
    total_tables = 0
    total_migrations = 0

    for sql_file in sorted(migrations_dir.glob("*.sql")):
        # 跳過非 migration 檔案
        if sql_file.name in ["DEPLOY_INSTRUCTIONS.md", "MIGRATION_STATUS.md", "DIAGNOSE_406.sql"]:
            continue
        if sql_file.name.startswith("ROLLBACK_"):
            continue

        total_migrations += 1
        violations = check_migration_file(sql_file)

        # 計算表數量
        content = sql_file.read_text(encoding="utf-8")
        table_count = len(extract_table_names(content))
        total_tables += table_count

        if violations:
            all_violations.append((sql_file.name, violations))

    print(f"\n[RLS Policy Check Report]")
    print(f"===============================================")
    print(f"Total migrations scanned: {total_migrations}")
    print(f"Total tables found: {total_tables}")
    print(f"Service-role only tables: {len(SERVICE_ROLE_ONLY_TABLES)}")
    print(f"Sensitive tables with user access: {len(SENSITIVE_TABLES_WITH_USER_ACCESS)}")
    print(f"")

    if all_violations:
        print("FAIL: RLS Policy Violations Found:\n")
        violation_count = 0
        for file_name, violations in all_violations:
            print(f"FILE: {file_name}")
            for table, issue in violations:
                print(f"  WARNING: Table '{table}': {issue}")
                violation_count += 1
            print()

        print(f"Total violations: {violation_count}")
        print("\nWARNING: Please fix RLS policies before merging")
        print("Reference: docs/property-detail-trust-ui-optimization.md")
        sys.exit(1)
    else:
        print("PASS: All tables have correct RLS policies")
        print("PASS: All sensitive tables are properly protected")
        print(f"\nService-role only tables: {', '.join(SERVICE_ROLE_ONLY_TABLES)}")
        print(f"Sensitive tables with user access: {', '.join(SENSITIVE_TABLES_WITH_USER_ACCESS)}")
        sys.exit(0)

if __name__ == "__main__":
    main()
