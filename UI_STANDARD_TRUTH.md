# UI Standard Truth (Demonstration Standard)

This document defines the "Gold Standard" for the MaiHouses UI components. All future changes must maintain visual fidelity with these specifications.

## 1. Property Grid (Intelligent Recommendation)
**Status**: ✅ Refactored to Native React (Tailwind CSS)
**Source of Truth**: `src/features/home/sections/PropertyGrid.tsx`
**Legacy Source**: `public/maihouses_list_noheader.html` (Reference only)

### Key Design Tokens
- **Header Gradient**: `bg-gradient-to-b from-[#00385a] to-[#004E7C]` (Star Icon)
- **Animation**: `animate-[mhRecoBar_6s_linear_infinite]` (Gradient progress bar)
- **Card Shadow**: 
  - Default: `shadow-none`
  - Hover: `shadow-[0_10px_26px_rgba(13,39,94,0.12)]`
- **Card Border**:
  - Default: `border-[#E6EDF7]`
  - Hover: `border-[#1749d738]`
- **Typography**:
  - Price: `text-[19px] font-black text-[#111]`
  - Title: `text-[21px] font-extrabold text-[#0A2246]`

## 2. Hero Assure (安心留痕)
**Status**: ✅ Refactored
**Source**: `src/features/home/sections/HeroAssure.tsx`
**Key Features**:
- Lucide Icons (`ShieldCheck`)
- Mascot SVG integration
- Responsive layout (Stack on mobile, Row on desktop)

## 3. Smart Ask (鄰居管家)
**Status**: ✅ Refactored
**Source**: `src/features/home/sections/SmartAsk.tsx`
**Key Features**:
- Chat interface with auto-scroll
- Suggestion chips
- Streaming response simulation

## 4. Community Teaser (社區評價)
**Status**: ✅ Refactored
**Source**: `src/features/home/sections/CommunityTeaser.tsx`
**Key Features**:
- Backdrop blur effect (`bg-white/96 backdrop-blur-md`)
- Grid layout for review cards

## 5. Header & Navigation
**Status**: ✅ Refactored
**Source**: `src/components/Header/Header.tsx`
**Key Features**:
- Sticky positioning
- Responsive menu
- Marquee integration

---
*Last Updated: 2025-11-22*
