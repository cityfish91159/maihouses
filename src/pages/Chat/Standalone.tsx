import SmartAsk from '../../features/home/sections/SmartAsk'

// 獨立聊天頁面：只渲染 AI 卡，與首頁解耦，避免未來首頁樣式/版塊調整影響聊天體驗
export default function ChatStandalone() {
  return (
    <main className="mx-auto max-w-container p-4 md:p-6">
      <SmartAsk />
    </main>
  )
}
