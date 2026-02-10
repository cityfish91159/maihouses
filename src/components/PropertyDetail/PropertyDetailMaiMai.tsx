import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { track } from '../../analytics/track';
import { MaiMaiBase, MaiMaiSpeech, useMaiMaiMood } from '../MaiMai';
import type { MaiMaiMood } from '../MaiMai';

interface PropertyDetailMaiMaiProps {
  trustEnabled: boolean;
  isHot: boolean;
  trustCasesCount: number;
  agentName: string;
}

type MoodState = {
  mood: MaiMaiMood;
  message: string;
  trigger: 'idle_timer' | 'hot_property' | 'trust_enabled' | 'default';
};

const IDLE_TIMEOUT_MS = 30_000;

export const PropertyDetailMaiMai = memo(function PropertyDetailMaiMai({
  trustEnabled,
  isHot,
  trustCasesCount,
  agentName,
}: PropertyDetailMaiMaiProps) {
  const [isIdle, setIsIdle] = useState(false);
  const prevTrackKeyRef = useRef<string | null>(null);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const resetIdleTimer = () => {
      setIsIdle(false);
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setIsIdle(true);
      }, IDLE_TIMEOUT_MS);
    };

    resetIdleTimer();

    const options: AddEventListenerOptions = { passive: true };
    const events: Array<keyof WindowEventMap> = ['mousemove', 'keydown', 'touchstart', 'scroll'];
    events.forEach((eventName) => {
      window.addEventListener(eventName, resetIdleTimer, options);
    });

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      events.forEach((eventName) => {
        window.removeEventListener(eventName, resetIdleTimer);
      });
    };
  }, []);

  const moodState = useMemo<MoodState>(() => {
    if (isIdle) {
      return {
        mood: 'thinking',
        message: '還在考慮嗎？可以加 LINE 先聊聊看',
        trigger: 'idle_timer',
      };
    }

    if (isHot) {
      return {
        mood: 'excited',
        message: `這間好搶手！已經有 ${trustCasesCount} 組在看了`,
        trigger: 'hot_property',
      };
    }

    if (trustEnabled) {
      return {
        mood: 'happy',
        message: '這位房仲有開啟安心留痕，交易更有保障',
        trigger: 'trust_enabled',
      };
    }

    return {
      mood: 'idle',
      message: `嗨～歡迎看屋！${agentName} 正在線上等你`,
      trigger: 'default',
    };
  }, [agentName, isHot, isIdle, trustCasesCount, trustEnabled]);

  const { mood } = useMaiMaiMood({ externalMood: moodState.mood });

  useEffect(() => {
    const trackKey = `${mood}:${moodState.trigger}`;
    if (prevTrackKeyRef.current === trackKey) return;
    prevTrackKeyRef.current = trackKey;
    void track('maimai_property_mood', {
      mood,
      trigger: moodState.trigger,
    });
  }, [mood, moodState.trigger]);

  return (
    <div className="to-brand-50/60 rounded-2xl border border-brand-100 bg-gradient-to-br from-white p-4 shadow-sm">
      <div className="relative flex items-end gap-3">
        <div className="relative shrink-0">
          <MaiMaiSpeech messages={[moodState.message]} />
          <MaiMaiBase
            mood={mood}
            size="sm"
            animated={!prefersReducedMotion}
            showEffects={!prefersReducedMotion}
          />
        </div>
        <p className="text-sm font-medium leading-relaxed text-slate-700">{moodState.message}</p>
      </div>
    </div>
  );
});
