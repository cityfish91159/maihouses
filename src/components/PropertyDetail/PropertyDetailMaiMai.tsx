import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { track } from '../../analytics/track';
import { MaiMaiBase, MaiMaiSpeech, useMaiMaiMood } from '../MaiMai';
import type { MaiMaiMood } from '../MaiMai';
import { normalizeAgentName } from './agentName';
import { useMaiMaiA11yProps } from '../../hooks/useMaiMaiA11yProps';

interface PropertyDetailMaiMaiProps {
  trustEnabled: boolean;
  isHot: boolean;
  trustCasesCount: number;
  agentName: string;
  propertyId: string;
}

type MoodState = {
  mood: MaiMaiMood;
  message: string;
  trigger: 'idle_timer' | 'hot_property' | 'trust_enabled' | 'default';
};

const IDLE_TIMEOUT_MS = 30_000;
const MAX_TRUST_CASES = 999;

export const PropertyDetailMaiMai = memo(function PropertyDetailMaiMai({
  trustEnabled,
  isHot,
  trustCasesCount,
  agentName,
  propertyId,
}: PropertyDetailMaiMaiProps) {
  const [isIdle, setIsIdle] = useState(false);
  const prevTrackKeyRef = useRef<string | null>(null);

  const safeAgentName = useMemo(() => normalizeAgentName(agentName), [agentName]);
  const safeTrustCasesCount = useMemo(
    () => Math.min(MAX_TRUST_CASES, Math.max(0, Math.trunc(trustCasesCount))),
    [trustCasesCount]
  );
  const maiMaiA11yProps = useMaiMaiA11yProps();

  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const clearIdleTimer = () => {
      if (idleTimer) {
        clearTimeout(idleTimer);
        idleTimer = null;
      }
    };

    const armIdleTimer = () => {
      clearIdleTimer();
      idleTimer = setTimeout(() => {
        if (document.visibilityState === 'visible') {
          setIsIdle(true);
        }
      }, IDLE_TIMEOUT_MS);
    };

    const resetIdleTimer = () => {
      if (document.visibilityState !== 'visible') return;
      setIsIdle(false);
      armIdleTimer();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resetIdleTimer();
        return;
      }
      setIsIdle(false);
      clearIdleTimer();
    };

    resetIdleTimer();

    const passiveOptions: AddEventListenerOptions = { passive: true };
    ['mousemove', 'touchstart', 'scroll'].forEach((eventName) => {
      window.addEventListener(eventName, resetIdleTimer, passiveOptions);
    });
    window.addEventListener('keydown', resetIdleTimer);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearIdleTimer();
      ['mousemove', 'touchstart', 'scroll'].forEach((eventName) => {
        window.removeEventListener(eventName, resetIdleTimer);
      });
      window.removeEventListener('keydown', resetIdleTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Mood 優先級邏輯: isHot > isIdle > trustEnabled > default
  // Priority 1 (最高): 熱門物件 - 最強訊號，立即吸引注意
  // Priority 2: 閒置偵測 - 時效性高，需即時引導
  // Priority 3: 安心留痕 - 持續性功能，背景展示
  // Priority 4 (最低): 預設歡迎 - 通用訊息
  const moodState = useMemo<MoodState>(() => {
    // Priority 1: Hot property (strongest signal)
    if (isHot) {
      return {
        mood: 'excited',
        message:
          safeTrustCasesCount > 0
            ? `這間好搶手！已經有 ${safeTrustCasesCount} 組在看了`
            : '這間物件很受關注，快來看看！',
        trigger: 'hot_property',
      };
    }

    // Priority 2: User idle (time-sensitive)
    if (isIdle) {
      return {
        mood: 'thinking',
        message: '還在考慮嗎？可以加 LINE 先聊聊看',
        trigger: 'idle_timer',
      };
    }

    // Priority 3: Trust enabled (persistent feature)
    if (trustEnabled) {
      return {
        mood: 'happy',
        message: '這位房仲有開啟安心留痕，交易更有保障',
        trigger: 'trust_enabled',
      };
    }

    // Priority 4: Default welcome
    return {
      mood: 'idle',
      message: `嗨～歡迎看屋！${safeAgentName} 正在線上等你`,
      trigger: 'default',
    };
  }, [isHot, isIdle, safeAgentName, safeTrustCasesCount, trustEnabled]);

  const { mood } = useMaiMaiMood({ externalMood: moodState.mood });

  useEffect(() => {
    const trackKey = `${propertyId}:${mood}:${moodState.trigger}`;
    if (prevTrackKeyRef.current === trackKey) return;
    prevTrackKeyRef.current = trackKey;
    void track('maimai_property_mood', {
      propertyId,
      mood,
      trigger: moodState.trigger,
    });
  }, [mood, moodState.trigger, propertyId]);

  return (
    <div className="rounded-2xl border border-brand-100 bg-bg-card p-4 shadow-sm">
      <div className="relative flex items-end gap-3">
        <div className="relative shrink-0">
          <MaiMaiSpeech messages={[moodState.message]} />
          <MaiMaiBase mood={mood} size="sm" {...maiMaiA11yProps} />
        </div>
      </div>
    </div>
  );
});
