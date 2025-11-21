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
    <section className="group/container relative overflow-hidden rounded-[32px] border border-[#E6EDF7] bg-gradient-to-br from-white to-[#f0f7ff] p-6 shadow-sm md:p-10">
      
      {/* Header Area */}
      <div className="relative z-10 mb-10 flex flex-col items-center gap-6 md:flex-row md:gap-10">
        
        {/* Mascot: Wireframe House */}
        <div className="relative h-32 w-28 shrink-0">
             <svg viewBox="0 0 200 240" className="size-full drop-shadow-sm transition-transform duration-300 hover:scale-105">
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
        <div className="flex-1 text-center md:text-left">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#00385a]/20 bg-[#F6F9FF] px-3 py-1 text-xs font-bold text-[#00385a]">
            <ShieldCheck size={14} />
            <span>全程透明．安心留痕</span>
          </div>
          <h3 className="mb-3 text-2xl font-black tracking-tight text-[#00385a] md:text-3xl">
            安心留痕保障
          </h3>
          <p className="max-w-2xl text-sm font-medium leading-relaxed text-[#6C7B91] md:text-base">
            介紹改從第一次電話聯絡開始，買賣雙方的每一通聯絡紀錄、每一句承諾與每項協議，
            都會經過雙方確認並完整留痕。<br className="hidden md:block"/>
            讓整個交易過程都有跡可循，保障雙方權益，直到圓滿交屋。
          </p>
        </div>
        
        <button type="button" className="hidden shrink-0 items-center gap-2 rounded-xl border-2 border-[#00385a] bg-white px-5 py-2.5 text-sm font-bold text-[#00385a] shadow-sm transition-all hover:bg-[#00385a] hover:text-white md:flex">
          履保規範 <ArrowRight size={16} />
        </button>
      </div>

      {/* Process Timeline */}
      <div className="relative mt-4 pl-2 md:pl-0">
        
        {/* Connecting Line (Desktop Horizontal) - Centered at top-8 (32px) to align with 48px circle center + 8px padding */}
        <div className="hidden h-0.5 w-full bg-[#E6EDF7] md:absolute md:left-0 md:top-8 md:-z-0 md:block"></div>
        
        {/* Connecting Line (Mobile Vertical) - Centered at left-8 (32px) */}
        <div className="absolute inset-y-0 left-8 -z-0 w-0.5 bg-[#E6EDF7] md:hidden"></div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-6 md:gap-2">
          {steps.map((step, index) => (
            <div key={step.id} className="group relative flex cursor-default items-center gap-4 rounded-xl p-2 transition-colors duration-300 hover:bg-[#F6F9FF] md:flex-col md:items-center md:gap-4">
                
                {/* Icon Circle */}
                <div className="relative z-10 shrink-0">
                    <div className="flex size-12 items-center justify-center rounded-full border-2 border-[#E6EDF7] bg-white text-[#6C7B91] shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:border-[#00385a] group-hover:text-[#00385a]">
                        {step.icon}
                    </div>
                    {/* Step Number Badge */}
                    <div className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#00385a] text-[10px] font-bold text-white ring-2 ring-white">
                        {index + 1}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 md:text-center">
                    <h4 className="mb-1 text-base font-black text-[#0A2246] transition-colors group-hover:text-[#00385a]">
                        {step.title}
                    </h4>
                    <p className="text-xs font-medium leading-relaxed text-[#6C7B91]">
                        {step.desc}
                    </p>
                </div>

                {/* Mobile Arrow (Visual aid) */}
                <div className="ml-auto text-[#E6EDF7] transition-colors group-hover:text-[#00385a] md:hidden">
                     {index < steps.length - 1 && <CheckCircle2 size={16} className="opacity-0 group-hover:opacity-20"/>}
                </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
