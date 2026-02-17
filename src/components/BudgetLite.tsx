import React, { useMemo, useState } from 'react';
import { Events, track } from '../analytics/track';

function calcMonthlyPayment(principal: number, annualRate: number, years: number) {
  const r = annualRate / 12 / 100;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

export const BudgetLite: React.FC = () => {
  const [total, setTotal] = useState<number>(1500);
  const [down, setDown] = useState<number>(30);
  const [rate, setRate] = useState<number>(2.25);
  const [years, setYears] = useState<number>(20);
  const [income, setIncome] = useState<number | ''>('');

  const principal = useMemo(() => Math.max(0, total * (1 - down / 100)), [total, down]);
  const monthly = useMemo(
    () => Math.round(calcMonthlyPayment(principal * 10000, rate, years)),
    [principal, rate, years]
  ); // 假設單位萬元
  const mgmt = 3000; // 可調

  const burden = useMemo(() => {
    if (typeof income !== 'number' || income <= 0) return null;
    return Math.round(((monthly + mgmt) / income) * 100);
  }, [income, monthly]);

  const onCopy = () => {
    const text =
      `概算（僅供參考）：\n總價${total}萬，頭期${down}% → 貸款約${principal.toFixed(0)}萬；${years}年利率${rate}% → 月付約 ${monthly} 元；管理費約 ${mgmt} 元。` +
      (burden !== null ? `\n月負擔率約 ${burden}%（含管理費）。` : '');
    navigator.clipboard.writeText(text).then(() => track(Events.BudgetCopy, {}));
  };

  const warmTip = (() => {
    if (burden === null) return '這個數字僅供參考，別給自己太大壓力。';
    if (burden >= 50) return '負擔率偏高了，先別急著決定；我們可以討論更有彈性的做法。';
    if (burden >= 35) return '負擔率有點高，可再看看地點/年限的權衡。';
    return '看起來在可接受範圍內，但仍建議保留彈性。';
  })();

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <div className="mb-2 font-semibold">預算規劃（Lite）</div>
      <div className="grid grid-cols-5 gap-2">
        <label>
          總價(萬)
          <input
            type="number"
            value={total}
            onChange={(e) => setTotal(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 p-1.5"
          />
        </label>
        <label>
          頭期(%)
          <input
            type="number"
            value={down}
            onChange={(e) => setDown(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 p-1.5"
          />
        </label>
        <label>
          利率(%)
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 p-1.5"
          />
        </label>
        <label>
          年限
          <input
            type="number"
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 p-1.5"
          />
        </label>
        <label>
          月收入(可選)
          <input
            type="number"
            value={typeof income === 'number' ? income : ''}
            onChange={(e) => {
              const v = Number(e.target.value);
              setIncome(Number.isFinite(v) ? v : '');
            }}
            className="w-full rounded-lg border border-gray-300 p-1.5"
          />
        </label>
      </div>
      <div className="mt-2.5 text-sm text-ink-900">
        概算（僅供參考）：月付約 <b>{monthly.toLocaleString()}</b> 元；貸款本金約{' '}
        <b>{principal.toFixed(0)}</b> 萬。
        {burden !== null && (
          <>
            　｜　月負擔率約 <b>{burden}%</b>（含管理費）
          </>
        )}
      </div>
      <div className="mt-2 text-gray-500">{warmTip}</div>
      <button
        onClick={onCopy}
        className="mt-2 rounded-lg border border-[var(--mh-color-1749d7)] bg-white px-2.5 py-1.5 text-[var(--mh-color-1749d7)]"
      >
        複製概算模板
      </button>
    </div>
  );
};
