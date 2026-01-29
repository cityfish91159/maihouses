// UP-3.H: 集中管理上傳相關型別 (Single Source of Truth)
import { PropertyFormInput } from '../services/propertyService';

// ============================================================
// State Types
// ============================================================

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
  id: string; // 唯一識別碼 (crypto.randomUUID)
  file: File; // 原始 File 物件
  previewUrl: string; // Blob URL 供預覽
  isCover: boolean; // 是否為封面
}

export interface UploadState {
  // Loading States
  loading: boolean;
  compressing: boolean;
  validating: boolean;

  // Progress
  uploadProgress: { current: number; total: number } | null;
  compressionProgress: number | null;

  // Data
  form: PropertyFormInput;
  managedImages: ManagedImage[]; // UP-3.2: 使用 ManagedImage 取代 imageFiles
  selectedCommunityId: string | undefined;
  userId: string | undefined;

  // Results
  uploadResult: UploadResult | null;
  showConfirmation: boolean;

  // Error Handling
  lastError: UploadError | null;
}

// ============================================================
// Action Types
// ============================================================

export type UploadAction =
  // Loading States
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_VALIDATING'; payload: boolean }

  // Compression Flow
  | { type: 'START_COMPRESSION' }
  | { type: 'UPDATE_COMPRESSION_PROGRESS'; payload: number }
  | { type: 'FINISH_COMPRESSION'; payload: ManagedImage[] }
  | {
      type: 'COMPRESSION_FAILED';
      payload: { message: string; canFallback: boolean; originalFiles: File[] };
    }

  // Image Management (UP-3)
  | { type: 'ADD_IMAGES'; payload: ManagedImage[] }
  | { type: 'REMOVE_IMAGE'; payload: string }
  | { type: 'SET_COVER'; payload: string }

  // Form
  | { type: 'SET_FORM'; payload: PropertyFormInput }
  | { type: 'UPDATE_FORM'; payload: Partial<PropertyFormInput> }

  // Upload Flow
  | { type: 'START_UPLOAD'; payload: { total: number } }
  | {
      type: 'UPDATE_UPLOAD_PROGRESS';
      payload: { current: number; total: number };
    }
  | { type: 'UPLOAD_SUCCESS'; payload: UploadResult }
  | { type: 'UPLOAD_FAILED'; payload: UploadError }

  // User & Community
  | { type: 'SET_USER_ID'; payload: string | undefined }
  | { type: 'SET_COMMUNITY_ID'; payload: string | undefined }

  // Error Management
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_ERROR'; payload: UploadError }

  // Reset
  | { type: 'RESET_UPLOAD_STATE' };
