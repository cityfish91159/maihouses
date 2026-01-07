import {
    uploadReducer,
    createInitialState,
    createManagedImage,
    getSortedImages,
} from '../uploadReducer';
import type { UploadState, ManagedImage } from '../../../types/upload';

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn(() => `blob:mock-${Math.random()}`);
const mockRevokeObjectURL = vi.fn();
vi.stubGlobal('URL', {
    createObjectURL: mockCreateObjectURL,
    revokeObjectURL: mockRevokeObjectURL
});

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
    randomUUID: vi.fn(() => `uuid-${Math.random().toString(36).substring(7)}`)
});

// Helper to create mock File
const createMockFile = (name: string, size: number = 1000): File => {
    return new File(['x'.repeat(size)], name, { type: 'image/jpeg' });
};

describe('uploadReducer', () => {
    let initialState: UploadState;

    beforeEach(() => {
        initialState = createInitialState();
        vi.clearAllMocks();
    });

    // UP-3.A: 基本 Action 測試
    describe('SET_LOADING', () => {
        it('should set loading to true', () => {
            const newState = uploadReducer(initialState, { type: 'SET_LOADING', payload: true });
            expect(newState.loading).toBe(true);
        });

        it('should set loading to false', () => {
            const state = { ...initialState, loading: true };
            const newState = uploadReducer(state, { type: 'SET_LOADING', payload: false });
            expect(newState.loading).toBe(false);
        });
    });

    describe('SET_VALIDATING', () => {
        it('should set validating to true', () => {
            const newState = uploadReducer(initialState, { type: 'SET_VALIDATING', payload: true });
            expect(newState.validating).toBe(true);
        });
    });

    describe('START_COMPRESSION', () => {
        it('should set compressing true and progress to 0', () => {
            const newState = uploadReducer(initialState, { type: 'START_COMPRESSION' });
            expect(newState.compressing).toBe(true);
            expect(newState.compressionProgress).toBe(0);
            expect(newState.lastError).toBeNull();
        });
    });

    describe('UPDATE_COMPRESSION_PROGRESS', () => {
        it('should update compression progress', () => {
            const state = { ...initialState, compressing: true, compressionProgress: 0 };
            const newState = uploadReducer(state, { type: 'UPDATE_COMPRESSION_PROGRESS', payload: 50 });
            expect(newState.compressionProgress).toBe(50);
        });
    });

    // UP-3.F: 批次上傳第一張自動封面
    describe('ADD_IMAGES', () => {
        it('should auto-set first image as cover when adding to empty state', () => {
            const images: ManagedImage[] = [
                { id: 'img1', file: createMockFile('1.jpg'), previewUrl: 'blob:1', isCover: false },
                { id: 'img2', file: createMockFile('2.jpg'), previewUrl: 'blob:2', isCover: false },
                { id: 'img3', file: createMockFile('3.jpg'), previewUrl: 'blob:3', isCover: false },
                { id: 'img4', file: createMockFile('4.jpg'), previewUrl: 'blob:4', isCover: false },
                { id: 'img5', file: createMockFile('5.jpg'), previewUrl: 'blob:5', isCover: false },
            ];

            const newState = uploadReducer(initialState, { type: 'ADD_IMAGES', payload: images });
            expect(newState.managedImages[0]?.isCover).toBe(true);
            expect(newState.managedImages.filter(img => img.isCover).length).toBe(1);
            expect(newState.managedImages.slice(1).every(img => !img.isCover)).toBe(true);
        });

        it('should not change existing cover when adding more images', () => {
            const existingImages: ManagedImage[] = [
                { id: 'existing', file: createMockFile('e.jpg'), previewUrl: 'blob:e', isCover: true },
            ];
            const stateWithImages = { ...initialState, managedImages: existingImages };

            const newImages: ManagedImage[] = [
                { id: 'new1', file: createMockFile('n1.jpg'), previewUrl: 'blob:n1', isCover: false },
            ];

            const newState = uploadReducer(stateWithImages, { type: 'ADD_IMAGES', payload: newImages });
            expect(newState.managedImages.length).toBe(2);
            expect(newState.managedImages[0]?.isCover).toBe(true);
            expect(newState.managedImages[1]?.isCover).toBe(false);
        });

        it('should update form.images with sorted preview URLs', () => {
            const images: ManagedImage[] = [
                { id: 'img1', file: createMockFile('1.jpg'), previewUrl: 'blob:first', isCover: false },
            ];
            const newState = uploadReducer(initialState, { type: 'ADD_IMAGES', payload: images });
            expect(newState.form.images).toContain('blob:first');
        });
    });

    // UP-3.C: 驗證 revokeObjectURL 被呼叫
    // UP-3.E: 刪除封面後的 fallback
    describe('REMOVE_IMAGE', () => {
        it('should NOT call URL.revokeObjectURL (Side Effect moved to Context)', () => {
            const images: ManagedImage[] = [
                { id: 'img1', file: createMockFile('1.jpg'), previewUrl: 'blob:to-revoke', isCover: true },
                { id: 'img2', file: createMockFile('2.jpg'), previewUrl: 'blob:keep', isCover: false },
            ];
            const stateWithImages = { ...initialState, managedImages: images };

            uploadReducer(stateWithImages, { type: 'REMOVE_IMAGE', payload: 'img1' });
            // Reducer must be PURE. Side effect happens in Context.
            expect(mockRevokeObjectURL).not.toHaveBeenCalled();
        });

        it('should set next image as cover when removing cover image', () => {
            const images: ManagedImage[] = [
                { id: 'cover', file: createMockFile('cover.jpg'), previewUrl: 'blob:cover', isCover: true },
                { id: 'second', file: createMockFile('second.jpg'), previewUrl: 'blob:second', isCover: false },
                { id: 'third', file: createMockFile('third.jpg'), previewUrl: 'blob:third', isCover: false },
            ];
            const stateWithImages = { ...initialState, managedImages: images };

            const newState = uploadReducer(stateWithImages, { type: 'REMOVE_IMAGE', payload: 'cover' });
            expect(newState.managedImages.length).toBe(2);
            expect(newState.managedImages[0]?.id).toBe('second');
            expect(newState.managedImages[0]?.isCover).toBe(true);
            expect(newState.managedImages[0]?.isCover).toBe(true);
            expect(newState.managedImages.filter(img => img.isCover).length).toBe(1);
        });

        // Regression Test: 刪除普通圖片，不應影響封面
        it('should NOT change cover when removing non-cover image', () => {
            const images: ManagedImage[] = [
                { id: 'cover', file: createMockFile('c.jpg'), previewUrl: 'b:c', isCover: true },
                { id: 'normal', file: createMockFile('n.jpg'), previewUrl: 'b:n', isCover: false },
            ];
            const stateWithImages = { ...initialState, managedImages: images };

            const newState = uploadReducer(stateWithImages, { type: 'REMOVE_IMAGE', payload: 'normal' });
            expect(newState.managedImages.length).toBe(1);
            expect(newState.managedImages[0]?.id).toBe('cover');
            expect(newState.managedImages[0]?.isCover).toBe(true);
        });

        it('should handle removing non-existent image gracefully', () => {
            const images: ManagedImage[] = [
                { id: 'img1', file: createMockFile('1.jpg'), previewUrl: 'blob:1', isCover: true },
            ];
            const stateWithImages = { ...initialState, managedImages: images };
            const newState = uploadReducer(stateWithImages, { type: 'REMOVE_IMAGE', payload: 'non-existent' });
            expect(newState.managedImages.length).toBe(1);
        });

        it('should update form.images after removal', () => {
            const images: ManagedImage[] = [
                { id: 'img1', file: createMockFile('1.jpg'), previewUrl: 'blob:1', isCover: true },
                { id: 'img2', file: createMockFile('2.jpg'), previewUrl: 'blob:2', isCover: false },
            ];
            const stateWithImages = {
                ...initialState,
                managedImages: images,
                form: { ...initialState.form, images: ['blob:1', 'blob:2'] }
            };

            const newState = uploadReducer(stateWithImages, { type: 'REMOVE_IMAGE', payload: 'img1' });
            expect(newState.form.images.length).toBe(1);
        });
    });

    // UP-3.B: setCover 邊界測試
    describe('SET_COVER', () => {
        it('should set specified image as cover', () => {
            const images: ManagedImage[] = [
                { id: 'img1', file: createMockFile('1.jpg'), previewUrl: 'blob:1', isCover: true },
                { id: 'img2', file: createMockFile('2.jpg'), previewUrl: 'blob:2', isCover: false },
            ];
            const stateWithImages = { ...initialState, managedImages: images };

            const newState = uploadReducer(stateWithImages, { type: 'SET_COVER', payload: 'img2' });
            expect(newState.managedImages.find(img => img.id === 'img1')?.isCover).toBe(false);
            expect(newState.managedImages.find(img => img.id === 'img2')?.isCover).toBe(true);
        });

        it('should always have exactly one cover image', () => {
            const images: ManagedImage[] = [
                { id: 'img1', file: createMockFile('1.jpg'), previewUrl: 'blob:1', isCover: true },
                { id: 'img2', file: createMockFile('2.jpg'), previewUrl: 'blob:2', isCover: false },
                { id: 'img3', file: createMockFile('3.jpg'), previewUrl: 'blob:3', isCover: false },
            ];
            const stateWithImages = { ...initialState, managedImages: images };

            const newState = uploadReducer(stateWithImages, { type: 'SET_COVER', payload: 'img3' });
            expect(newState.managedImages.filter(img => img.isCover).length).toBe(1);
        });

        it('should handle setting non-existent id as cover (should preserve existing cover)', () => {
            const images: ManagedImage[] = [
                { id: 'img1', file: createMockFile('1.jpg'), previewUrl: 'blob:1', isCover: true },
            ];
            const stateWithImages = { ...initialState, managedImages: images };

            const newState = uploadReducer(stateWithImages, { type: 'SET_COVER', payload: 'non-existent' });
            // 修正：目標 id 不存在時應保持原狀，不應清除既有封面
            expect(newState.managedImages.filter(img => img.isCover).length).toBe(1);
            expect(newState.managedImages[0]?.isCover).toBe(true);
        });

        it('should handle setting same cover twice', () => {
            const images: ManagedImage[] = [
                { id: 'img1', file: createMockFile('1.jpg'), previewUrl: 'blob:1', isCover: true },
                { id: 'img2', file: createMockFile('2.jpg'), previewUrl: 'blob:2', isCover: false },
            ];
            const stateWithImages = { ...initialState, managedImages: images };

            const newState = uploadReducer(stateWithImages, { type: 'SET_COVER', payload: 'img1' });
            expect(newState.managedImages.find(img => img.id === 'img1')?.isCover).toBe(true);
            expect(newState.managedImages.filter(img => img.isCover).length).toBe(1);
        });

        it('should handle setting cover on empty array', () => {
            const newState = uploadReducer(initialState, { type: 'SET_COVER', payload: 'any-id' });
            expect(newState.managedImages.length).toBe(0);
            expect(newState.managedImages.filter(img => img.isCover).length).toBe(0);
        });
    });

    describe('FINISH_COMPRESSION', () => {
        it('should add compressed images and reset compression state', () => {
            const compressingState = { ...initialState, compressing: true, compressionProgress: 50 };
            const images: ManagedImage[] = [
                { id: 'compressed1', file: createMockFile('c1.jpg'), previewUrl: 'blob:c1', isCover: false },
            ];

            const newState = uploadReducer(compressingState, { type: 'FINISH_COMPRESSION', payload: images });
            expect(newState.compressing).toBe(false);
            expect(newState.compressionProgress).toBeNull();
            expect(newState.managedImages.length).toBe(1);
        });
    });

    describe('COMPRESSION_FAILED', () => {
        it('should set error and reset compression state', () => {
            const compressingState = { ...initialState, compressing: true, compressionProgress: 50 };

            const newState = uploadReducer(compressingState, {
                type: 'COMPRESSION_FAILED',
                payload: { message: 'Failed', canFallback: true, originalFiles: [] }
            });

            expect(newState.compressing).toBe(false);
            expect(newState.compressionProgress).toBeNull();
            expect(newState.lastError?.type).toBe('compression');
            expect(newState.lastError?.message).toBe('Failed');
        });
    });

    describe('START_UPLOAD', () => {
        it('should set loading and upload progress', () => {
            const newState = uploadReducer(initialState, { type: 'START_UPLOAD', payload: { total: 5 } });
            expect(newState.loading).toBe(true);
            expect(newState.uploadProgress).toEqual({ current: 0, total: 5 });
        });
    });

    describe('UPLOAD_SUCCESS', () => {
        it('should set upload result and show confirmation', () => {
            const uploadingState = { ...initialState, loading: true, uploadProgress: { current: 5, total: 5 } };

            const newState = uploadReducer(uploadingState, {
                type: 'UPLOAD_SUCCESS',
                payload: { public_id: 'P123', community_id: 'C456', community_name: 'Test', is_new_community: false }
            });

            expect(newState.loading).toBe(false);
            expect(newState.uploadProgress).toBeNull();
            expect(newState.uploadResult?.public_id).toBe('P123');
            expect(newState.showConfirmation).toBe(true);
        });
    });

    describe('CLEAR_ERROR', () => {
        it('should clear last error', () => {
            const errorState = { ...initialState, lastError: { type: 'upload' as const, message: 'Error' } };
            const newState = uploadReducer(errorState, { type: 'CLEAR_ERROR' });
            expect(newState.lastError).toBeNull();
        });
    });

    describe('RESET_UPLOAD_STATE', () => {
        it('should reset to initial state', () => {
            const modifiedState = {
                ...initialState,
                loading: true,
                managedImages: [{ id: 'x', file: createMockFile('x.jpg'), previewUrl: 'blob:x', isCover: true }],
            };

            const newState = uploadReducer(modifiedState, { type: 'RESET_UPLOAD_STATE' });
            expect(newState).toEqual(createInitialState());
        });
    });
});

