import { render, screen } from '@testing-library/react';
import { PropertyGallery } from '../PropertyGallery';

describe('PropertyGallery motion a11y', () => {
  it('主圖與縮圖切換按鈕應帶 reduced-motion transition class', () => {
    const { container } = render(
      <PropertyGallery
        images={['https://example.com/p1.jpg', 'https://example.com/p2.jpg']}
        title="測試物件"
        onPhotoClick={vi.fn()}
        fallbackImage="https://example.com/fallback.jpg"
      />
    );

    const mainImage = screen.getByRole('img', { name: '測試物件' });
    expect(mainImage.className).toContain('motion-reduce:transition-none');

    const thumbnailButtons = container.querySelectorAll('button');
    expect(thumbnailButtons.length).toBeGreaterThan(0);
    expect(thumbnailButtons[0]?.className).toContain('motion-reduce:transition-none');
  });
});

