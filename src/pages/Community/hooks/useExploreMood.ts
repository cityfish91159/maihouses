/**
 * useExploreMood
 *
 * Explore 頁面的 MaiMai mood/speech 邏輯
 * 從 Explore.tsx 抽出以降低主組件行數
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import type { MaiMaiMood } from '../../../components/MaiMai/types';

const CLICK_EASTER_EGG_COUNT = 5;
const COMMUNITY_COUNT_SPEECH_PREFIX = '有 ';
const COMMUNITY_COUNT_SPEECH_SUFFIX = ' 個社區！';

// 只宣告此頁面實際使用的 mood，避免 idle/peek/shy/sleep/header 空字串造成誤解
const MOOD_SPEECH: Partial<Record<MaiMaiMood, string>> = {
  wave: '嗨！想找哪個社區的鄰居評價？',
  thinking: '輸入社區名或地址試試看…',
  excited: '找到了嗎？',
  confused: '沒找到耶…換個關鍵字？',
  celebrate: '你找到我的彩蛋了！',
};

function buildCommunityCountSpeech(count: number): string {
  return `${COMMUNITY_COUNT_SPEECH_PREFIX}${count}${COMMUNITY_COUNT_SPEECH_SUFFIX}`;
}

interface UseExploreMoodResult {
  mood: MaiMaiMood;
  speechMessages: string[];
  effectiveMood: MaiMaiMood;
  effectiveSpeech: string[];
  handleSearchFocus: () => void;
  handleSearchMoodUpdate: (val: string) => void;
  handleCardHover: () => void;
  handleCardLeave: () => void;
  handleMaiMaiClick: () => void;
}

export function useExploreMood(query: string, filteredCount: number): UseExploreMoodResult {
  const [mood, setMood] = useState<MaiMaiMood>('wave');
  const [speechMessages, setSpeechMessages] = useState<string[]>([MOOD_SPEECH.wave ?? '']);
  const clickCountRef = useRef(0);
  const queryRef = useRef('');

  const pushMood = useCallback((newMood: MaiMaiMood, text: string) => {
    setMood(newMood);
    if (text) {
      setSpeechMessages((prev) => [...prev.slice(-2), text]);
    }
  }, []);

  const handleSearchFocus = useCallback(() => {
    pushMood('thinking', MOOD_SPEECH.thinking ?? '');
  }, [pushMood]);

  const handleSearchMoodUpdate = useCallback(
    (val: string) => {
      queryRef.current = val;
      if (!val.trim()) {
        pushMood('wave', MOOD_SPEECH.wave ?? '');
      } else {
        pushMood('excited', MOOD_SPEECH.excited ?? '');
      }
    },
    [pushMood]
  );

  const handleCardHover = useCallback(() => {
    pushMood('excited', MOOD_SPEECH.excited ?? '');
  }, [pushMood]);

  const handleCardLeave = useCallback(() => {
    if (queryRef.current.trim()) {
      pushMood('excited', MOOD_SPEECH.excited ?? '');
    } else {
      pushMood('wave', MOOD_SPEECH.wave ?? '');
    }
  }, [pushMood]);

  const handleMaiMaiClick = useCallback(() => {
    clickCountRef.current += 1;
    if (clickCountRef.current >= CLICK_EASTER_EGG_COUNT) {
      clickCountRef.current = 0;
      pushMood('celebrate', MOOD_SPEECH.celebrate ?? '');
    }
  }, [pushMood]);

  const effectiveMood: MaiMaiMood = useMemo(() => {
    if (!query.trim()) return mood;
    return filteredCount === 0 ? 'confused' : 'happy';
  }, [query, filteredCount, mood]);

  const effectiveSpeech: string[] = useMemo(() => {
    if (!query.trim()) return speechMessages;
    if (filteredCount === 0) return [...speechMessages.slice(-2), MOOD_SPEECH.confused ?? ''];
    return [...speechMessages.slice(-2), buildCommunityCountSpeech(filteredCount)];
  }, [query, filteredCount, speechMessages]);

  return {
    mood,
    speechMessages,
    effectiveMood,
    effectiveSpeech,
    handleSearchFocus,
    handleSearchMoodUpdate,
    handleCardHover,
    handleCardLeave,
    handleMaiMaiClick,
  };
}
