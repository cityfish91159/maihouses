import { LogIn, List, UserPlus } from 'lucide-react';
import { Logo } from '../../components/Logo/Logo';
import { ROUTES } from '../../constants/routes';
import { getLoginUrl, getSignupUrl, getCurrentPath } from '../../lib/authUtils';
import styles from './UAG.module.css';
import { UAGLandingHero } from './components/landing/UAGLandingHero';
import { UAGLandingFeatures } from './components/landing/UAGLandingFeatures';
import { UAGLandingSteps } from './components/landing/UAGLandingSteps';
import { UAGLandingCTA } from './components/landing/UAGLandingCTA';

export function UAGLandingPage() {
  const authReturnPath = getCurrentPath();
  const loginUrl = getLoginUrl(authReturnPath);
  const signupUrl = getSignupUrl(authReturnPath);

  return (
    <div className={styles['uag-landing-page']}>
      <header className="sticky top-0 z-50 border-b border-brand-100 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-4">
          <Logo showSlogan={false} showBadge={true} href={ROUTES.HOME} />
          <nav className="flex items-center gap-1 md:gap-2">
            <a
              href={ROUTES.PROPERTY_LIST}
              className="hover:bg-brand-50/80 hidden items-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-bold text-brand-700 transition-all hover:text-brand-600 active:scale-[0.98] md:flex"
            >
              <List size={18} strokeWidth={2.5} className="opacity-80" />
              <span>房地產列表</span>
            </a>
            <a
              href={loginUrl}
              className="hover:bg-brand-50/80 flex items-center gap-2 rounded-xl px-3 py-2.5 text-[15px] font-bold text-brand-700 transition-all hover:text-brand-600 active:scale-[0.98] md:px-4"
            >
              <LogIn size={18} strokeWidth={2.5} className="opacity-80" />
              <span className="hidden md:inline">登入</span>
            </a>
            <a
              href={signupUrl}
              className="shadow-brand-700/10 hover:shadow-brand-700/20 ml-1 flex items-center gap-2 rounded-xl border border-transparent bg-brand-700 px-4 py-2.5 text-[15px] font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-lg active:scale-[0.98] md:px-5"
            >
              <UserPlus size={18} strokeWidth={2.5} />
              <span className="hidden md:inline">免費註冊</span>
              <span className="md:hidden">註冊</span>
            </a>
          </nav>
        </div>
      </header>
      <main className={styles['uag-landing-container']}>
        <UAGLandingHero />
        <UAGLandingFeatures />
        <UAGLandingSteps />
        <UAGLandingCTA />
      </main>
    </div>
  );
}
