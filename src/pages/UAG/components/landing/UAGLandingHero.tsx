import { ROUTES } from '../../../../constants/routes';
import { getSignupUrl, getAuthUrl } from '../../../../lib/authUtils';
import styles from '../../UAG.module.css';

export function UAGLandingHero() {
  const signupHref = getSignupUrl(ROUTES.UAG, 'agent');
  const loginHref = getAuthUrl('login', ROUTES.UAG);

  return (
    <section className={styles['landing-hero']}>
      <h1 className={styles['landing-title']}>房仲專區</h1>
      <p className={styles['landing-subtitle']}>
        買家在看哪間房、看了多久、有沒有點聯絡，
        <br className="hidden sm:inline" />
        系統幫你整理好，直接告訴你該聯絡誰。
      </p>

      <div className={styles['landing-actions']}>
        <a
          href={signupHref}
          className="shadow-brand-700/10 hover:shadow-brand-700/20 inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl bg-brand-700 px-6 py-2.5 text-[15px] font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-lg active:scale-[0.98]"
        >
          成為合作房仲
        </a>
        <a
          href={loginHref}
          className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl border border-brand-100 bg-white px-6 py-2.5 text-[15px] font-bold text-brand-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-700 hover:shadow-md active:scale-[0.98]"
        >
          已有帳號？登入
        </a>
      </div>
    </section>
  );
}
