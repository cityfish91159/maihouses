import { ROUTES } from '../../../../constants/routes';
import { getSignupUrl, getAuthUrl } from '../../../../lib/authUtils';
import styles from '../../UAG.module.css';

export function UAGLandingHero() {
  const signupHref = getSignupUrl(ROUTES.UAG, 'agent');
  const loginHref = getAuthUrl('login', ROUTES.UAG);

  return (
    <section className={styles['landing-hero']}>
      <h1 className={styles['landing-title']}>UAG 精準導客雷達</h1>
      <p className={styles['landing-subtitle']}>
        AI 分析消費者瀏覽行為，為你精準配對潛力買家
      </p>

      <div className={styles['landing-actions']}>
        <a
          href={signupHref}
          className={`${styles['uag-btn']} ${styles['primary']}`}
        >
          成為合作房仲
        </a>
        <a href={loginHref} className={styles['uag-btn']}>
          已有帳號？登入
        </a>
      </div>
    </section>
  );
}
