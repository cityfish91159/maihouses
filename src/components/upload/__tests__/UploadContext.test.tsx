import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, Mock } from 'vitest';
import { UploadFormProvider, useUploadForm } from '../UploadContext';

const mockValidate = vi.fn();
const mockOptimize = vi.fn();

vi.mock('../../../hooks/usePropertyFormValidation', () => ({
  usePropertyFormValidation: () => ({
    title: { valid: true, message: '' },
    price: { valid: true, message: '' },
    address: { valid: true, message: '' },
    communityName: { valid: true, message: '' },
    advantage1: { valid: true, message: '', charCount: 0 },
    advantage2: { valid: true, message: '', charCount: 0 },
    disadvantage: { valid: true, message: '', charCount: 0 },
    highlights: { valid: true, message: '', warnings: [] },
    images: { valid: true, message: '', count: 0 },
    adv1Valid: true,
    adv2Valid: true,
    disValid: true,
    communityValid: true,
    highlightsValid: true,
    basicValid: true,
    twoGoodOneFairValid: true,
    allValid: true,
    canSubmit: true,
    contentCheck: { hasIssues: false, blockSubmit: false, warnings: [] },
    errors: [],
  }),
  validateImagesAsync: (...args: unknown[]) => mockValidate(...args),
  VALIDATION_RULES: { advantage: { minLength: 2 }, disadvantage: { minLength: 2 }, images: { minCount: 1 } },
  MAX_IMAGE_SIZE_BYTES: 1_500_000,
}));

vi.mock('../../../services/imageService', () => ({
  optimizeImages: (...args: unknown[]) => mockOptimize(...args),
}));

vi.mock('../../../hooks/usePropertyDraft', () => ({
  usePropertyDraft: () => ({
    hasDraft: vi.fn(() => false),
    restoreDraft: vi.fn(() => null),
    clearDraft: vi.fn(),
    getDraftPreview: vi.fn(() => null),
    migrateDraft: vi.fn(),
  }),
}));

vi.mock('../../../lib/notify', () => ({
  notify: {
    warning: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: undefined } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

function createFile(name: string, size: number): File {
  const blob = new Blob([new Uint8Array(size)], { type: 'image/jpeg' });
  return new File([blob], name, { type: 'image/jpeg' });
}

const TestConsumer: React.FC = () => {
  const { handleFileSelect, form } = useUploadForm();

  const trigger = () => {
    const file = createFile('ok.jpg', 2_000_000);
    const input = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
    void handleFileSelect(input);
  };

  return (
    <>
      <button data-testid="trigger" onClick={trigger}>go</button>
      <div data-testid="count">{form.images.length}</div>
    </>
  );
};

describe('UploadContext - handleFileSelect', () => {
  beforeEach(() => {
    mockValidate.mockReset();
    mockOptimize.mockReset();
    (global as unknown as { URL: { createObjectURL: Mock; revokeObjectURL: Mock } }).URL = {
      createObjectURL: vi.fn(() => 'blob:test'),
      revokeObjectURL: vi.fn(),
    };
  });

  it('validates, optimizes, and stores image URLs', async () => {
    const file = createFile('ok.jpg', 2_000_000);
    mockValidate.mockResolvedValue({ validFiles: [file], invalidFiles: [], allValid: true });
    mockOptimize.mockResolvedValue({
      optimized: [createFile('ok.jpg', 1_000_000)],
      warnings: [],
      skipped: 0,
      stats: { totalOriginalSize: 2000000, totalCompressedSize: 1000000 } // UP-2.M
    });

    render(
      <UploadFormProvider>
        <TestConsumer />
      </UploadFormProvider>
    );

    fireEvent.click(screen.getByTestId('trigger'));

    await waitFor(() => {
      expect(mockValidate).toHaveBeenCalled();
      expect(mockOptimize).toHaveBeenCalled();
      expect(screen.getByTestId('count').textContent).toBe('1');
    });
  });
});
