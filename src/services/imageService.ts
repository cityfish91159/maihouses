import imageCompression from 'browser-image-compression';

export interface OptimizeOptions {
  maxWidthOrHeight?: number;
  maxSizeMB?: number;
  quality?: number;
}

export interface OptimizeResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  ratio: number;
  skipped: boolean;
  reason?: string;
}

const DEFAULT_OPTIONS: Required<OptimizeOptions> = {
  maxWidthOrHeight: 2048,
  maxSizeMB: 1.5,
  quality: 0.85,
};

/**
 * 壓縮並校正圖片（含 EXIF 旋轉）。若原圖已低於限制則直接回傳原檔。
 */
export async function optimizePropertyImage(file: File, options: OptimizeOptions = {}): Promise<OptimizeResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const originalSize = file.size;
  const targetBytes = opts.maxSizeMB * 1024 * 1024;

  // 若原始檔已低於目標大小，跳過壓縮避免畫質損失
  if (originalSize <= targetBytes) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      ratio: 1,
      skipped: true,
      reason: 'under-threshold',
    };
  }

  const compressed = await imageCompression(file, {
    maxWidthOrHeight: opts.maxWidthOrHeight,
    maxSizeMB: opts.maxSizeMB,
    initialQuality: opts.quality,
    useWebWorker: true,
    preserveExif: true,
  });

  return {
    file: compressed as File,
    originalSize,
    compressedSize: compressed.size,
    ratio: compressed.size / originalSize,
    skipped: false,
  };
}

/**
 * 逐一嘗試壓縮，跳過失敗個別檔並回傳警告。
 */
export async function optimizeImages(files: File[], options: OptimizeOptions = {}): Promise<{ optimized: File[]; warnings: string[]; skipped: number; }>
{
  const warnings: string[] = [];
  const optimized: File[] = [];
  let skipped = 0;

  for (const file of files) {
    try {
      const res = await optimizePropertyImage(file, options);
      if (res.skipped) {
        skipped += 1;
      }
      optimized.push(res.file);
    } catch (err) {
      const message = err instanceof Error ? err.message : '未知錯誤';
      warnings.push(`${file.name}: ${message}`);
    }
  }

  return { optimized, warnings, skipped };
}
