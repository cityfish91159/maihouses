import { render } from '@testing-library/react';
import { AvatarUploader } from './AvatarUploader';

vi.mock('../../../lib/notify', () => ({
  notify: {
    error: vi.fn(),
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
