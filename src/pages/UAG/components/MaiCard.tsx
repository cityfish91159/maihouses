import React from 'react';

export default function MaiCard() {
  return (
    <section className="uag-card k-span-3">
      <div className="uag-card-header">
        <div><div className="uag-card-title">手機報告生成器</div><div className="uag-card-sub">半屏小卡・行動優先</div></div>
        <div className="uag-actions"><button className="uag-btn primary" onClick={() => alert('系統提示：報告生成中...')}>生成報告</button></div>
      </div>
      <div className="card-body">
        <section aria-label="手機報告生成小卡" className="mai-card">
          <header className="mai-head">
            <span className="mai-tag">快速報告</span>
            <h3 className="mai-title">惠宇上晴 12F｜3房2廳2衛</h3>
            <p className="mai-sub">南屯區 · 67.3 坪 · 屋齡 5 年</p>
          </header>
          <div className="mai-body">
            <div className="mai-left">
              <div className="mai-price">
                <div className="k">開價</div><div className="v">NT$ 32,880,000</div><div className="u">參考：52.1 萬/坪</div>
              </div>
              <ul className="mai-stats">
                <li><span>議價建議</span><b>-2% ~ -6%</b></li>
                <li><span>貸款月付</span><b>≈ 8.6 萬</b></li>
                <li><span>近三筆實登</span><b>52.8 / 51.5 / 50.9</b></li>
              </ul>
            </div>
            <div className="mai-right">
              <div className="mai-thumb"><img alt="物件主圖" src="data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='200'%3E%3Crect width='100%25' height='100%25' fill='%23e5edff'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%231749d7'%3EMAIN%3C/text%3E%3C/svg%3E" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
              <div className="mai-mini">
                <div style={{ background: '#f0f4ff', borderRadius: '8px', aspectRatio: '3/2' }}></div>
                <div style={{ background: '#f0f4ff', borderRadius: '8px', aspectRatio: '3/2' }}></div>
                <div style={{ background: '#f0f4ff', borderRadius: '8px', aspectRatio: '3/2' }}></div>
              </div>
            </div>
          </div>
          <div className="mai-actions">
            <button className="mai-btn primary">一鍵生成報告</button>
            <button className="mai-btn line">LINE 分享</button>
          </div>
        </section>
      </div>
    </section>
  );
}
