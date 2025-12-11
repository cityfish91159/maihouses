import React from 'react';
import type { UagSummary } from '../../types/agent';

interface UagSummaryCardProps {
    data: UagSummary;
}

export const UagSummaryCard: React.FC<UagSummaryCardProps> = ({ data }) => {
    return (
        <article className="post" id="uag-summary" style={{ opacity: 1, transform: 'translateY(0)' }}>
            <div className="head">
                <div className="avatar">客</div>
                <div className="hgroup">
                    <b>客戶池摘要</b>
                    <div className="sub">UAG 精準獲客 · 即時</div>
                </div>
            </div>
            <div className="body">
                <div className="metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
                    <div className="metric ok" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '34px', border: '1px solid #cbead4', borderRadius: '999px', fontSize: '14px', fontWeight: 600, background: '#e8faef', color: '#107a39' }}>S {data.grade === 'S' ? '2' : '0'}</div>
                    <div className="metric ok" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '34px', border: '1px solid #cbead4', borderRadius: '999px', fontSize: '14px', fontWeight: 600, background: '#e8faef', color: '#107a39' }}>A {data.grade === 'S' ? '1' : '0'}</div>
                    <div className="metric" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '34px', border: '1px solid #e6edf7', borderRadius: '999px', fontSize: '14px', fontWeight: 600 }}>B 0</div>
                    <div className="metric" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '34px', border: '1px solid #e6edf7', borderRadius: '999px', fontSize: '14px', fontWeight: 600 }}>未回覆 1</div>
                    <div className="metric" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '34px', border: '1px solid #e6edf7', borderRadius: '999px', fontSize: '14px', fontWeight: 600 }}>逾時 0</div>
                    <div className="metric" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '34px', border: '1px solid #e6edf7', borderRadius: '999px', fontSize: '14px', fontWeight: 600 }}>近7日新增 {data.growth}</div>
                </div>
            </div>
            <div className="actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <a href="#workbench" className="btn primary" style={{ fontSize: '14px', padding: '8px 12px', borderRadius: '12px', background: '#00385a', color: '#fff', textDecoration: 'none', border: 'none', fontWeight: 700 }}>查看全部（進工作臺）</a>
            </div>
        </article>
    );
};
