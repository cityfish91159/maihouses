/**
 * MockToggle Component
 * 全域 Mock 資料切換按鈕
 */

interface MockToggleProps {
  useMock: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function MockToggle({ useMock, onToggle, disabled = false }: MockToggleProps) {
  const handleToggle = () => {
    if (disabled) return;
    onToggle();
  };

  return (
    <button
      onClick={handleToggle}
      disabled={disabled}
      aria-disabled={disabled}
      title={disabled ? '僅限內部測試時才可切換 Mock 模式' : undefined}
      className={`fixed bottom-5 left-5 z-[1000] flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] px-4 py-2.5 text-xs font-bold text-white shadow-[0_4px_20px_rgba(0,0,0,0.3)] ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:brightness-110'}`}
      aria-label={useMock ? '切換到 API 資料' : '切換到 Mock 資料'}
    >
      {useMock ? '🧪 Mock 資料' : '🌐 API 資料'}
    </button>
  );
}
