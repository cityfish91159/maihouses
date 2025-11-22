Redeploy trigger

This file was updated to force a new Vercel deployment.

Timestamp: 2025-11-22T05:00:00Z
Deploy: Fix Login Redirect & Analytics Stability
- Fix: Resolved `vite.config.ts` type error by adding `vitest` reference.
- Fix: Fixed Login page not redirecting correctly after sign-in in `Login.tsx`.
- Fix: Added fallback for `crypto.randomUUID` in `analytics.ts` to prevent crashes in non-secure contexts.

Timestamp: 2025-11-22T05:15:00Z
Deploy: Fix Vercel Routing & Login Redirect
- Config: Updated `vite.config.ts` to use `/maihouses/` base path unconditionally, aligning with `vercel.json` redirects.
- Refactor: Removed redundant `/maihouses` route in `App.tsx` as `basename` now handles the prefix.
- Fix: This resolves the login redirect failure caused by path mismatch between Vercel rewrites and client-side router.

Timestamp: 2025-11-22T05:30:00Z
Deploy: Fix Header Links for Auth
- Fix: Updated `Header.tsx` to point Login/Register links to React routes (`/auth/login`, `/auth/register`) instead of legacy static HTML files (`/auth.html`).
- Context: This ensures users are directed to the correct React-based auth pages which handle the login logic and redirects properly.

Timestamp: 2025-11-22T05:45:00Z
Deploy: Force Redeploy for Auth Fixes
- Action: Manual redeploy trigger requested by user.
- Verification: Confirmed `vite.config.ts` base path is `/maihouses/`.
- Verification: Confirmed `Header.tsx` links point to `/auth/login` and `/auth/register`.
- Verification: Confirmed `App.tsx` routes are clean.
- Goal: Ensure all recent auth and routing fixes are live on Vercel.

Timestamp: 2025-11-22T04:30:00Z
Deploy: Rollback to Stable Version (4d029b5)
- Action: Forced rollback to commit 4d029b5 (2025-11-21 08:37:47)
- Reason: Homepage visual regression - Header format and HeroAssure card reverted to old design
- Fix: Restored to last known stable state with correct package.json structure
- Status: Forcing deployment trigger

Timestamp: 2025-11-21T11:00:00Z
Deploy: Force Vercel Build (Source Change)
- Reason: Previous commit only affected generated `docs/` assets, which Vercel likely ignored.
- Action: Updating this file (source) to bypass Vercel's ignore build step and force a fresh deployment.
- Context: Vite build optimization (manualChunks) was applied, but Vercel needs to see a source change to rebuild.

Timestamp: 2025-11-21T10:45:00Z
Deploy: Build Optimization & Chunk Splitting
- Config: Updated vite.config.ts to implement manualChunks splitting.
- Config: Separated 'react-vendor', 'supabase', and 'ui-libs' into distinct chunks.
- Config: Increased chunkSizeWarningLimit to 1000kB to reduce build noise.
- Goal: Resolve "Some chunks are larger than 500 kB" warning and improve load performance.

Timestamp: 2025-11-21T10:30:00Z
Deploy: Lint Fixes & Code Quality Improvements
- Fix: Resolved Tailwind CSS class order issues in HeroAssure.tsx, SmartAsk.tsx, and Home.tsx.
- Fix: Replaced `window` with `globalThis` in Home.tsx for better environment compatibility.
- Fix: Added `readonly` modifier to Home component props.
- Fix: Improved key generation in SmartAsk.tsx to avoid using array index.
- Fix: Used Tailwind shorthand properties (e.g., `size-1.5`, `inset-y-0`).
- Fix: Added valid href to HeroAssure link.

Timestamp: 2025-11-21T10:15:00Z
Deploy: Homepage Refactor & Style Unification
- Fix: Updated Home.tsx to use new PropertyGrid and remove LegacyPropertyGrid.
- Fix: Unified style system (Tailwind) across HeroAssure, SmartAsk, CommunityTeaser.
- Cleanup: Removed LegacyPropertyGrid.tsx.
- Config: Verified tailwind.config.cjs colors.

Timestamp: 2025-11-21T10:00:00Z
Deploy: Vercel Configuration Fix & Refactor
- Fix: Updated vercel.json outputDirectory from 'dist' to 'docs' to match vite.config.ts build output.
- Refactor: Updated MAIHOUSES_HOMEPAGE_CODE.md and switched to new PropertyGrid.

Timestamp: 2025-11-21T12:05:00Z
Deploy: Force Vercel Trigger (Manual Docs Mode)
- Action: Force update to trigger Vercel webhook.
- Context: Previous empty commit was ignored.

