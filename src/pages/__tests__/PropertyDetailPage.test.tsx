/**
 * PropertyDetailPage Integration Tests
 *
 * 測試策略：真實用戶行為測試 + 錯誤場景 + 邊緣案例
 * - 用戶互動流程測試
 * - 錯誤處理驗證
 * - 邊緣案例覆蓋
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PropertyDetailPage } from '../PropertyDetailPage';
import { propertyService } from '../../services/propertyService';
import { toast } from 'sonner';

// Mock navigator.sendBeacon
Object.defineProperty(global.navigator, 'sendBeacon', {
  writable: true,
  value: vi.fn(() => true),
});

// Mock react-router-dom useParams
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'MH-100001' }),
  };
});

// Mock dependencies
vi.mock('../../services/propertyService', () => ({
  propertyService: {
    getPropertyByPublicId: vi.fn(),
  },
  DEFAULT_PROPERTY: {
    id: 'test-id',
    publicId: 'MH-100001',
    title: '測試物件',
    price: 12800000,
    trustEnabled: false,
    address: '台北市信義區',
    description: '測試描述',
    images: ['https://example.com/image.jpg'],
    size: 30,
    rooms: 2,
    halls: 1,
    bathrooms: 1,
    floorCurrent: '3',
    floorTotal: 10,
    features: [],
    advantage1: '',
    advantage2: '',
    disadvantage: '',
    agent: {
      id: 'default-agent',
      internalCode: 0,
      name: '預設經紀人',
      avatarUrl: 'https://example.com/avatar.jpg',
      company: '預設公司',
      trustScore: 0,
      encouragementCount: 0,
    },
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('../../hooks/useTrustActions', () => ({
  useTrustActions: () => ({
    learnMore: vi.fn(),
    requestEnable: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('../../hooks/usePropertyTracker', () => ({
  usePropertyTracker: () => ({
    trackPhotoClick: vi.fn(),
    trackLineClick: vi.fn(),
    trackCallClick: vi.fn(),
    trackMapClick: vi.fn(),
  }),
}));

const mockPropertyData = {
  publicId: 'MH-100001',
  title: '新光晴川 B棟 12樓',
  price: 12800000,
  trustEnabled: true,
  address: '台北市信義區',
  images: ['https://example.com/image.jpg'],
  size: 30,
  rooms: 2,
  halls: 1,
  bathrooms: 1,
  agent: {
    id: 'agent-001',
    name: '測試經紀人',
    phone: '0912345678',
    avatarUrl: 'https://example.com/avatar.jpg',
    company: '測試房仲',
    trustScore: 95,
  },
  district: '信義區',
};

describe('PropertyDetailPage - User Behavior Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('真實用戶行為測試', () => {
    it('trustEnabled=true 時應顯示已開啟狀態橫幅', async () => {
      vi.mocked(propertyService.getPropertyByPublicId).mockResolvedValue(mockPropertyData as any);

      render(
        <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
          <PropertyDetailPage />
        </MemoryRouter>
      );

      await waitFor(
        () => {
          expect(screen.getByText('本物件已開啟安心留痕服務')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it('trustEnabled=false 時應顯示未開啟狀態橫幅', async () => {
      vi.mocked(propertyService.getPropertyByPublicId).mockResolvedValue({
        ...mockPropertyData,
        trustEnabled: false,
      } as any);

      render(
        <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
          <PropertyDetailPage />
        </MemoryRouter>
      );

      await waitFor(
        () => {
          expect(screen.getByText('本物件尚未開啟安心留痕服務')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it('頁面載入時應顯示正確的房源標題', async () => {
      vi.mocked(propertyService.getPropertyByPublicId).mockResolvedValue(mockPropertyData as any);

      render(
        <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
          <PropertyDetailPage />
        </MemoryRouter>
      );

      await waitFor(
        () => {
          expect(screen.getByText(/新光晴川/)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
  });

  describe('Error Scenarios', () => {
    it('網路錯誤時應顯示錯誤訊息', async () => {
      vi.mocked(propertyService.getPropertyByPublicId).mockRejectedValue(
        new Error('NetworkError: Failed to fetch')
      );

      render(
        <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
          <PropertyDetailPage />
        </MemoryRouter>
      );

      await waitFor(
        () => {
          expect(toast.error).toHaveBeenCalledWith(
            '載入失敗',
            expect.objectContaining({
              description: expect.stringContaining('網路'),
            })
          );
        },
        { timeout: 5000 }
      );
    });

    it('API 500 錯誤時應顯示重試選項', async () => {
      vi.mocked(propertyService.getPropertyByPublicId).mockRejectedValue(
        new Error('500 Internal Server Error')
      );

      render(
        <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
          <PropertyDetailPage />
        </MemoryRouter>
      );

      await waitFor(
        () => {
          expect(toast.error).toHaveBeenCalledWith(
            '載入失敗',
            expect.objectContaining({
              description: expect.stringContaining('伺服器異常'),
              action: expect.objectContaining({
                label: '重新載入',
              }),
            })
          );
        },
        { timeout: 5000 }
      );
    });

    it('404 錯誤時應顯示物件不存在訊息', async () => {
      vi.mocked(propertyService.getPropertyByPublicId).mockRejectedValue(
        new Error('404 not found')
      );

      render(
        <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
          <PropertyDetailPage />
        </MemoryRouter>
      );

      await waitFor(
        () => {
          expect(toast.error).toHaveBeenCalledWith(
            '載入失敗',
            expect.objectContaining({
              description: expect.stringContaining('不存在或已下架'),
            })
          );
        },
        { timeout: 5000 }
      );
    });
  });

  describe('Edge Cases', () => {
    it('trustEnabled=undefined 時應顯示未開啟狀態（fallback）', async () => {
      vi.mocked(propertyService.getPropertyByPublicId).mockResolvedValue({
        ...mockPropertyData,
        trustEnabled: undefined,
      } as any);

      render(
        <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
          <PropertyDetailPage />
        </MemoryRouter>
      );

      await waitFor(
        () => {
          expect(screen.getByText('本物件尚未開啟安心留痕服務')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
  });
});
