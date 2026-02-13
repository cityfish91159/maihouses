import { ROUTES } from '../../../../constants/routes';
import { getSignupUrl } from '../../../../lib/authUtils';
import { notify } from '../../../../lib/notify';
import { setDemoMode, reloadPage } from '../../../../lib/pageMode';
import styles from '../../UAG.module.css';

export function UAGLandingCTA() {
  const signupHref = getSignupUrl(ROUTES.UAG, 'agent');

  const handleTryDemo = () => {
    const ok = setDemoMode();
    if (!ok) {
      notify.error('無法進入演示模式', '您的瀏覽器不支援本地儲存，請關閉私密瀏覽後重試。');
      return;
    }
    reloadPage();
  };

  return (
    <section className={styles['landing-cta']}>
      <h2 className={styles['landing-cta-title']}>準備好提升業績了嗎？</h2>
      <p className={styles['landing-cta-desc']}>
        立即加入 MaiHouses，讓 AI 幫你找到最有意願的買家。
      </p>

      <div className={styles['landing-actions']}>
        <a
          href={signupHref}
          className={`${styles['uag-btn']} ${styles['primary']}`}
        >
          成為合作房仲
        </a>
        <button type="button" className={styles['uag-btn']} onClick={handleTryDemo}>
          免費體驗 Demo
        </button>
      </div>
    </section>
  );
}
