/**
 * QASection Component
 * 
 * 準住戶問答區塊
 * 重構：使用 LockedOverlay + Tailwind brand 色系
 */

import type { Role, Question, Permissions } from '../types';
import { getPermissions, GUEST_VISIBLE_COUNT } from '../types';
import { LockedOverlay } from './LockedOverlay';

interface QACardProps {
  q: Question;
  perm: Permissions;
  isUnanswered?: boolean;
}

function QACard({ q, perm, isUnanswered = false }: QACardProps) {
  return (
    <article className={`rounded-[14px] border p-3.5 transition-all hover:border-brand/15 ${isUnanswered ? 'border-brand-light/30 bg-gradient-to-br from-brand-50 to-brand-100/30' : 'border-border-light bg-white'}`}>
      <div className="mb-2 text-sm font-bold leading-snug text-brand-700">Q: {q.question}</div>
      <div className="mb-2.5 flex flex-wrap items-center gap-2 text-[11px] text-ink-600">
        <span>👤 準住戶</span>
        <span>· {q.time}</span>
        {isUnanswered ? (
          <span className="font-bold text-brand-light">· 等待回答中</span>
        ) : (
          <span>· {q.answersCount} 則回覆</span>
        )}
      </div>
      
      {isUnanswered ? (
        <div className="mt-2 rounded-[10px] bg-brand/2 p-4 text-center text-[13px] text-ink-600">
          🙋 還沒有人回答，成為第一個回答的人！
        </div>
      ) : (
        <div className="flex flex-col gap-2 border-l-[3px] border-border-light pl-3.5">
          {q.answers.map((a, idx) => (
            <div key={idx} className="py-2 text-[13px] leading-relaxed">
              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${a.type === 'agent' ? 'bg-brand-100 text-brand-600' : a.type === 'official' ? 'bg-brand-50 text-brand' : 'bg-brand-100 text-brand'}`}>
                  {a.type === 'agent' ? '🏢 認證房仲' : a.type === 'official' ? `📋 ${a.author}` : `🏠 ${a.author}`}
                </span>
                {a.expert && <span className="rounded bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-600">⭐ 專家回答</span>}
              </div>
              {a.content}
            </div>
          ))}
        </div>
      )}

      {perm.canAnswer && (
        <div className="mt-2.5">
          <button 
            className={`flex w-full items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all ${isUnanswered ? 'border-brand-light/30 bg-brand-light/10 text-brand-600' : 'border-brand/10 bg-brand/6 text-brand'} hover:bg-brand/12`}
            aria-label={isUnanswered ? '搶先回答這個問題' : '回答這個問題'}
          >
            💬 {isUnanswered ? '搶先回答' : '我來回答'}{perm.isAgent ? '（專家）' : ''}
          </button>
        </div>
      )}
    </article>
  );
}

interface QASectionProps {
  role: Role;
  questions: Question[];
}

export function QASection({ role, questions }: QASectionProps) {
  const perm = getPermissions(role);

  const answeredQuestions = questions.filter(q => q.answers.length > 0);
  const unansweredQuestions = questions.filter(q => q.answers.length === 0);

  const visibleCount = perm.isLoggedIn ? answeredQuestions.length : Math.min(GUEST_VISIBLE_COUNT, answeredQuestions.length);
  const hiddenCount = Math.max(0, answeredQuestions.length - visibleCount);

  return (
    <section className="scroll-mt-20 overflow-hidden rounded-[18px] border border-border-light bg-white/98 shadow-[0_2px_12px_rgba(0,51,102,0.04)]" aria-labelledby="qa-heading" id="qa-section">
      <div className="flex items-center justify-between border-b border-brand/5 bg-gradient-to-br from-brand/3 to-brand-600/1 px-4 py-3.5">
        <div>
          <h2 id="qa-heading" className="flex items-center gap-1.5 text-[15px] font-extrabold text-brand-700">
            🙋 準住戶問答
            {unansweredQuestions.length > 0 && (
              <span className="ml-1.5 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-600">
                {unansweredQuestions.length} 題待回答
              </span>
            )}
          </h2>
          <p className="mt-0.5 text-[11px] text-ink-600">買房前，先問問鄰居怎麼說</p>
        </div>
      </div>
      <div className="flex flex-col gap-2.5 p-3.5">
        {/* 有回答的問題 */}
        {answeredQuestions.slice(0, visibleCount).map(q => (
          <QACard key={q.id} q={q} perm={perm} />
        ))}

        {/* 使用 LockedOverlay 組件 */}
        <LockedOverlay
          visible={hiddenCount > 0 && !!answeredQuestions[visibleCount]}
          hiddenCount={hiddenCount}
          countLabel="則問答"
          benefits={['查看完整問答', '新回答通知']}
        >
          {answeredQuestions[visibleCount] && (
            <QACard q={answeredQuestions[visibleCount]} perm={perm} />
          )}
        </LockedOverlay>

        {/* 無回答的問題 */}
        {unansweredQuestions.map(q => (
          <QACard key={q.id} q={q} perm={perm} isUnanswered />
        ))}

        {/* 發問區塊 */}
        <div className="rounded-[14px] border border-dashed border-border-light bg-brand/3 p-3.5">
          <div className="mb-2 text-sm font-bold text-ink-600">💬 你也有問題想問？</div>
          <p className="mb-2 text-xs text-ink-600">問題會通知該社區住戶，通常 24 小時內會有回覆</p>
          <button className="flex w-full items-center justify-center gap-1 rounded-lg border border-brand/10 bg-brand/6 px-2.5 py-1.5 text-[11px] font-semibold text-brand">
            {perm.canAskQuestion ? '我想問問題' : '登入後發問'}
          </button>
        </div>
      </div>
    </section>
  );
}
