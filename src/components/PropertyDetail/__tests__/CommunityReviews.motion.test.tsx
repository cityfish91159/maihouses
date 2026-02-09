import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CommunityReviews } from '../CommunityReviews';

describe('CommunityReviews motion a11y', () => {
  it('骨架 loading 動畫應帶 reduced-motion 保護', () => {
    const { container } = render(
      <MemoryRouter>
        <CommunityReviews isLoggedIn={false} />
      </MemoryRouter>
    );

    const skeleton = container.querySelector('.h-96');
    expect(skeleton).not.toBeNull();
    expect(skeleton?.className).toContain('animate-pulse');
    expect(skeleton?.className).toContain('motion-reduce:animate-none');
  });
});
