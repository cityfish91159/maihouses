import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { usePageMode } from '../../hooks/usePageMode';
import { notify } from '../../lib/notify';
import { reloadPage, setDemoMode } from '../../lib/pageMode';

interface DemoGateProps {
  children: ReactNode;
  className?: string;
}

const REQUIRED_CLICKS = 5;
const CLICK_WINDOW_MS = 1500;
const SHAKE_DURATION_MS = 500;
const CONFIRM_TOAST_ID = 'demo-gate-confirm';

export function DemoGate({ children, className = '' }: DemoGateProps) {
  const mode = usePageMode();
  const clickTimestampsRef = useRef<number[]>([]);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    return () => {
      if (shakeTimerRef.current) {
        clearTimeout(shakeTimerRef.current);
      }
    };
  }, []);

  const triggerShake = () => {
    setIsShaking(true);

    if (shakeTimerRef.current) {
      clearTimeout(shakeTimerRef.current);
    }

    shakeTimerRef.current = setTimeout(() => {
      setIsShaking(false);
      shakeTimerRef.current = null;
    }, SHAKE_DURATION_MS);
  };

  const handleActivateDemoMode = () => {
    notify.dismiss(CONFIRM_TOAST_ID);
    const ok = setDemoMode();
    if (!ok) {
      notify.error('無法進入演示模式', '您的瀏覽器不支援本地儲存，請關閉私密瀏覽後重試。');
      return;
    }
    reloadPage();
  };

  const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (mode !== 'visitor') return;

    const now = Date.now();
    const threshold = now - CLICK_WINDOW_MS;
    const recentClicks = clickTimestampsRef.current.filter((timestamp) => timestamp >= threshold);
    recentClicks.push(now);
    clickTimestampsRef.current = recentClicks;

    if (recentClicks.length < REQUIRED_CLICKS) return;

    // 只在 5 連按觸發時才攔截事件，避免阻擋子元件正常點擊
    event.preventDefault();
    clickTimestampsRef.current = [];
    triggerShake();
    notify.info('已解鎖演示模式', '點擊「進入演示」後會重新整理頁面。', {
      id: CONFIRM_TOAST_ID,
      duration: Number.POSITIVE_INFINITY,
      action: {
        label: '進入演示',
        onClick: handleActivateDemoMode,
      },
    });
  };

  return (
    <div
      className={`inline-flex ${isShaking ? 'motion-safe:animate-shake' : ''} ${className}`.trim()}
      onClickCapture={handleClickCapture}
    >
      {children}
    </div>
  );
}
