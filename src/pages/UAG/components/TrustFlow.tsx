import React from 'react';

export default function TrustFlow() {
  return (
    <section className="uag-card k-span-3">
      <div className="uag-card-header">
        <div className="uag-card-title">安心流程管理</div>
        <div className="uag-card-sub">五階段・交易留痕</div>
      </div>
      <div className="card-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '8px', marginBottom: '8px' }}>
          <div style={{ textAlign: 'center' }}><div className="flow-stage" style={{ background: '#16a34a', color: '#fff' }}>✓</div><div className="small" style={{ fontWeight: 700, color: '#16a34a' }}>M1 接洽</div></div>
          <div style={{ textAlign: 'center' }}><div className="flow-stage" style={{ background: '#16a34a', color: '#fff' }}>✓</div><div className="small" style={{ fontWeight: 700, color: '#16a34a' }}>M2 帶看</div></div>
          <div style={{ textAlign: 'center' }}><div className="flow-stage" style={{ background: '#1749d7', color: '#fff' }}>●</div><div className="small" style={{ fontWeight: 700, color: '#1749d7' }}>M3 出價</div></div>
          <div style={{ textAlign: 'center' }}><div className="flow-stage" style={{ background: '#e5e7eb', color: '#6b7280' }}>・</div><div className="small" style={{ color: '#6b7a90' }}>M4 簽約</div></div>
          <div style={{ textAlign: 'center' }}><div className="flow-stage" style={{ background: '#e5e7eb', color: '#6b7280' }}>・</div><div className="small" style={{ color: '#6b7a90' }}>M5 交屋</div></div>
        </div>
        <div className="timeline-wrap">
          <div className="timeline-header" style={{ display: 'grid', gridTemplateColumns: '90px 1fr 96px', gap: 0, padding: '8px 12px', fontSize: '13px' }}>
            <div>時間</div><div>事件與參與者</div><div>留痕</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 96px', alignItems: 'start', borderBottom: '1px solid var(--line-soft)', padding: '8px 12px' }}>
            <div className="small">10/30 22:10</div>
            <div><div className="small" style={{ color: 'var(--ink-100)' }}><b>M1 初次接洽建立</b>｜買方 A103</div><div className="small" style={{ color: 'var(--ink-300)' }}>房源：惠宇上晴 12F</div></div>
            <div><div className="uag-badge" style={{ fontSize: '10px' }}>hash: 9f2a…</div></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 96px', alignItems: 'start', borderBottom: '1px solid var(--line-soft)', padding: '8px 12px' }}>
            <div className="small">10/31 09:20</div>
            <div><div className="small" style={{ color: 'var(--ink-100)' }}><b>M2 帶看雙方到場</b>｜買方 A103</div><div className="small" style={{ color: 'var(--ink-300)' }}>GeoTag: 南屯社區大廳</div></div>
            <div><div className="uag-badge" style={{ fontSize: '10px' }}>sig: b7aa…</div></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 96px', alignItems: 'start', background: '#fefce8', padding: '8px 12px' }}>
            <div className="small">10/31 10:40</div>
            <div><div className="small" style={{ color: 'var(--ink-100)' }}><b>M3 買方出價</b>｜買方 A103</div><div className="small" style={{ color: 'var(--ink-300)' }}>出價 NT$31,500,000</div></div>
            <div><div className="uag-badge" style={{ fontSize: '10px', background: '#fef3c7', color: '#92400e', border: '1px solid #f6d88a' }}>hash: 1a7c…</div></div>
          </div>
        </div>
      </div>
    </section>
  );
}
