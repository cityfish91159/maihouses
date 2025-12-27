// MUSE Night Mode - Shadow Sync Hook
// 影子同步：追蹤用戶輸入和猶豫（退格）

import { useRef, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { getSessionId } from '../utils';

export const useShadowSync = (text: string, backspaceCount: number): void => {
  const lastSync = useRef('');
  const currentTextRef = useRef(text);
  const currentBackspaceRef = useRef(backspaceCount);

  useEffect(() => {
    currentTextRef.current = text;
    currentBackspaceRef.current = backspaceCount;
  }, [text, backspaceCount]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const currentText = currentTextRef.current;
      const currentBack = currentBackspaceRef.current;

      if (currentText === lastSync.current || currentText.length === 0) return;

      const sessionId = getSessionId();

      const { error } = await supabase.from('shadow_logs').insert({
        user_id: sessionId,
        content: currentText,
        hesitation_count: currentBack,
        mode: 'night'
      });

      if (error) console.error('Shadow Sync Error:', error);
      lastSync.current = currentText;
    }, 2000);

    return () => clearInterval(interval);
  }, []);
};