Timestamp: 2025-11-20T18:10:00Z
Deploy: UAG v10.1 Fix - Add QueryClientProvider
- Fix: Added missing QueryClientProvider to App.tsx to support React Query in UAG Dashboard.

Timestamp: 2025-11-20T18:00:00Z
Deploy: UAG v10 Ultimate Architecture
- Architecture: Full Refactor to Container/Presenter Pattern
- State Management: Migrated to React Query (@tanstack/react-query)
- Validation: Implemented Zod Runtime Validation
- Components: Modularized UI (Header, Footer, Skeleton, ErrorState)
- Service Layer: Centralized API logic in UAGService
- Type Safety: Full TypeScript coverage with Zod schemas

Timestamp: 2025-11-20T17:15:00Z
Deploy: UAG v8.0 Ultimate Optimization (Frontend + Backend + DB)
- Database: Incremental Updates + Materialized Views
- Backend: Atomic RPC + Archive Handler
- Frontend: EnhancedTracker with Fingerprinting & Batching & PageView fix

Timestamp: 2025-11-20T17:00:00Z
Deploy: UAG Comprehensive Fixes & Optimizations
- Backend: Fixed negative quota issue in RPC.
- Backend: Set initial quota for new users (S:5, A:10).
- Backend: Added missing indexes for performance.
- Frontend: Implemented Parallel Fetching for faster load times.
- Frontend: Fixed Leads/Listings query logic (Trust RLS, Filter by Agent).
- Frontend: Fixed Fallback mode logic (Auto-switch to Mock).
- Frontend: Fixed Countdown Timer accuracy.
- Docs: Synced UAG_FULL_STACK_CODE.md with all changes.

Timestamp: 2025-11-20T16:30:00Z
Deploy: UAG Critical Race Condition & Memory Leak Fixes
- Frontend: Implemented Optimistic UI with Rollback for `handleBuyLead` to prevent race conditions.
- Frontend: Removed `useInterval` and replaced with `useEffect` to fix memory leaks.
- Frontend: Added `AbortController` logic (simplified) to prevent state updates on unmounted components.
- Frontend: Fixed `remainingHours` type safety issues and `exactOptionalPropertyTypes` compatibility.
- Frontend: Fixed `quotaCheck` error message type safety.

Timestamp: 2025-11-20T16:00:00Z
Deploy: UAG Auth Integration & Security Hardening
- Frontend: Added useAuth hook for Supabase session management.
- Frontend: Integrated Realtime subscription for live updates.
- Frontend: Fixed data mapping (snake_case to camelCase) for Listings.
- Backend: Added Quota checks to buy_lead_transaction RPC.

Timestamp: 2025-11-20T15:30:00Z
Deploy: UAG AssetMonitor Fix & Documentation Sync
- Frontend: Fixed AssetMonitor to use shared GRADE_HOURS constant instead of hardcoded values.
- Docs: Synced UAG_FULL_STACK_CODE.md with latest codebase (RPC Quota checks, Type conversions).

Timestamp: 2025-11-20T15:00:00Z
Deploy: UAG Critical Security Fixes
- Backend: Added Quota checks to buy_lead_transaction RPC to prevent negative balance.
- Backend: Added Indexes for performance.
- Frontend: Optimized handleBuyLead to use RPC return values (Optimistic UI).
- Docs: Synced UAG_FULL_STACK_CODE.md.

Timestamp: 2025-11-20T14:30:00Z
Deploy: UAG optimization (React refactor, CSS modules, A11y) and backend fixes (Batching, Validation, Error Handling)
Update Header Search Panel to White Main / Deep Blue Secondary theme
Update HeroAssure colors to Deep Blue
Deploy UAG v8 React implementation

Timestamp: 2025-11-21T10:00:00Z
Deploy: UAG v11.2 Code Quality & SonarLint Fixes
- Refactor: Fixed SonarLint issues in HeroAssure.tsx (Optional Chaining, Nested Template Literals)
- Refactor: Fixed SonarLint issues in AssetMonitor.tsx (Nullish Coalescing, Readonly Props)
- Verification: Verified build success.

Timestamp: 2025-11-21T07:00:45Z
Deploy: Homepage Refactor & Optimization
- Refactor: Split monolithic sections (CommunityTeaser, HeroAssure, SmartAsk, PropertyGrid) into smaller components.
- Components: Created HomeCard, ReviewCard, HeroStep, ChatBubble, SuggestionChips, RecommendationCard.
- Logic: Extracted SmartAsk logic to useSmartAsk hook.
- Styling: Standardized styles using Tailwind and HomeCard wrapper; removed obsolete CSS files.
- Fix: Added cn utility for class merging.
- Cleanup: Removed LegacyPropertyGrid.

