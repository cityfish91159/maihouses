/**
 * Feed 入口組件
 *
 * 根據 userId 查詢 role，顯示對應版本：
 * - agent → 房仲版
 * - member → 消費者版
 */

import { useParams, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Consumer from "./Consumer";
import Agent from "./Agent";
import { RoleToggle } from "../../components/Feed/RoleToggle";
import { logger } from "../../lib/logger";

type Role = "agent" | "member" | "guest";

const DEMO_IDS = ["demo-001", "demo-consumer", "demo-agent"];

export default function Feed() {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();

  const [role, setRole] = useState<Role>("member");
  const [overrideRole, setOverrideRole] = useState<Role | null>(null); // Toggle state
  const [loading, setLoading] = useState(true);

  // 判斷是否強制 Mock
  const mockParam = searchParams.get("mock");
  const isDemo = userId ? DEMO_IDS.includes(userId) : false;
  const forceMock = mockParam === "true" || isDemo;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    if (forceMock) {
      setRole(userId === "demo-agent" ? "agent" : "member");
      setLoading(false);
      return;
    }

    // Demo 預設給 Agent 讓他們可以切換
    if (isDemo) {
      setRole(userId === "demo-agent" ? "agent" : "member");
      setLoading(false);
      return;
    }

    // 查詢真實用戶 role
    const fetchRole = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .single();

        if (error) throw error;
        // [NASA TypeScript Safety] 驗證 role 值而非使用 as Role
        const dbRole = data?.role;
        if (dbRole === "agent" || dbRole === "member" || dbRole === "guest") {
          setRole(dbRole);
        } else {
          setRole("member");
        }
      } catch (err) {
        logger.error("[Feed] Failed to fetch role", { error: err });
        setRole("member");
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [userId, isDemo, forceMock]);

  // Decide active role
  const activeRole = overrideRole || role;

  const handleRoleToggle = () => {
    const next = activeRole === "agent" ? "member" : "agent";
    setOverrideRole(next);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-50">
        <div className="text-sm text-gray-500">載入中...</div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-50">
        <div className="text-sm text-red-500">缺少用戶 ID</div>
      </div>
    );
  }

  return (
    <>
      {activeRole === "agent" ? (
        <Agent userId={userId} forceMock={forceMock} />
      ) : (
        <Consumer userId={userId} forceMock={forceMock} />
      )}

      {forceMock && (
        <RoleToggle
          currentRole={activeRole as "agent" | "member"}
          onToggle={handleRoleToggle}
        />
      )}
    </>
  );
}
