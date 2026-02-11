import { fireEvent, render, screen } from '@testing-library/react';
import { PropertyGallery } from '../PropertyGallery';

const fallbackImage = 'https://example.com/fallback.jpg';
const galleryTitle = 'Test Property';

function swipe(
  touchSurface: HTMLElement,
  startX: number,
  moveX: number,
  startY = 120,
  moveY = 120
) {
  fireEvent.touchStart(touchSurface, {
    touches: [{ clientX: startX, clientY: startY }],
  });
  fireEvent.touchMove(touchSurface, {
    touches: [{ clientX: moveX, clientY: moveY }],
  });
  fireEvent.touchEnd(touchSurface);
}

function setupGallery(images: string[], onPhotoClick = vi.fn()) {
  const view = render(
    <PropertyGallery
      images={images}
      title={galleryTitle}
      onPhotoClick={onPhotoClick}
      fallbackImage={fallbackImage}
    />
  );

  const mainImage = screen.getByRole('img', { name: galleryTitle }) as HTMLImageElement;
  const touchSurface = mainImage.parentElement;
  expect(touchSurface).not.toBeNull();
  if (!touchSurface) {
    throw new Error('touch surface is required');
  }

  return { ...view, mainImage, touchSurface, onPhotoClick };
}

describe('PropertyGallery motion and swipe', () => {
  it('uses pan-y touch surface so vertical page scroll stays available', () => {
    setupGallery(['https://example.com/p1.jpg', 'https://example.com/p2.jpg']);

    const touchSurface = screen.getByTestId('gallery-touch-surface');
    expect(touchSurface.className).toContain('touch-pan-y');
  });

  it('shows skeleton before image load and hides skeleton after load', () => {
    const { mainImage } = setupGallery(['https://example.com/p1.jpg', 'https://example.com/p2.jpg']);

    expect(screen.getByTestId('gallery-main-skeleton')).toBeInTheDocument();

    fireEvent.load(mainImage);
    expect(screen.queryByTestId('gallery-main-skeleton')).not.toBeInTheDocument();
  });

  it('uses 64x96 thumbnails with horizontal scroll snap', () => {
    const { container } = setupGallery([
      'https://example.com/p1.jpg',
      'https://example.com/p2.jpg',
      'https://example.com/p3.jpg',
    ]);

    const thumbnailRail = container.querySelector('div.snap-x.snap-mandatory');
    expect(thumbnailRail).not.toBeNull();

    const thumbnailButtons = container.querySelectorAll('button[aria-pressed]');
    expect(thumbnailButtons).toHaveLength(3);
    expect(thumbnailButtons[0]?.className).toContain('h-16');
    expect(thumbnailButtons[0]?.className).toContain('w-24');
    expect(thumbnailButtons[0]?.className).toContain('snap-center');
  });

  it('applies reduced-motion transition classes to image and thumbnails', () => {
    const { container } = setupGallery([
      'https://example.com/p1.jpg',
      'https://example.com/p2.jpg',
    ]);

    const mainImage = screen.getByRole('img', { name: galleryTitle });
    expect(mainImage.className).toContain('motion-reduce:transition-none');

    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
    expect(buttons[0]?.className).toContain('motion-reduce:transition-none');
  });

  it('adds aria-label and aria-pressed for thumbnails', () => {
    const { container } = setupGallery([
      'https://example.com/p1.jpg',
      'https://example.com/p2.jpg',
    ]);

    const thumbnailButtons = container.querySelectorAll('button[aria-pressed]');
    expect(thumbnailButtons).toHaveLength(2);
    expect(thumbnailButtons[0]).toHaveAttribute('aria-pressed', 'true');
    expect(thumbnailButtons[0]).toHaveAttribute('aria-label');
    expect(thumbnailButtons[1]).toHaveAttribute('aria-pressed', 'false');
    expect(thumbnailButtons[1]).toHaveAttribute('aria-label');
  });

  it('supports swipe left and right to switch photos', () => {
    const { mainImage, touchSurface, onPhotoClick } = setupGallery([
      'https://example.com/p1.jpg',
      'https://example.com/p2.jpg',
    ]);

    expect(mainImage.src).toContain('/p1.jpg');

    swipe(touchSurface, 260, 110);
    expect(mainImage.src).toContain('/p2.jpg');

    swipe(touchSurface, 120, 280);
    expect(mainImage.src).toContain('/p1.jpg');

    expect(onPhotoClick).toHaveBeenCalledTimes(2);
  });

  it('does not switch when horizontal distance equals threshold', () => {
    const { mainImage, touchSurface, onPhotoClick } = setupGallery([
      'https://example.com/p1.jpg',
      'https://example.com/p2.jpg',
    ]);

    swipe(touchSurface, 200, 150);

    expect(mainImage.src).toContain('/p1.jpg');
    expect(onPhotoClick).not.toHaveBeenCalled();
  });

  it('does not switch on mostly vertical gesture even when horizontal delta is large', () => {
    const { mainImage, touchSurface, onPhotoClick } = setupGallery([
      'https://example.com/p1.jpg',
      'https://example.com/p2.jpg',
    ]);

    swipe(touchSurface, 220, 140, 120, 260);

    expect(mainImage.src).toContain('/p1.jpg');
    expect(onPhotoClick).not.toHaveBeenCalled();
  });

  it('does not switch when swipe distance is below threshold', () => {
    const { mainImage, touchSurface, onPhotoClick } = setupGallery([
      'https://example.com/p1.jpg',
      'https://example.com/p2.jpg',
    ]);

    swipe(touchSurface, 200, 160);

    expect(mainImage.src).toContain('/p1.jpg');
    expect(onPhotoClick).not.toHaveBeenCalled();
  });

  it('prevents swiping beyond first image', () => {
    const { mainImage, touchSurface, onPhotoClick } = setupGallery([
      'https://example.com/p1.jpg',
      'https://example.com/p2.jpg',
    ]);

    swipe(touchSurface, 100, 260);

    expect(mainImage.src).toContain('/p1.jpg');
    expect(onPhotoClick).not.toHaveBeenCalled();
  });

  it('prevents swiping beyond last image', () => {
    const { mainImage, touchSurface, onPhotoClick } = setupGallery([
      'https://example.com/p1.jpg',
      'https://example.com/p2.jpg',
    ]);

    swipe(touchSurface, 280, 120);
    expect(mainImage.src).toContain('/p2.jpg');

    swipe(touchSurface, 280, 120);
    expect(mainImage.src).toContain('/p2.jpg');
    expect(onPhotoClick).toHaveBeenCalledTimes(1);
  });

  it('disables swipe when there is only one image', () => {
    const { mainImage, touchSurface, onPhotoClick } = setupGallery(['https://example.com/p1.jpg']);

    swipe(touchSurface, 280, 90);

    expect(mainImage.src).toContain('/p1.jpg');
    expect(onPhotoClick).not.toHaveBeenCalled();
  });

  it('handles empty touches safely', () => {
    const { mainImage, touchSurface, onPhotoClick } = setupGallery([
      'https://example.com/p1.jpg',
      'https://example.com/p2.jpg',
    ]);

    fireEvent.touchStart(touchSurface, { touches: [] });
    fireEvent.touchMove(touchSurface, { touches: [] });
    fireEvent.touchEnd(touchSurface);

    expect(mainImage.src).toContain('/p1.jpg');
    expect(onPhotoClick).not.toHaveBeenCalled();
  });

  it('shows skeleton again when switching to another image', () => {
    const { mainImage } = setupGallery(['https://example.com/p1.jpg', 'https://example.com/p2.jpg']);

    fireEvent.load(mainImage);
    expect(screen.queryByTestId('gallery-main-skeleton')).not.toBeInTheDocument();

    const nextButton = screen.getByRole('button', { name: '下一張照片' });
    fireEvent.click(nextButton);

    expect(mainImage.src).toContain('/p2.jpg');
    expect(screen.getByTestId('gallery-main-skeleton')).toBeInTheDocument();
  });

  it('falls back to fallback image when main image fails', () => {
    const { mainImage } = setupGallery(['https://example.com/broken-image.jpg']);

    fireEvent.error(mainImage);
    expect(mainImage.src).toBe(fallbackImage);
  });

  it('hides skeleton when fallback image also fails to load', () => {
    const { mainImage } = setupGallery(['https://example.com/broken-image.jpg']);

    fireEvent.error(mainImage);
    expect(screen.getByTestId('gallery-main-skeleton')).toBeInTheDocument();

    fireEvent.error(mainImage);
    expect(screen.queryByTestId('gallery-main-skeleton')).not.toBeInTheDocument();
  });

  it('debounces rapid consecutive swipes', () => {
    let currentNow = 1000;
    const nowSpy = vi.spyOn(Date, 'now').mockImplementation(() => currentNow);

    const { mainImage, touchSurface, onPhotoClick } = setupGallery([
      'https://example.com/p1.jpg',
      'https://example.com/p2.jpg',
      'https://example.com/p3.jpg',
    ]);

    swipe(touchSurface, 280, 120);
    expect(mainImage.src).toContain('/p2.jpg');

    currentNow = 1100;
    swipe(touchSurface, 280, 120);
    expect(mainImage.src).toContain('/p2.jpg');

    currentNow = 1400;
    swipe(touchSurface, 280, 120);
    expect(mainImage.src).toContain('/p3.jpg');

    expect(onPhotoClick).toHaveBeenCalledTimes(2);
    nowSpy.mockRestore();
  });

  it('keeps thumbnails interactive and triggers callback when selecting a thumbnail', () => {
    const onPhotoClick = vi.fn();
    const { container, mainImage } = setupGallery(
      ['https://example.com/p1.jpg', 'https://example.com/p2.jpg', 'https://example.com/p3.jpg'],
      onPhotoClick
    );

    fireEvent.load(mainImage);
    const thumbnailButtons = container.querySelectorAll('button[aria-pressed]');
    expect(thumbnailButtons).toHaveLength(3);

    fireEvent.click(thumbnailButtons[2] as HTMLButtonElement);

    expect(mainImage.src).toContain('/p3.jpg');
    expect(onPhotoClick).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('gallery-main-skeleton')).toBeInTheDocument();
  });

  it('does not trigger callback when clicking current thumbnail', () => {
    const onPhotoClick = vi.fn();
    const { container, mainImage } = setupGallery(
      ['https://example.com/p1.jpg', 'https://example.com/p2.jpg'],
      onPhotoClick
    );

    fireEvent.load(mainImage);
    const thumbnailButtons = container.querySelectorAll('button[aria-pressed]');
    expect(thumbnailButtons).toHaveLength(2);

    fireEvent.click(thumbnailButtons[0] as HTMLButtonElement);

    expect(onPhotoClick).not.toHaveBeenCalled();
    expect(mainImage.src).toContain('/p1.jpg');
  });
});
