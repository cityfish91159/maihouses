import React from 'react';

export default function MascotHouse() {
  return (
    <svg viewBox="0 0 200 240" className="w-full h-full drop-shadow-sm transform hover:scale-105 transition-transform duration-300 text-brand">
      {/* M-Antenna */}
      <path d="M 85 40 L 85 15 L 100 30 L 115 15 L 115 40" 
            stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

      {/* House Body & Roof */}
      <path d="M 40 80 L 100 40 L 160 80" 
            stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="55" y="80" width="90" height="100" 
            stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

      {/* Eyebrows (Small) */}
      <path d="M 78 110 Q 85 105 92 110" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 108 110 Q 115 105 122 110" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
      
      {/* Eyes (Hollow circles) */}
      <circle cx="85" cy="125" r="4" stroke="currentColor" strokeWidth="3" fill="none" />
      <circle cx="115" cy="125" r="4" stroke="currentColor" strokeWidth="3" fill="none" />

      {/* Hands (Sticking out from sides) */}
      <path d="M 55 130 L 25 110" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M 145 130 L 175 110" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />

      {/* Legs (Walking) */}
      <path d="M 85 180 L 85 215 L 75 215" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 115 180 L 115 215 L 125 215" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
