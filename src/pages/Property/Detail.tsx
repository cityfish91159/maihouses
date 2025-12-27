import { BudgetLite } from '../../components/BudgetLite'
import { PoliteRewrite } from '../../components/PoliteRewrite'
import { NoteWithEcho } from '../../components/NoteWithEcho'
import { DebriefMini } from '../../components/DebriefMini'
import { ELI5Tooltip } from '../../components/ELI5Tooltip'

export default function Detail() {
  return (
    <section className="mx-auto mt-8 max-w-container space-y-6 rounded-[var(--r-lg)] bg-white p-6 shadow-[var(--shadow-card)]">
      <h1 className="text-xl font-semibold">物件詳情</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">示意頁。</p>

      {/* A7: Budget Calculator */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h2 className="mb-3 text-lg font-medium">房貸負擔試算</h2>
        <BudgetLite />
      </div>

      {/* A5: Polite Message Rewrite */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h2 className="mb-3 text-lg font-medium">禮貌改寫訊息</h2>
        <PoliteRewrite />
      </div>

      {/* A4: Note with AI Echo */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h2 className="mb-3 text-lg font-medium">看房筆記</h2>
        <NoteWithEcho />
      </div>

      {/* A8: Viewing Debrief */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h2 className="mb-3 text-lg font-medium">看房心得</h2>
        <DebriefMini />
      </div>

      {/* A6: ELI5 Tooltip Demo */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h2 className="mb-3 text-lg font-medium">專有名詞解釋</h2>
        <p className="text-sm text-gray-600">
          這個物件的<ELI5Tooltip text="容積率" /> 和<ELI5Tooltip text="建蔽率" /> 都符合法規標準。
        </p>
      </div>
    </section>
  )
}
