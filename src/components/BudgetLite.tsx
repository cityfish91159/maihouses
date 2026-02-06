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
    <div
      style={{
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 12,
        background: '#fff',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8 }}>預算規劃（Lite）</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5,1fr)',
          gap: 8,
        }}
      >
        <label>
          總價(萬)
          <input
            type="number"
            value={total}
            onChange={(e) => setTotal(Number(e.target.value))}
            style={{
              width: '100%',
              padding: 6,
              borderRadius: 8,
              border: '1px solid #ddd',
            }}
          />
        </label>
        <label>
          頭期(%)
          <input
            type="number"
            value={down}
            onChange={(e) => setDown(Number(e.target.value))}
            style={{
              width: '100%',
              padding: 6,
              borderRadius: 8,
              border: '1px solid #ddd',
            }}
          />
        </label>
        <label>
          利率(%)
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            style={{
              width: '100%',
              padding: 6,
              borderRadius: 8,
              border: '1px solid #ddd',
            }}
          />
        </label>
        <label>
          年限
          <input
            type="number"
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            style={{
              width: '100%',
              padding: 6,
              borderRadius: 8,
              border: '1px solid #ddd',
            }}
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
            style={{
              width: '100%',
              padding: 6,
              borderRadius: 8,
              border: '1px solid #ddd',
            }}
          />
        </label>
      </div>
      <div style={{ marginTop: 10, fontSize: 14, color: '#0a2246' }}>
        概算（僅供參考）：月付約 <b>{monthly.toLocaleString()}</b> 元；貸款本金約{' '}
        <b>{principal.toFixed(0)}</b> 萬。
        {burden !== null && (
          <>
            　｜　月負擔率約 <b>{burden}%</b>（含管理費）
          </>
        )}
      </div>
      <div style={{ marginTop: 8, color: '#6b7280' }}>{warmTip}</div>
      <button
        onClick={onCopy}
        style={{
          marginTop: 8,
          padding: '6px 10px',
          borderRadius: 8,
          border: '1px solid #1749D7',
          background: '#fff',
          color: '#1749D7',
        }}
      >
        複製概算模板
      </button>
    </div>
  );
};
