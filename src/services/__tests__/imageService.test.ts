import { describe, it, expect, vi, beforeEach } from 'vitest';
import { optimizePropertyImage, optimizeImages } from '../imageService';

const mockCompress = vi.fn();
vi.mock('browser-image-compression', () => ({
  default: (...args: unknown[]) => mockCompress(...args),
}));

function createFile(name: string, size: number, type = 'image/jpeg'): File {
  const blob = new Blob([new Uint8Array(size)], { type });
  return new File([blob], name, { type });
}

describe('imageService - optimizePropertyImage', () => {
  beforeEach(() => {
    mockCompress.mockReset();
  });

  it('skips compression when file already under threshold', async () => {
    const file = createFile('small.jpg', 200_000);

    const res = await optimizePropertyImage(file, { maxSizeMB: 0.3 });

    expect(res.skipped).toBe(true);
    expect(res.file).toBe(file);
    expect(mockCompress).not.toHaveBeenCalled();
  });

  it('compresses with configured options', async () => {
    const file = createFile('big.jpg', 3_000_000);
    const compressed = createFile('big.jpg', 1_000_000);
    mockCompress.mockResolvedValueOnce(compressed);

    const res = await optimizePropertyImage(file, {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 2048,
      quality: 0.85,
    });

    expect(mockCompress).toHaveBeenCalledWith(file, expect.objectContaining({
      maxSizeMB: 1.5,
      maxWidthOrHeight: 2048,
      initialQuality: 0.85,
      useWebWorker: true,
      preserveExif: true,
    }));
    expect(res.file.size).toBe(1_000_000);
    expect(res.skipped).toBe(false);
    expect(res.ratio).toBeLessThan(1);
  });
});

describe('imageService - optimizeImages', () => {
  beforeEach(() => {
    mockCompress.mockReset();
  });

  it('processes multiple files and collects warnings', async () => {
    const ok = createFile('ok.jpg', 3_000_000);
    const bad = createFile('bad.jpg', 4_000_000);
    mockCompress
      .mockResolvedValueOnce(createFile('ok.jpg', 1_000_000))
      .mockRejectedValueOnce(new Error('fail'));

    const res = await optimizeImages([ok, bad]);

    expect(res.optimized).toHaveLength(1);
    expect(res.warnings).toHaveLength(1);
    expect(res.skipped).toBe(0);
  });
});
