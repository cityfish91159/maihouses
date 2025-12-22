import { PropertyFormInput } from '../../services/propertyService';

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
    id: string;           // 唯一識別碼 (crypto.randomUUID)
    file: File;           // 原始 File 物件
    previewUrl: string;   // Blob URL 供預覽
    isCover: boolean;     // 是否為封面
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
    | { type: 'FINISH_COMPRESSION'; payload: ManagedImage[] } // UP-3: 使用 ManagedImage[]
    | { type: 'COMPRESSION_FAILED'; payload: { message: string; canFallback: boolean; originalFiles: File[] } }

    // Image Management (UP-3)
    | { type: 'ADD_IMAGES'; payload: ManagedImage[] }
    | { type: 'REMOVE_IMAGE'; payload: string } // 使用 id 而非 index
    | { type: 'SET_COVER'; payload: string }    // UP-3.3: 設為封面

    // Form
    | { type: 'SET_FORM'; payload: PropertyFormInput }
    | { type: 'UPDATE_FORM'; payload: Partial<PropertyFormInput> }

    // Upload Flow
    | { type: 'START_UPLOAD'; payload: { total: number } }
    | { type: 'UPDATE_UPLOAD_PROGRESS'; payload: { current: number; total: number } }
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

// ============================================================
// Helper: 建立 ManagedImage
// ============================================================

export function createManagedImage(file: File, isCover: boolean = false): ManagedImage {
    return {
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        isCover
    };
}

// ============================================================
// Helper: 取得排序後的圖片 (封面優先)
// ============================================================

export function getSortedImages(images: ManagedImage[]): ManagedImage[] {
    // UP-3.4: 確保封面在第一位
    const cover = images.find(img => img.isCover);
    const others = images.filter(img => !img.isCover);
    return cover ? [cover, ...others] : images;
}

// ============================================================
// Initial State Factory
// ============================================================

export const createInitialState = (): UploadState => ({
    loading: false,
    compressing: false,
    validating: false,
    uploadProgress: null,
    compressionProgress: null,
    form: {
        title: '', price: '', address: '', communityName: '', size: '', age: '',
        floorCurrent: '', floorTotal: '', rooms: '3', halls: '2', bathrooms: '2',
        type: '電梯大樓', description: '',
        advantage1: '', advantage2: '', disadvantage: '',
        highlights: [],
        images: [],
        sourceExternalId: ''
    },
    managedImages: [],
    selectedCommunityId: undefined,
    userId: undefined,
    uploadResult: null,
    showConfirmation: false,
    lastError: null
});

// ============================================================
// Reducer
// ============================================================

export function uploadReducer(state: UploadState, action: UploadAction): UploadState {
    switch (action.type) {
        // --- Loading States ---
        case 'SET_LOADING':
            return { ...state, loading: action.payload };

        case 'SET_VALIDATING':
            return { ...state, validating: action.payload };

        // --- Compression Flow ---
        case 'START_COMPRESSION':
            return {
                ...state,
                compressing: true,
                compressionProgress: 0,
                lastError: null
            };

        case 'UPDATE_COMPRESSION_PROGRESS':
            return { ...state, compressionProgress: action.payload };

        case 'FINISH_COMPRESSION': {
            const newImages = action.payload;
            // 若目前無封面且有新圖片，將第一張設為封面
            const hasCover = state.managedImages.some(img => img.isCover) || newImages.some(img => img.isCover);
            let imagesToAdd = newImages;
            if (!hasCover && newImages.length > 0 && state.managedImages.length === 0) {
                imagesToAdd = newImages.map((img, idx) => idx === 0 ? { ...img, isCover: true } : img);
            }
            const allImages = [...state.managedImages, ...imagesToAdd];
            return {
                ...state,
                compressing: false,
                compressionProgress: null,
                managedImages: allImages,
                form: {
                    ...state.form,
                    images: getSortedImages(allImages).map(img => img.previewUrl)
                }
            };
        }

        case 'COMPRESSION_FAILED':
            return {
                ...state,
                compressing: false,
                compressionProgress: null,
                lastError: {
                    type: 'compression',
                    message: action.payload.message,
                    canFallback: action.payload.canFallback,
                    originalFiles: action.payload.originalFiles
                }
            };

        // --- Image Management (UP-3) ---
        case 'ADD_IMAGES': {
            const newImages = action.payload;
            const hasCover = state.managedImages.some(img => img.isCover) || newImages.some(img => img.isCover);
            let imagesToAdd = newImages;
            if (!hasCover && newImages.length > 0 && state.managedImages.length === 0) {
                imagesToAdd = newImages.map((img, idx) => idx === 0 ? { ...img, isCover: true } : img);
            }
            const allImages = [...state.managedImages, ...imagesToAdd];
            return {
                ...state,
                managedImages: allImages,
                form: {
                    ...state.form,
                    images: getSortedImages(allImages).map(img => img.previewUrl)
                }
            };
        }

        case 'REMOVE_IMAGE': {
            const idToRemove = action.payload;
            const imageToRemove = state.managedImages.find(img => img.id === idToRemove);
            if (imageToRemove) {
                URL.revokeObjectURL(imageToRemove.previewUrl);
            }
            let remaining = state.managedImages.filter(img => img.id !== idToRemove);
            // 若移除的是封面，將第一張設為新封面
            if (imageToRemove?.isCover && remaining.length > 0) {
                remaining = remaining.map((img, idx) => idx === 0 ? { ...img, isCover: true } : img);
            }
            return {
                ...state,
                managedImages: remaining,
                form: {
                    ...state.form,
                    images: getSortedImages(remaining).map(img => img.previewUrl)
                }
            };
        }

        // UP-3.3: 設為封面
        case 'SET_COVER': {
            const coverId = action.payload;
            // 檢查目標 id 是否存在
            const targetExists = state.managedImages.some(img => img.id === coverId);
            if (!targetExists) {
                // 目標不存在，保持原狀
                return state;
            }
            const updatedImages = state.managedImages.map(img => ({
                ...img,
                isCover: img.id === coverId
            }));
            return {
                ...state,
                managedImages: updatedImages,
                form: {
                    ...state.form,
                    images: getSortedImages(updatedImages).map(img => img.previewUrl)
                }
            };
        }

        // --- Form ---
        case 'SET_FORM':
            return { ...state, form: action.payload };

        case 'UPDATE_FORM':
            return { ...state, form: { ...state.form, ...action.payload } };

        // --- Upload Flow ---
        case 'START_UPLOAD':
            return {
                ...state,
                loading: true,
                uploadProgress: { current: 0, total: action.payload.total },
                lastError: null
            };

        case 'UPDATE_UPLOAD_PROGRESS':
            return { ...state, uploadProgress: action.payload };

        case 'UPLOAD_SUCCESS':
            return {
                ...state,
                loading: false,
                uploadProgress: null,
                uploadResult: action.payload,
                showConfirmation: true
            };

        case 'UPLOAD_FAILED':
            return {
                ...state,
                loading: false,
                uploadProgress: null,
                lastError: action.payload
            };

        // --- User & Community ---
        case 'SET_USER_ID':
            return { ...state, userId: action.payload };

        case 'SET_COMMUNITY_ID':
            return { ...state, selectedCommunityId: action.payload };

        // --- Error Management ---
        case 'CLEAR_ERROR':
            return { ...state, lastError: null };

        case 'SET_ERROR':
            return { ...state, lastError: action.payload };

        // --- Reset ---
        case 'RESET_UPLOAD_STATE':
            return createInitialState();

        default:
            return state;
    }
}
