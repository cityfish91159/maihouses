import { motionA11y, withMotionSafety } from './motionA11y';

describe('motionA11y', () => {
  it('withMotionSafety: animate + transition 應補齊 reduced-motion class', () => {
    const className = withMotionSafety('animate-bounce transition-all', {
      animate: true,
      transition: true,
    });

    expect(className).toContain('animate-bounce');
    expect(className).toContain('transition-all');
    expect(className).toContain('motion-reduce:animate-none');
    expect(className).toContain('motion-reduce:transition-none');
  });

  it('預設 presets 應包含對應 reduced-motion class', () => {
    expect(motionA11y.pulse).toContain('motion-reduce:animate-none');
    expect(motionA11y.bounce).toContain('motion-reduce:animate-none');
    expect(motionA11y.transitionAll).toContain('motion-reduce:transition-none');
    expect(motionA11y.transitionColors).toContain('motion-reduce:transition-none');
    expect(motionA11y.transitionTransform).toContain('motion-reduce:transition-none');
    expect(motionA11y.transitionOpacity).toContain('motion-reduce:transition-none');
  });
});
