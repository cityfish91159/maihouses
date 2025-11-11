import { NoteWithEcho } from '../../components/NoteWithEcho'
import { DebriefMini } from '../../components/DebriefMini'
import { BudgetLite } from '../../components/BudgetLite'

export default function Detail() {
  return (
    <section className="mx-auto mt-8 max-w-container space-y-6 rounded-[var(--r-lg)] bg-white p-6 shadow-[var(--shadow-card)]">
      <h1 className="text-xl font-semibold">物件詳情</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">示意頁。</p>
      
      {/* A4: 即時同伴提示 */}
      <div className="border-t pt-4">
        <h3 className="mb-2 font-medium">📝 看房筆記</h3>
        <NoteWithEcho />
      </div>
      
      {/* A7: 預算負擔比試算 */}
      <div className="border-t pt-4">
        <h3 className="mb-2 font-medium">💰 負擔評估</h3>
        <BudgetLite />
      </div>
      
      {/* A8: 看房覆盤 */}
      <div className="border-t pt-4">
        <h3 className="mb-2 font-medium">🎯 看房覆盤</h3>
        <DebriefMini />
      </div>
    </section>
  )
}
