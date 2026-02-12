import { fireEvent, render } from '@testing-library/react';
import { AvatarUploader } from './AvatarUploader';

const { mockNotifyError } = vi.hoisted(() => ({
  mockNotifyError: vi.fn(),
}));

vi.mock('../../../lib/notify', () => ({
  notify: {
    error: (...args: unknown[]) => mockNotifyError(...args),
  },
}));

const mockRevokeObjectURL = vi.fn();

const renderAvatarUploader = (avatarUrl: string | null) =>
  render(
    <AvatarUploader
      name="游杰倫"
      avatarUrl={avatarUrl}
      isUploading={false}
      onUpload={vi.fn().mockResolvedValue(undefined)}
    />
  );

describe('AvatarUploader blob URL cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: mockRevokeObjectURL,
    });
  });

  it('invalid file type should show precise error message', async () => {
    const { container } = renderAvatarUploader(null);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const invalidFile = new File(['hello'], 'avatar.gif', { type: 'image/gif' });

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(mockNotifyError).toHaveBeenCalledWith(
      '格式不支援',
      '目前檔案格式為 image/gif，請上傳 JPG、PNG 或 WebP 圖片'
    );
  });

  it('oversized file should show current size in MB', async () => {
    const { container } = renderAvatarUploader(null);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const oversizedFile = new File(['hello'], 'avatar.jpg', { type: 'image/jpeg' });
    Object.defineProperty(oversizedFile, 'size', { value: 3 * 1024 * 1024 });

    fireEvent.change(fileInput, { target: { files: [oversizedFile] } });

    expect(mockNotifyError).toHaveBeenCalledWith(
      '檔案過大',
      '目前檔案大小為 3.00MB，最大限制為 2MB'
    );
  });

  it('avatarUrl 從 blob 切換時應釋放舊 URL', () => {
    const { rerender } = renderAvatarUploader('blob:old-avatar');

    rerender(
      <AvatarUploader
        name="游杰倫"
        avatarUrl="blob:new-avatar"
        isUploading={false}
        onUpload={vi.fn().mockResolvedValue(undefined)}
      />
    );

    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:old-avatar');
  });

  it('avatarUrl 從 blob 切到非 blob 時應釋放舊 URL', () => {
    const { rerender } = renderAvatarUploader('blob:old-avatar');

    rerender(
      <AvatarUploader
        name="游杰倫"
        avatarUrl="https://cdn.example.com/avatar.jpg"
        isUploading={false}
        onUpload={vi.fn().mockResolvedValue(undefined)}
      />
    );

    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:old-avatar');
  });

  it('元件卸載時應釋放當前 blob URL', () => {
    const { unmount } = renderAvatarUploader('blob:current-avatar');

    unmount();

    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:current-avatar');
  });

  it('非 blob URL 不應呼叫 revokeObjectURL', () => {
    const { rerender, unmount } = renderAvatarUploader('https://cdn.example.com/avatar.jpg');

    rerender(
      <AvatarUploader
        name="游杰倫"
        avatarUrl="https://cdn.example.com/avatar-2.jpg"
        isUploading={false}
        onUpload={vi.fn().mockResolvedValue(undefined)}
      />
    );

    unmount();

    expect(mockRevokeObjectURL).not.toHaveBeenCalled();
  });
});
