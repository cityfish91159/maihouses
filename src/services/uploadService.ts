import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../lib/logger';

export interface UploadResult {
  url: string;
  path: string;
}

/**
 * Upload Service
 * 負責處理檔案上傳至 Supabase Storage
 */
export const uploadService = {
  /**
   * 上傳圖片
   * @param file 檔案物件
   * @param bucket Bucket 名稱 (預設 'community-images')
   * @param folder 資料夾路徑 (可選)
   */
  async uploadImage(
    file: File,
    bucket = 'community-images',
    folder = 'posts'
  ): Promise<UploadResult> {
    // 1. 驗證
    if (!file.type.startsWith('image/')) {
      throw new Error('僅支援圖片上傳');
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('圖片大小不能超過 5MB');
    }

    // 2. 產生成檔名
    const ext = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${ext}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // 3. 上傳
    const { data, error } = await supabase.storage.from(bucket).upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (error) {
      logger.error('[UploadService] Upload failed', { error });
      throw error;
    }

    // 4. 取得公開網址
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return {
      url: publicUrl,
      path: filePath,
    };
  },

  /**
   * D2: 批量上傳圖片 (Batch Upload)
   */
  async uploadFiles(
    files: File[],
    bucket = 'community-images',
    folder = 'posts'
  ): Promise<UploadResult[]> {
    return Promise.all(files.map((file) => this.uploadImage(file, bucket, folder)));
  },
};
