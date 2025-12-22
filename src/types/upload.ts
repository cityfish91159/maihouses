// UP-3.H: 集中管理上傳相關型別
// Re-export from uploadReducer to maintain single source of truth

export type {
    UploadResult,
    UploadError,
    ManagedImage,
    UploadState,
    UploadAction
} from '../components/upload/uploadReducer';

export {
    createManagedImage,
    getSortedImages,
    createInitialState,
    uploadReducer
} from '../components/upload/uploadReducer';
