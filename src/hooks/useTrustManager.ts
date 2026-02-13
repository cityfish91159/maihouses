/**
 * useTrustManager Hook
 *
 * 管理 TrustManager 元件的所有狀態和業務邏輯
 * 將元件中超過 3 個 useState 的狀態管理抽取為 hook
 */

import { useState, useEffect, useCallback } from 'react';
import { notify } from '../lib/notify';
import { logger } from '../lib/logger';
import { getErrorMessage } from '../lib/error';
import { ROUTES } from '../constants/routes';
import type { TrustTransaction, TrustStep } from '../types/trust.types';
import {
  getCurrentUser,
  loadTrustCases,
  getUserProfile,
  createTrustCase,
  updateTrustSteps,
  cancelTrustCase,
} from '../services/trustManagerService';

interface UseTrustManagerOptions {
  defaultCaseName?: string;
  showList?: boolean;
  linkPath?: string;
}

interface UseTrustManagerReturn {
  // State
  loading: boolean;
  listLoading: boolean;
  cases: TrustTransaction[];
  showForm: boolean;
  newCaseName: string;
  expandedId: string | null;
  updatingStep: string | null;
  currentUserId: string | null;

  // Actions
  setShowForm: (show: boolean) => void;
  setNewCaseName: (name: string) => void;
  setExpandedId: (id: string | null) => void;
  handleCreateCase: () => Promise<void>;
  handleCopyLink: (tx: TrustTransaction) => Promise<void>;
  handleToggleStepDone: (tx: TrustTransaction, stepNum: number) => Promise<void>;
  handleDeleteCase: (tx: TrustTransaction) => Promise<void>;
}

export function useTrustManager(options: UseTrustManagerOptions = {}): UseTrustManagerReturn {
  const { defaultCaseName = '', showList = true, linkPath = ROUTES.TRUST } = options;

  // State
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [cases, setCases] = useState<TrustTransaction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newCaseName, setNewCaseName] = useState(defaultCaseName);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingStep, setUpdatingStep] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // 載入案件列表
  const loadCases = useCallback(async (agentId: string) => {
    const result = await loadTrustCases(agentId);
    if (result.success && result.data) {
      setCases(result.data);
    } else {
      logger.error('[useTrustManager] loadCases failed', { error: result.error });
      setCases([]);
    }
    setListLoading(false);
  }, []);

  // 初始化：取得使用者並載入案件
  useEffect(() => {
    const init = async () => {
      const userResult = await getCurrentUser();
      if (userResult.success && userResult.data) {
        setCurrentUserId(userResult.data.id);
        if (showList) {
          await loadCases(userResult.data.id);
        }
      } else {
        setListLoading(false);
      }
    };
    void init();
  }, [showList, loadCases]);

  // 建立新案件
  const handleCreateCase = useCallback(async () => {
    if (!newCaseName.trim() || !currentUserId) {
      notify.error('請輸入名稱或登入');
      return;
    }

    setLoading(true);
    try {
      // 取得 user profile
      const userResult = await getCurrentUser();
      const profileResult = await getUserProfile(currentUserId);

      const agentName =
        profileResult.data?.full_name ||
        userResult.data?.email?.split('@')[0] ||
        '房仲';

      const result = await createTrustCase({
        caseName: newCaseName.trim(),
        agentId: currentUserId,
        agentName,
      });

      if (!result.success || !result.data) {
        notify.error('建立失敗', result.error ?? '未知錯誤');
        return;
      }

      // 複製連結
      const origin = import.meta.env.VITE_APP_URL || window.location.origin;
      const link = `${origin}${linkPath}?id=${result.data.id}&token=${result.data.guest_token}`;
      try {
        await navigator.clipboard.writeText(link);
        notify.success('連結已複製', '已複製案件分享連結');
      } catch {
        // TODO: 替換為自訂 Modal 顯示連結
        notify.info('請手動複製連結', link);
      }

      setNewCaseName('');
      setShowForm(false);
      await loadCases(currentUserId);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      logger.error('[useTrustManager] handleCreateCase failed', { error: errorMessage });
      notify.error('建立失敗', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [newCaseName, currentUserId, linkPath, loadCases]);

  // 複製連結
  const handleCopyLink = useCallback(async (tx: TrustTransaction) => {
    const origin = import.meta.env.VITE_APP_URL || window.location.origin;
    const link = `${origin}${linkPath}?id=${tx.id}&token=${tx.guest_token}`;
    try {
      await navigator.clipboard.writeText(link);
      notify.success('連結已複製', '已複製案件分享連結');
    } catch {
      // TODO: 替換為自訂 Modal 顯示連結
      notify.info('請手動複製連結', link);
    }
  }, [linkPath]);

  // 切換步驟完成狀態
  const handleToggleStepDone = useCallback(
    async (tx: TrustTransaction, stepNum: number) => {
      if (!currentUserId) return;

      setUpdatingStep(`${tx.id}-${stepNum}`);
      try {
        const newStepsData: TrustStep[] = structuredClone(tx.steps_data);
        const idx = newStepsData.findIndex((s) => s.step === stepNum);
        if (idx === -1) return;

        const step = newStepsData[idx];
        if (!step) return;

        step.done = !step.done;
        step.date = step.done ? new Date().toISOString() : null;

        // 計算新的 current_step
        let newCurrent = 1;
        for (let i = 0; i < newStepsData.length; i++) {
          const s = newStepsData[i];
          if (s && s.done) {
            newCurrent = s.step + 1;
          } else {
            break;
          }
        }
        if (newCurrent > 6) newCurrent = 6;

        const result = await updateTrustSteps({
          txId: tx.id,
          currentStep: newCurrent,
          stepsData: newStepsData,
        });

        if (!result.success) {
          notify.error('更新失敗');
          return;
        }

        await loadCases(currentUserId);
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        logger.error('[useTrustManager] handleToggleStepDone failed', {
          txId: tx.id,
          stepNum,
          error: errorMessage,
        });
        notify.error('更新失敗', errorMessage);
      } finally {
        setUpdatingStep(null);
      }
    },
    [currentUserId, loadCases]
  );

  // 刪除案件
  const handleDeleteCase = useCallback(
    async (tx: TrustTransaction) => {
      // TODO: 替換為自訂 ConfirmModal
      if (!window.confirm(`刪除「${tx.case_name}」？`) || !currentUserId) return;

      try {
        const result = await cancelTrustCase(tx.id);
        if (!result.success) {
          notify.error('刪除失敗');
          return;
        }
        await loadCases(currentUserId);
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        logger.error('[useTrustManager] handleDeleteCase failed', {
          txId: tx.id,
          error: errorMessage,
        });
        notify.error('刪除失敗', errorMessage);
      }
    },
    [currentUserId, loadCases]
  );

  return {
    // State
    loading,
    listLoading,
    cases,
    showForm,
    newCaseName,
    expandedId,
    updatingStep,
    currentUserId,

    // Actions
    setShowForm,
    setNewCaseName,
    setExpandedId,
    handleCreateCase,
    handleCopyLink,
    handleToggleStepDone,
    handleDeleteCase,
  };
}
