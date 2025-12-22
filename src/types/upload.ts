// UP-3.H: 集中管理上傳相關型別

export interface UploadResult {
    public_id: string;
    community_id: string | null;
    community_name: string | null;
    is_new_community: boolean;
}

export interface UploadError {
    type: 'compression' | 'heic' | 'upload' | 'network' | 'validation';
    message: string;
    canFallback?: boolean;
    originalFiles?: File[];
}

// UP-3.1: ManagedImage 介面
export interface ManagedImage {
    id: string;           // 唯一識別碼 (crypto.randomUUID)
    file: File;           // 原始 File 物件
    previewUrl: string;   // Blob URL 供預覽
    isCover: boolean;     // 是否為封面
}
