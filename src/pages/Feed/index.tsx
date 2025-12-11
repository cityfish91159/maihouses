/**
 * Feed 入口組件
 *
 * 根據 userId 查詢 role，顯示對應版本：
 * - agent → 房仲版
 * - member → 消費者版
 */

import { useParams, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Consumer from './Consumer';
// import Agent from './Agent'; // TODO: P6 實作

type Role = 'agent' | 'member' | 'guest';

const DEMO_IDS = ['demo-001', 'demo-consumer', 'demo-agent'];

export default function Feed() {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();

  const [role, setRole] = useState<Role>('member');
  const [loading, setLoading] = useState(true);

  // 判斷是否強制 Mock
  const mockParam = searchParams.get('mock');
  const isDemo = userId ? DEMO_IDS.includes(userId) : false;
  const forceMock = mockParam === 'true' || isDemo;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Demo ID 直接用預設 role
    if (isDemo) {
      setRole(userId === 'demo-agent' ? 'agent' : 'member');
      setLoading(false);
      return;
    }

    // 查詢真實用戶 role
    const fetchRole = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();

        if (error) throw error;
        setRole((data?.role as Role) || 'member');
      } catch (err) {
        console.error('[Feed] Failed to fetch role:', err);
        setRole('member');
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [userId, isDemo]);

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

  // 根據 role 渲染對應版本
  if (role === 'agent') {
    // TODO: P6 實作 Agent 組件
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-50">
        <div className="text-sm text-gray-500">房仲版開發中 (P6)</div>
      </div>
    );
  }

  return <Consumer userId={userId} forceMock={forceMock} />;
}
