import imageCompression from 'browser-image-compression';

export interface OptimizeOptions {
  maxWidthOrHeight?: number;
  maxSizeMB?: number;
  quality?: number;
  onProgress?: (progress: number) => void;
}

export interface OptimizeResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  ratio: number;
  skipped: boolean;
  reason?: string;
  error?: string;
}

const DEFAULT_OPTIONS: Required<Omit<OptimizeOptions, 'onProgress'>> = {
  maxWidthOrHeight: 2048,
  maxSizeMB: 1.5,
  quality: 0.85,
};

/**
 * 壓縮單張圖片 (含重試機制與 HEIC 轉檔)
 */
export async function optimizePropertyImage(file: File, options: OptimizeOptions = {}): Promise<OptimizeResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const originalSize = file.size;
  const targetBytes = opts.maxSizeMB * 1024 * 1024;

  // 若原始檔已低於目標大小，跳過壓縮避免畫質損失 (除非是 HEIC 需轉檔)
  const isHeic = file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic');
  if (originalSize <= targetBytes && !isHeic) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      ratio: 1,
      skipped: true,
      reason: 'under-threshold',
    };
  }

  // 內部重試函式
  const attemptCompression = async (quality: number, retryCount = 0): Promise<File> => {
    try {
      return await imageCompression(file, {
        maxWidthOrHeight: opts.maxWidthOrHeight,
        maxSizeMB: opts.maxSizeMB,
        initialQuality: quality,
        useWebWorker: true,
        preserveExif: true,
        fileType: isHeic ? 'image/jpeg' : undefined, // UP-2.C: 強制轉換 HEIC
      });
    } catch (error: any) {
      // UP-2.E: 錯誤分類
      if (error.name === 'RangeError') {
        throw new Error('記憶體不足 (OOM)，請嘗試上傳較小的圖片');
      }

      // UP-2.D: 失敗重試邏輯 (降規重試)
      if (retryCount < 1) {
        return attemptCompression(quality * 0.8, retryCount + 1);
      }
      throw error;
    }
  };

  try {
    const compressed = await attemptCompression(opts.quality);
    return {
      file: compressed,
      originalSize,
      compressedSize: compressed.size,
      ratio: compressed.size / originalSize,
      skipped: false,
    };
  } catch (err: any) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      ratio: 1,
      skipped: true,
      reason: 'failed',
      error: err.message || '壓縮失敗'
    };
  }
}

/**
 * 批次壓縮處理 (UP-2.B: 並發控制 + UP-2.A: 進度回報)
 */
export async function optimizeImages(
  files: File[],
  options: OptimizeOptions = {}
): Promise<{ optimized: File[]; warnings: string[]; skipped: number }> {
  const warnings: string[] = [];
  const optimized: File[] = [];
  let skippedCount = 0;
  let processedCount = 0;

  const concurrency = 3;
  const results: Promise<void>[] = [];

  const running = new Set<Promise<void>>();

  for (const file of files) {
    const promise = (async () => {
      try {
        const res = await optimizePropertyImage(file, options);
        if (res.error) {
          warnings.push(`${file.name}: ${res.error}`);
        } else {
          if (res.skipped && res.reason === 'under-threshold') skippedCount++;
          optimized.push(res.file);
        }
      } catch (e: any) {
        warnings.push(`${file.name}: ${e.message}`);
      } finally {
        processedCount++;
        options.onProgress?.(Math.round((processedCount / files.length) * 100));
      }
    })();

    results.push(promise);
    running.add(promise);

    const clean = () => running.delete(promise);
    promise.then(clean, clean);

    if (running.size >= concurrency) {
      await Promise.race(running);
    }
  }

  await Promise.all(results);
  return { optimized, warnings, skipped: skippedCount };
}
