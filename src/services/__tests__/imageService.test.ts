import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';

// Polyfill Worker GLOBALLY before imports to prevent heic2any crash
global.Worker = vi.fn().mockImplementation(() => ({
  postMessage: vi.fn(),
  onmessage: null,
  onerror: null,
  terminate: vi.fn(),
})) as unknown as typeof Worker;

import { optimizePropertyImage, optimizeImages } from '../imageService';
import imageCompression from 'browser-image-compression';
import heic2any from 'heic2any';

// Mocks
vi.mock('browser-image-compression');
vi.mock('heic2any', () => ({
  default: vi.fn()
}));

function createMockFile(name: string, type: string, size: number) {
  return new File([new ArrayBuffer(size)], name, { type });
}

describe('imageService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('optimizePropertyImage', () => {
    it('should optimize a standard JPEG image', async () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 2 * 1024 * 1024); // 2MB
      const compressedBlob = createMockFile('compressed.jpg', 'image/jpeg', 500 * 1024); // 500KB

      (imageCompression as unknown as Mock).mockResolvedValue(compressedBlob);

      const result = await optimizePropertyImage(file);

      expect(result.skipped).toBe(false);
      expect(result.file).toBe(compressedBlob);
      expect(imageCompression).toHaveBeenCalledWith(file, expect.objectContaining({
        maxSizeMB: 1.5,
        fileType: 'image/jpeg'
      }));
    });

    it('should skip optimization if file is already small enough and not HEIC', async () => {
      const file = createMockFile('small.jpg', 'image/jpeg', 1 * 1024 * 1024); // 1MB < 1.5MB

      const result = await optimizePropertyImage(file);

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('under-threshold');
      expect(imageCompression).not.toHaveBeenCalled();
    });

    it('should explicitly convert HEIC files even if small', async () => {
      const file = createMockFile('photo.heic', 'image/heic', 500 * 1024); // 500KB
      const convertedBlob = new Blob([new ArrayBuffer(400 * 1024)], { type: 'image/jpeg' });
      const compressedBlob = createMockFile('compressed.jpg', 'image/jpeg', 300 * 1024);

      (heic2any as unknown as Mock).mockResolvedValue(convertedBlob);
      (imageCompression as unknown as Mock).mockResolvedValue(compressedBlob);

      const result = await optimizePropertyImage(file);

      expect(heic2any).toHaveBeenCalledWith(expect.objectContaining({
        blob: file,
        toType: 'image/jpeg'
      }));
      // Should compress the output of heic2any
      expect(imageCompression).toHaveBeenCalledWith(convertedBlob, expect.anything());
      expect(result.file).toBe(compressedBlob);
    });

    it('should handle OOM (RangeError) specifically', async () => {
      const file = createMockFile('huge.jpg', 'image/jpeg', 20 * 1024 * 1024);
      const error = new RangeError('Out of memory');

      (imageCompression as unknown as Mock).mockRejectedValue(error);

      const result = await optimizePropertyImage(file);

      expect(result.error).toContain('記憶體不足 (OOM)');
    });

    it('should retry with lower quality on failure', async () => {
      const file = createMockFile('retry.jpg', 'image/jpeg', 3 * 1024 * 1024);
      const compressedBlob = createMockFile('compressed.jpg', 'image/jpeg', 1 * 1024 * 1024);

      // First attempt fails, second succeeds
      (imageCompression as unknown as Mock)
        .mockRejectedValueOnce(new Error('Random compression error'))
        .mockResolvedValueOnce(compressedBlob);

      const result = await optimizePropertyImage(file);

      expect(imageCompression).toHaveBeenCalledTimes(2);
      // First call quality 0.85 (default)
      expect(imageCompression).toHaveBeenNthCalledWith(1, expect.anything(), expect.objectContaining({ initialQuality: 0.85 }));
      // Second call quality 0.85 * 0.8 = 0.68
      expect(imageCompression).toHaveBeenNthCalledWith(2, expect.anything(), expect.objectContaining({ initialQuality: 0.68 }));

      expect(result.file).toBe(compressedBlob);
    });
  });

  describe('optimizeImages (Batch & Concurrency)', () => {
    it('should process multiple files and return results', async () => {
      const files = [
        createMockFile('1.jpg', 'image/jpeg', 2 * 1024 * 1024),
        createMockFile('2.jpg', 'image/jpeg', 2 * 1024 * 1024),
        createMockFile('3.jpg', 'image/jpeg', 2 * 1024 * 1024),
        createMockFile('4.jpg', 'image/jpeg', 2 * 1024 * 1024)
      ];

      (imageCompression as unknown as Mock).mockResolvedValue(createMockFile('opt.jpg', 'image/jpeg', 500 * 1024));

      const { optimized, warnings, skipped } = await optimizeImages(files);

      expect(optimized.length).toBe(4);
      expect(warnings.length).toBe(0);
      expect(skipped).toBe(0);
      expect(imageCompression).toHaveBeenCalledTimes(4);
    });

    it('should collect warnings for failed files', async () => {
      const file = createMockFile('fail.jpg', 'image/jpeg', 5 * 1024 * 1024);
      (imageCompression as unknown as Mock).mockRejectedValue(new Error('Fatal error'));

      const { optimized, warnings } = await optimizeImages([file]);

      expect(optimized.length).toBe(0);
      expect(warnings.length).toBe(1);
      expect(warnings[0]).toContain('fail.jpg');
    });
  });
});
