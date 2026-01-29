import { render } from '@testing-library/react';
import { MaiMaiBase } from '../MaiMaiBase';

describe('MaiMaiBase mood transitions', () => {
  it('updates mood immediately and applies fade-in animation', () => {
    const { container, rerender } = render(
      <MaiMaiBase mood="idle" animated={false} showEffects={false} />
    );

    const svg = container.querySelector('svg');
    expect(svg?.dataset.mood).toBe('idle');
    expect(svg?.getAttribute('class')).toContain('animate-fadeIn');

    rerender(<MaiMaiBase mood="excited" animated={false} showEffects={false} />);

    const updatedSvg = container.querySelector('svg');
    expect(updatedSvg?.dataset.mood).toBe('excited');
    expect(updatedSvg?.getAttribute('class')).toContain('animate-fadeIn');
  });
});
