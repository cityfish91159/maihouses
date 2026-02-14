import { notify } from '../../../../lib/notify';
import { setDemoMode, reloadPage } from '../../../../lib/pageMode';
import styles from '../../UAG.module.css';

export function UAGLandingCTA() {
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
      <h2 className={styles['landing-cta-title']}>先看看再決定？</h2>
      <p className={styles['landing-cta-desc']}>
        不用註冊，直接體驗完整後台介面
      </p>

      <div className={styles['landing-actions']}>
        <button
          type="button"
          onClick={handleTryDemo}
          className="shadow-brand-700/10 hover:shadow-brand-700/20 inline-flex min-h-[44px] w-full max-w-[280px] cursor-pointer items-center justify-center rounded-xl bg-brand-700 px-6 py-2.5 text-[15px] font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-lg active:scale-[0.98]"
        >
          免費體驗演示
        </button>
      </div>
    </section>
  );
}
