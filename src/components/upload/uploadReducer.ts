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
    canFallback?: boolean; // 是否允許上傳原檔
    originalFiles?: File[]; // Fallback 用的原檔
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
    imageFiles: File[];
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
    | { type: 'FINISH_COMPRESSION'; payload: { files: File[]; urls: string[] } }
    | { type: 'COMPRESSION_FAILED'; payload: { message: string; canFallback: boolean; originalFiles: File[] } }

    // Image Management
    | { type: 'ADD_IMAGES'; payload: { files: File[]; urls: string[] } }
    | { type: 'REMOVE_IMAGE'; payload: number }

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
    imageFiles: [],
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

        case 'FINISH_COMPRESSION':
            return {
                ...state,
                compressing: false,
                compressionProgress: null,
                imageFiles: [...state.imageFiles, ...action.payload.files],
                form: {
                    ...state.form,
                    images: [...state.form.images, ...action.payload.urls]
                }
            };

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

        // --- Image Management ---
        case 'ADD_IMAGES':
            return {
                ...state,
                imageFiles: [...state.imageFiles, ...action.payload.files],
                form: {
                    ...state.form,
                    images: [...state.form.images, ...action.payload.urls]
                }
            };

        case 'REMOVE_IMAGE': {
            const index = action.payload;
            return {
                ...state,
                imageFiles: state.imageFiles.filter((_, i) => i !== index),
                form: {
                    ...state.form,
                    images: state.form.images.filter((_, i) => i !== index)
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
