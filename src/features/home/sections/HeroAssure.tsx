import React from 'react';
import { ScanEye, HandCoins, Phone, MessageSquareText, Landmark, ShieldCheck, KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function HeroAssure() {
  const steps = [
    { 
      id: '01',
      title: '已電聯', 
      desc: '紀錄談話內容',
      icon: <Phone size={20} />,
    },
    { 
      id: '02',
      title: '已帶看', 
      desc: '賞屋重點紀錄',
      icon: <ScanEye size={20} />,
    },
    { 
      id: '03',
      title: '已出價', 
      desc: '紀錄價格條件',
      icon: <HandCoins size={20} />,
    },
    { 
      id: '04',
      title: '已斡旋', 
      desc: '議價過程紀錄',
      icon: <MessageSquareText size={20} />,
    },
    { 
      id: '05',
      title: '已成交', 
      desc: '貸款相關事項',
      icon: <Landmark size={20} />,
    },
    { 
      id: '06',
      title: '已交屋', 
      desc: '確認圓滿交屋',
      icon: <KeyRound size={20} />,
    },
  ];

  return (
    <section className="bg-gradient-to-br from-white to-[#f0f7ff] border border-[#E6EDF7] rounded-[32px] p-6 md:p-10 shadow-sm relative overflow-hidden group/container">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 mb-10 relative z-10">
        
        {/* Mascot: Wireframe House */}
        <div className="w-28 h-32 shrink-0 relative">
             <svg viewBox="0 0 200 240" className="w-full h-full drop-shadow-sm transform hover:scale-105 transition-transform duration-300">
               {/* M-Antenna */}
               <path d="M 85 40 L 85 15 L 100 30 L 115 15 L 115 40" 
                     stroke="#00385a" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

               {/* House Body & Roof */}
               <path d="M 40 80 L 100 40 L 160 80" 
                     stroke="#00385a" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
               <rect x="55" y="80" width="90" height="100" 
                     stroke="#00385a" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

               {/* Eyebrows (Small) */}
               <path d="M 78 110 Q 85 105 92 110" stroke="#00385a" strokeWidth="4" fill="none" strokeLinecap="round" />
               <path d="M 108 110 Q 115 105 122 110" stroke="#00385a" strokeWidth="4" fill="none" strokeLinecap="round" />
               
               {/* Eyes (Hollow circles) */}
               <circle cx="85" cy="125" r="4" stroke="#00385a" strokeWidth="3" fill="none" />
               <circle cx="115" cy="125" r="4" stroke="#00385a" strokeWidth="3" fill="none" />

               {/* Hands (Sticking out from sides) */}
               <path d="M 55 130 L 25 110" stroke="#00385a" strokeWidth="5" fill="none" strokeLinecap="round" />
               <path d="M 145 130 L 175 110" stroke="#00385a" strokeWidth="5" fill="none" strokeLinecap="round" />

               {/* Legs (Walking) */}
               <path d="M 85 180 L 85 215 L 75 215" stroke="#00385a" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
               <path d="M 115 180 L 115 215 L 125 215" stroke="#00385a" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
             </svg>
        </div>

        {/* Text Content */}
        <div className="text-center md:text-left flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00385a]/20 bg-[#F6F9FF] text-[#00385a] text-xs font-bold mb-3">
            <ShieldCheck size={14} />
            <span>全程透明．安心留痕</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-[#00385a] mb-3 tracking-tight">
            安心留痕保障
          </h3>
          <p className="text-[#6C7B91] font-medium text-sm md:text-base leading-relaxed max-w-2xl">
            介紹改從第一次電話聯絡開始，買賣雙方的每一通聯絡紀錄、每一句承諾與每項協議，
            都會經過雙方確認並完整留痕。<br className="hidden md:block"/>
            讓整個交易過程都有跡可循，保障雙方權益，直到圓滿交屋。
          </p>
        </div>
        
        <a href="#" className="hidden md:flex shrink-0 items-center gap-2 px-5 py-2.5 rounded-xl bg-white border-2 border-[#00385a] text-[#00385a] font-bold text-sm hover:bg-[#00385a] hover:text-white transition-all shadow-sm">
          履保規範 <ArrowRight size={16} />
        </a>
      </div>

      {/* Process Timeline */}
      <div className="relative mt-4 pl-2 md:pl-0">
        
        {/* Connecting Line (Desktop Horizontal) - Centered at top-8 (32px) to align with 48px circle center + 8px padding */}
        <div className="hidden md:block absolute top-8 left-0 w-full h-0.5 bg-[#E6EDF7] -z-0"></div>
        
        {/* Connecting Line (Mobile Vertical) - Centered at left-8 (32px) */}
        <div className="md:hidden absolute left-8 top-0 bottom-0 w-0.5 bg-[#E6EDF7] -z-0"></div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 md:gap-2">
          {steps.map((step, index) => (
            <div key={step.id} className="group relative flex md:flex-col items-center md:items-center gap-4 md:gap-4 p-2 rounded-xl hover:bg-[#F6F9FF] transition-colors duration-300 cursor-default">
                
                {/* Icon Circle */}
                <div className="relative z-10 flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-white border-2 border-[#E6EDF7] text-[#6C7B91] flex items-center justify-center group-hover:border-[#00385a] group-hover:text-[#00385a] group-hover:scale-110 transition-all duration-300 shadow-sm">
                        {step.icon}
                    </div>
                    {/* Step Number Badge */}
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#00385a] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                        {index + 1}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 md:text-center">
                    <h4 className="text-base font-black text-[#0A2246] mb-1 group-hover:text-[#00385a] transition-colors">
                        {step.title}
                    </h4>
                    <p className="text-xs text-[#6C7B91] font-medium leading-relaxed">
                        {step.desc}
                    </p>
                </div>

                {/* Mobile Arrow (Visual aid) */}
                <div className="md:hidden ml-auto text-[#E6EDF7] group-hover:text-[#00385a] transition-colors">
                     {index < steps.length - 1 && <CheckCircle2 size={16} className="opacity-0 group-hover:opacity-20"/>}
                </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