// UP-3.D: getSortedImages 測試
describe('getSortedImages', () => {
    it('should return cover image first', () => {
        const images: ManagedImage[] = [
            { id: 'a', file: new File([''], 'a.jpg'), previewUrl: 'blob:a', isCover: false },
            { id: 'b', file: new File([''], 'b.jpg'), previewUrl: 'blob:b', isCover: true },
            { id: 'c', file: new File([''], 'c.jpg'), previewUrl: 'blob:c', isCover: false },
        ];

        const sorted = getSortedImages(images);
        expect(sorted[0]?.id).toBe('b');
        expect(sorted[0]?.isCover).toBe(true);
    });

    it('should preserve order when no cover', () => {
        const images: ManagedImage[] = [
            { id: 'a', file: new File([''], 'a.jpg'), previewUrl: 'blob:a', isCover: false },
            { id: 'b', file: new File([''], 'b.jpg'), previewUrl: 'blob:b', isCover: false },
        ];

        const sorted = getSortedImages(images);
        expect(sorted[0]?.id).toBe('a');
        expect(sorted[1]?.id).toBe('b');
    });

    it('should handle empty array', () => {
        const sorted = getSortedImages([]);
        expect(sorted).toEqual([]);
    });
});

describe('createManagedImage', () => {
    it('should create ManagedImage with unique id', () => {
        const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
        const img = createManagedImage(file);

        expect(img.id).toBeDefined();
        expect(img.file).toBe(file);
        expect(img.previewUrl).toContain('blob:');
        expect(img.isCover).toBe(false);
    });

    it('should set isCover when specified', () => {
        const file = new File([''], 'cover.jpg', { type: 'image/jpeg' });
        const img = createManagedImage(file, true);
        expect(img.isCover).toBe(true);
    });
});
