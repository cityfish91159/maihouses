import styles from './UAG.module.css';
import { UAGLandingHero } from './components/landing/UAGLandingHero';
import { UAGLandingFeatures } from './components/landing/UAGLandingFeatures';
import { UAGLandingSteps } from './components/landing/UAGLandingSteps';
import { UAGLandingCTA } from './components/landing/UAGLandingCTA';

export function UAGLandingPage() {
  return (
    <div className={styles['uag-page']}>
      <main className={styles['uag-container']}>
        <UAGLandingHero />
        <UAGLandingFeatures />
        <UAGLandingSteps />
        <UAGLandingCTA />
      </main>
    </div>
  );
}
