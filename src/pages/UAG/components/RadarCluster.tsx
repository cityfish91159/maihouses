import React from 'react';
import { Lead } from '../mockData';

interface RadarClusterProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

export default function RadarCluster({ leads, onSelectLead }: RadarClusterProps) {
  const liveLeads = leads.filter(l => l.status === 'new');

  return (
    <section className="uag-card k-span-6" id="radar-section" style={{ minHeight: '450px' }}>
      <div className="uag-card-header">
        <div>
          <div className="uag-card-title">UAG 精準導客雷達</div>
          <div className="uag-card-sub">S/A 級獨家聯絡權｜B/C/F 級點數兌換</div>
        </div>
        <div className="uag-actions" style={{ gap: '4px' }}>
          {/* Quota display is handled in parent or separate component, but for now static or passed props */}
        </div>
      </div>
      <div className="uag-cluster" id="radar-container">
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: '300px', height: '300px', border: '1px dashed #cbd5e1', borderRadius: '50%', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: '150px', height: '150px', border: '1px dashed #cbd5e1', borderRadius: '50%', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', left: '16px', top: '16px', background: 'rgba(255,255,255,0.9)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', color: '#0f172a', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', zIndex: 5 }}>
          <span style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', display: 'inline-block', marginRight: '4px' }}></span>
          <span style={{ fontWeight: 700 }}>Live 監控中</span>
        </div>

        {liveLeads.map(lead => {
          const x = lead.x != null ? lead.x : 50;
          const y = lead.y != null ? lead.y : 50;
          const size = lead.grade === 'S' ? 120 : lead.grade === 'A' ? 100 : lead.grade === 'B' ? 90 : lead.grade === 'C' ? 80 : 60;
          const floatDuration = (5 + Math.random() * 3) + 's';

          return (
            <div
              key={lead.id}
              className="uag-bubble"
              data-grade={lead.grade}
              style={{
                '--w': size + 'px',
                '--float': floatDuration,
                left: x + '%',
                top: y + '%'
              } as React.CSSProperties}
              onClick={() => onSelectLead(lead)}
            >
              <div className="grade-tag" style={{ background: `var(--grade-${lead.grade.toLowerCase()})`, color: '#fff' }}>{lead.grade}</div>
              <div style={{ textAlign: 'center', lineHeight: 1.2 }}>
                <div style={{ fontWeight: 800, fontSize: '14px' }}>{lead.id}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{lead.intent}%</div>
              </div>
              <div className="label">{lead.prop}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
