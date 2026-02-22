/**
 * Feed 入口組件
 *
 * 行為：
 * - `/feed/:userId`：查詢真實角色並顯示對應版本
 * - `/feed/demo`：演示入口，已登入導回真實 user feed
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Consumer from './Consumer';
import Agent from './Agent';
import { RoleToggle } from '../../components/Feed/RoleToggle';
import { logger } from '../../lib/logger';
import { useAuth } from '../../hooks/useAuth';
import { usePageMode } from '../../hooks/usePageMode';
import { FEED_DEMO_ROLE_STORAGE_KEY } from '../../lib/pageMode';
import { safeSessionStorage } from '../../lib/safeStorage';
import { ROUTES, RouteUtils } from '../../constants/routes';

type Role = 'agent' | 'member' | 'guest';
/** Demo 模式只支援 agent/member 兩種切換角色（使用 Extract 確保型別來源一致）。 */
type DemoRole = Extract<Role, 'agent' | 'member'>;

/** 讀取 demo 角色；若無資料或值異常，一律回退 member。 */
function readDemoRole(): DemoRole {
  const persistedRole = safeSessionStorage.getItem(FEED_DEMO_ROLE_STORAGE_KEY);
  return persistedRole === 'agent' ? 'agent' : 'member';
}

export default function Feed() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  // mode 來自 usePageMode()：支援 demo 到期響應式退出（不可在路由層覆蓋）
  const mode = usePageMode();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const isDemoMode = mode === 'demo';
  const isDemoRoute = !userId;

  const [role, setRole] = useState<Role>('member');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const finish = (nextRole: Role) => {
      if (!mounted) return;
      setRole(nextRole);
      setLoading(false);
    };

    setLoading(true);

    if (isDemoRoute) {
      if (authLoading) {
        // wait auth state settle
      } else if (isAuthenticated && user?.id) {
        navigate(RouteUtils.toNavigatePath(ROUTES.FEED(user.id)), { replace: true });
      } else if (!isDemoMode) {
        navigate(RouteUtils.toNavigatePath(ROUTES.HOME), { replace: true });
      } else {
        finish(readDemoRole());
      }
    } else if (isDemoMode) {
      finish(readDemoRole());
    } else {
      const fetchRole = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

          if (error) throw error;
          const dbRole = data?.role;
          if (dbRole === 'agent' || dbRole === 'member' || dbRole === 'guest') {
            finish(dbRole);
          } else {
            finish('member');
          }
        } catch (err) {
          logger.error('[Feed] Failed to fetch role', { error: err });
          finish('member');
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

      void fetchRole();
    }

    return () => {
      mounted = false;
    };
  }, [authLoading, isAuthenticated, isDemoMode, isDemoRoute, navigate, user?.id, userId]);

  const handleRoleToggle = () => {
    setRole((prevRole) => (prevRole === 'agent' ? 'member' : 'agent'));
  };

  useEffect(() => {
    if (!isDemoMode) return;
    if (role !== 'agent' && role !== 'member') return;
    safeSessionStorage.setItem(FEED_DEMO_ROLE_STORAGE_KEY, role);
  }, [isDemoMode, role]);

  if (loading || (isDemoRoute && authLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-50">
        <div className="text-sm text-gray-500">載入中...</div>
      </div>
    );
  }

  return (
    <>
      {role === 'agent' ? (
        userId ? (
          <Agent userId={userId} mode={mode} />
        ) : (
          <Agent mode={mode} />
        )
      ) : userId ? (
        <Consumer userId={userId} mode={mode} />
      ) : (
        <Consumer mode={mode} />
      )}
      {isDemoMode && (
        <RoleToggle
          currentRole={role === 'agent' ? 'agent' : 'member'}
          onToggle={handleRoleToggle}
        />
      )}
    </>
  );
}
