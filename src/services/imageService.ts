import imageCompression from 'browser-image-compression';
import heic2any from 'heic2any';

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
 * 壓縮單張圖片 (含重試機制與 HEIC 轉檔 - Highest Standard Explicit Handling)
 */
export async function optimizePropertyImage(file: File, options: OptimizeOptions = {}): Promise<OptimizeResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const originalSize = file.size;
  const targetBytes = opts.maxSizeMB * 1024 * 1024;

  const isHeic = file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic');

  // 若非 HEIC 且原始檔已低於目標大小，跳過壓縮
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
  const attemptCompression = async (input: File | Blob, quality: number, retryCount = 0): Promise<File> => {
    try {
      return await imageCompression(input as File, {
        maxWidthOrHeight: opts.maxWidthOrHeight,
        maxSizeMB: opts.maxSizeMB,
        initialQuality: quality,
        useWebWorker: true,
        preserveExif: true,
        fileType: 'image/jpeg' // 確保輸出為 JPEG
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'RangeError') {
        throw new Error('記憶體不足 (OOM)，請嘗試上傳較小的圖片');
      }
      if (retryCount < 1) {
        return attemptCompression(input, quality * 0.8, retryCount + 1);
      }
      throw error;
    }
  };

  try {
    let processInput: File | Blob = file;

    // UP-2.C: 顯式 HEIC 轉換 (Highest Standard)
    if (isHeic) {
      try {
        const result = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: opts.quality
        });
        // heic2any returns Blob or Blob[]
        const outputBlob = Array.isArray(result) ? result[0] : result;
        if (outputBlob) {
          processInput = outputBlob;
        }
      } catch (heicError) {
        // HEIC 轉換失敗：回傳明確錯誤，不 fallthrough
        return {
          file,
          originalSize,
          compressedSize: originalSize,
          ratio: 1,
          skipped: true,
          reason: 'heic-conversion-failed',
          error: 'iOS HEIC 格式轉換失敗，請改用 JPEG 格式的照片'
        };
      }
    }

    const compressed = await attemptCompression(processInput, opts.quality);

    return {
      file: compressed,
      originalSize,
      compressedSize: compressed.size,
      ratio: compressed.size / originalSize,
      skipped: false,
    };
  } catch (err) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      ratio: 1,
      skipped: true,
      reason: 'failed',
      error: err instanceof Error ? err.message : '壓縮失敗'
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
      } catch (e) {
        warnings.push(`${file.name}: ${e instanceof Error ? e.message : 'Unknown error'}`);
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
