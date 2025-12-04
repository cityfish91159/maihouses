/**
 * MockToggle Component
 * 
 * Mock 資料切換按鈕
 */

interface MockToggleProps {
  useMock: boolean;
  onToggle: () => void;
}

export function MockToggle({ useMock, onToggle }: MockToggleProps) {
  const handleToggle = () => {
    if (useMock && typeof window !== 'undefined') {
      const confirmed = window.confirm('切換到 API 資料會暫時關閉 Mock 狀態，確保重要內容已保存，是否繼續？');
      if (!confirmed) {
        return;
      }
    }
    onToggle();
  };

  return (
    <button
      onClick={handleToggle}
      className="fixed bottom-5 left-5 z-[1000] flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] px-4 py-2.5 text-xs font-bold text-white shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
      aria-label={useMock ? '切換到 API 資料' : '切換到 Mock 資料'}
    >
      {useMock ? '🧪 Mock 資料' : '🌐 API 資料'}
    </button>
  );
}