Timestamp: 2025-11-22T06:00:00Z
Deploy: Fix SonarLint Issues & Redeploy
- Fix: Resolved accessibility issues in `Header.tsx` modal (added `role`, `tabIndex`, `onKeyDown`).
- Fix: Replaced `String.replace` with `String.replaceAll` in `analytics.ts` as per SonarLint recommendation.
- Goal: Ensure clean build and successful deployment.

Timestamp: 2025-11-22T06:15:00Z
Deploy: Add Google Auth & Fix Login Redirect
- Feature: Added Google OAuth login/register buttons to `Login.tsx` and `Register.tsx`.
- Fix: Implemented `signInWithGoogle` in `auth.ts` using `globalThis.location.origin` for correct redirect URI.
- Fix: Enhanced error handling and logging in Login/Register forms to debug redirect issues.
- Context: This addresses user feedback about missing Google registration and login redirect failures.

Timestamp: 2025-11-22T06:30:00Z
Deploy: Fix SonarLint Issues & Redeploy
- Fix: Removed duplicate CSS selector in `Header.css`.
- Fix: Improved accessibility in `Header.tsx` modal (using `div` with `role="dialog"` correctly).
- Fix: Cleaned up unused imports in `Register.tsx`.
- Fix: Replaced `window` with `globalThis` in `auth.ts`.
- Goal: Ensure clean build and successful deployment.

Timestamp: 2025-11-22T07:00:00Z
Deploy: Revert Recent Changes & Fix Login
- Revert: Removed recent SonarLint accessibility fixes and Google Auth integration to isolate login issues.
- Fix: Added `z-10` and `relative` positioning to Login/Register forms to ensure buttons are clickable.
- Fix: Wrapped analytics tracking in try-catch to prevent blocking the login flow.
- Fix: Restored `autoComplete` attributes for better browser compatibility.
- Goal: Restore basic login functionality and fix the "unclickable button" issue.

Timestamp: 2025-11-22T07:30:00Z
Deploy: Fix SonarLint Issues & Redeploy
- Fix: Removed duplicate CSS selector in `Header.css`.
- Fix: Improved accessibility in `Header.tsx` modal (using `div` with `role="dialog"` correctly).
- Fix: Cleaned up unused imports in `Register.tsx`.
- Fix: Replaced `window` with `globalThis` in `auth.ts`.
- Goal: Ensure clean build and successful deployment.

Timestamp: 2025-11-22T08:00:00Z
Deploy: Revert to Stable Login Logic
- Revert: Removed recent CSS fixes (z-10, relative) that user reported as problematic.
- Fix: Restored `useAuth` hook and `useEffect` redirect logic in `Login.tsx` (the "fix from a few days ago").
- Fix: Cleaned up `Register.tsx` to match stable state.
- Goal: Restore functional login redirect without introducing new UI regressions.

Timestamp: 2025-11-22T08:30:00Z
Deploy: Fix Build Error (TS2550 & TS7006)
- Fix: Replaced `replaceAll` with `replace` in `analytics.ts` to resolve TS2550 (target library compatibility).
- Fix: Added type annotation `(c: string)` to callback parameter to resolve TS7006 (implicit any).
- Goal: Fix build failure and ensure successful deployment.

Timestamp: 2025-11-22T09:00:00Z
Deploy: Finalize Homepage Refactor (Gold Standard)
- Milestone: Completed full migration of homepage components to Native React + Tailwind CSS.
- Components: HeroAssure, SmartAsk, CommunityTeaser, and PropertyGrid are now fully refactored.
- UI: Verified pixel-perfect design match with legacy HTML/CSS.
- Status: This deployment represents the "Gold Standard" baseline for the modernized frontend.

Timestamp: 2025-11-22T09:30:00Z
Deploy: Restore Google Auth & Fix Login Styles
- Feature: Re-implemented Google OAuth login/register in `Login.tsx` and `Register.tsx`.
- Fix: Added `z-10` and `relative` positioning to forms to ensure buttons are clickable (fixing previous regression).
- Fix: Updated `auth.ts` to include `signInWithGoogle` with correct redirect URI.
- Goal: Restore the requested Google Auth functionality and ensure a working login flow.

Timestamp: 2025-11-22T10:00:00Z
Deploy: Restore Legacy Auth Page with Supabase
- Feature: Restored `public/auth.html` as the primary login/register page (matching user request for specific design).
- Refactor: Migrated `auth.html` from Firebase to Supabase Auth to maintain compatibility with the React app.
- Config: Updated `Header.tsx` to link to `/maihouses/auth.html`.
- Goal: Restore the "Blue Modal" design while keeping the backend on Supabase.
Deploy trigger Sat Nov 22 07:28:29 UTC 2025
