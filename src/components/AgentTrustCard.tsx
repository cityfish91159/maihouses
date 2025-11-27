import React from 'react';
import { Shield, ThumbsUp, Star } from 'lucide-react';
import { Agent } from '../lib/types';

interface AgentTrustCardProps {
  agent: Agent;
}

export const AgentTrustCard: React.FC<AgentTrustCardProps> = ({ agent }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
      <div className="flex items-start gap-4">
        <div className="relative">
          <img 
            src={agent.avatarUrl} 
            alt={agent.name} 
            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
          />
          <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-white">
            <Shield size={10} />
            <span>已認證</span>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                {agent.name}
                <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {agent.company}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">經紀人編號：#{agent.internalCode}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#003366]">
                <Star size={16} fill="currentColor" />
              </div>
              <div>
                <div className="text-sm font-bold text-[#003366]">{agent.trustScore}</div>
                <div className="text-[10px] text-slate-500">信任分</div>
              </div>
            </div>

            <div className="w-px h-8 bg-slate-100"></div>

            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500">
                <ThumbsUp size={16} />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-800">{agent.encouragementCount}</div>
                <div className="text-[10px] text-slate-500">獲得鼓勵</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-slate-50 flex gap-2">
        <button className="flex-1 bg-[#003366] text-white text-sm font-medium py-2 rounded-lg hover:bg-[#004488] transition-colors">
          聯絡經紀人
        </button>
        <button className="flex-1 bg-white border border-[#003366] text-[#003366] text-sm font-medium py-2 rounded-lg hover:bg-blue-50 transition-colors">
          預約看屋
        </button>
      </div>
    </div>
  );
};
