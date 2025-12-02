/**
 * QASection Component
 * 
 * 準住戶問答區塊
 */

import type { Role, Question, Permissions } from '../types';
import { getPermissions, GUEST_VISIBLE_COUNT } from '../types';

interface QACardProps {
  q: Question;
  perm: Permissions;
  isUnanswered?: boolean;
}

function QACard({ q, perm, isUnanswered = false }: QACardProps) {
  return (
    <article className={`rounded-[14px] border p-3.5 transition-all hover:border-[rgba(0,56,90,0.15)] ${isUnanswered ? 'border-[rgba(0,159,232,0.3)] bg-gradient-to-br from-[#f6f9ff] to-[#eef5ff]' : 'border-[var(--border-light)] bg-white'}`}>
      <div className="mb-2 text-sm font-bold leading-snug text-[var(--primary-dark)]">Q: {q.question}</div>
      <div className="mb-2.5 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-secondary)]">
        <span>👤 準住戶</span>
        <span>· {q.time}</span>
        {isUnanswered ? (
          <span className="font-bold text-[var(--brand-light)]">· 等待回答中</span>
        ) : (
          <span>· {q.answersCount} 則回覆</span>
        )}
      </div>
      
      {isUnanswered ? (
        <div className="mt-2 rounded-[10px] bg-[rgba(0,56,90,0.02)] p-4 text-center text-[13px] text-[var(--text-secondary)]">
          🙋 還沒有人回答，成為第一個回答的人！
        </div>
      ) : (
        <div className="flex flex-col gap-2 border-l-[3px] border-[var(--border)] pl-3.5">
          {q.answers.map((a, idx) => (
            <div key={idx} className="py-2 text-[13px] leading-relaxed">
              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${a.type === 'agent' ? 'bg-[#e0f4ff] text-[#004E7C]' : a.type === 'official' ? 'bg-[#f6f9ff] text-[#00385a]' : 'bg-[#e6edf7] text-[#00385a]'}`}>
                  {a.type === 'agent' ? '🏢 認證房仲' : a.type === 'official' ? `📋 ${a.author}` : `🏠 ${a.author}`}
                </span>
                {a.expert && <span className="rounded bg-[#f0f5ff] px-2 py-0.5 text-[10px] font-bold text-[#004E7C]">⭐ 專家回答</span>}
              </div>
              {a.content}
            </div>
          ))}
        </div>
      )}

      {perm.canAnswer && (
        <div className="mt-2.5">
          <button 
            className={`flex w-full items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all ${isUnanswered ? 'border-[rgba(0,159,232,0.3)] bg-[rgba(0,159,232,0.1)] text-[#004E7C]' : 'border-[rgba(0,56,90,0.1)] bg-[rgba(0,56,90,0.06)] text-[var(--primary)]'} hover:bg-[rgba(0,56,90,0.12)]`}
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
  const hiddenCount = answeredQuestions.length - visibleCount;

  return (
    <section className="overflow-hidden rounded-[18px] border border-[var(--border-light)] bg-[rgba(255,255,255,0.98)] shadow-[0_2px_12px_rgba(0,51,102,0.04)]" aria-labelledby="qa-heading" id="qa-section">
      <div className="flex items-center justify-between border-b border-[rgba(0,56,90,0.05)] bg-gradient-to-br from-[rgba(0,56,90,0.03)] to-[rgba(0,82,130,0.01)] px-4 py-3.5">
        <div>
          <h2 id="qa-heading" className="flex items-center gap-1.5 text-[15px] font-extrabold text-[var(--primary-dark)]">
            🙋 準住戶問答
            {unansweredQuestions.length > 0 && (
              <span className="ml-1.5 rounded-full bg-[#e0f4ff] px-2 py-0.5 text-xs font-bold text-[#004E7C]">
                {unansweredQuestions.length} 題待回答
              </span>
            )}
          </h2>
          <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">買房前，先問問鄰居怎麼說</p>
        </div>
      </div>
      <div className="flex flex-col gap-2.5 p-3.5">
        {/* 有回答的問題 */}
        {answeredQuestions.slice(0, visibleCount).map(q => (
          <QACard key={q.id} q={q} perm={perm} />
        ))}

        {/* Blur 遮罩 */}
        {hiddenCount > 0 && answeredQuestions[visibleCount] && (
          <div className="relative">
            <div className="pointer-events-none select-none blur-[4px]" aria-hidden="true">
              <QACard q={answeredQuestions[visibleCount]} perm={perm} />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[14px] bg-[rgba(255,255,255,0.85)] p-5 text-center">
              <h4 className="mb-1 text-sm font-extrabold text-[var(--primary-dark)]">🔒 還有 {hiddenCount} 則問答</h4>
              <p className="mb-2.5 text-xs text-[var(--text-secondary)]">✓ 查看完整問答　✓ 新回答通知</p>
              <button className="rounded-full bg-gradient-to-br from-[var(--primary)] to-[#005282] px-6 py-2.5 text-[13px] font-bold text-white transition-transform hover:scale-[1.02]">
                免費註冊 / 登入
              </button>
            </div>
          </div>
        )}

        {/* 無回答的問題 */}
        {unansweredQuestions.map(q => (
          <QACard key={q.id} q={q} perm={perm} isUnanswered />
        ))}

        {/* 發問區塊 */}
        <div className="rounded-[14px] border border-dashed border-[var(--border-light)] bg-[rgba(0,56,90,0.03)] p-3.5">
          <div className="mb-2 text-sm font-bold text-[var(--text-secondary)]">💬 你也有問題想問？</div>
          <p className="mb-2 text-xs text-[var(--text-secondary)]">問題會通知該社區住戶，通常 24 小時內會有回覆</p>
          <button className="flex w-full items-center justify-center gap-1 rounded-lg border border-[rgba(0,56,90,0.1)] bg-[rgba(0,56,90,0.06)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--primary)]">
            {perm.canAskQuestion ? '我想問問題' : '登入後發問'}
          </button>
        </div>
      </div>
    </section>
  );
}
