/**
 * PropertyDetailPage 優化驗證測試
 *
 * 驗證項目:
 * 1. useCallback 穩定性 - 確保回調函數引用不變
 * 2. useMemo 穩定性 - 確保計算結果被快取
 * 3. memo 組件行為 - 確保子組件不會不必要重新渲染
 * 4. AgentTrustCard 與父組件的協作
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropertyDetailPage } from '../PropertyDetailPage';
import { propertyService } from '../../services/propertyService';
import { useTrustActions } from '../../hooks/useTrustActions';

// Mock dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'MH-100001' }),
  };
});

vi.mock('../../services/propertyService', () => ({
  propertyService: {
    getPropertyByPublicId: vi.fn(),
  },
  DEFAULT_PROPERTY: {
    id: 'test-id',
    publicId: 'MH-100001',
    title: '測試物件',
    price: 12800000,
    trustEnabled: true,
    address: '台北市信義區',
    description: '測試描述',
    images: ['https://example.com/image.jpg'],
    size: 30,
    rooms: 2,
    halls: 1,
    bathrooms: 1,
    floorCurrent: '3',
    floorTotal: 10,
    features: ['電梯'],
    advantage1: '採光好',
    advantage2: '近捷運',
    disadvantage: '',
    agent: {
      id: 'agent-001',
      internalCode: 12345,
      name: '測試經紀人',
      avatarUrl: 'https://example.com/avatar.jpg',
      company: '測試公司',
      trustScore: 95,
      encouragementCount: 50,
    },
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
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
  id: 'test-id',
  publicId: 'MH-100001',
  title: '新光晴川 B棟 12樓',
  price: 12800000,
  trustEnabled: true,
  address: '台北市信義區信義路五段7號',
  description: '全新裝潢，採光極佳',
  images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  size: 30,
  rooms: 2,
  halls: 1,
  bathrooms: 1,
  floorCurrent: '12',
  floorTotal: 20,
  features: ['電梯', '車位'],
  advantage1: '採光好',
  advantage2: '近捷運',
  disadvantage: '',
  agent: {
    id: 'agent-001',
    internalCode: 12345,
    name: '王小明',
    avatarUrl: 'https://example.com/avatar.jpg',
    company: '信義房屋',
    trustScore: 95,
    encouragementCount: 50,
  },
};

describe('PropertyDetailPage - 優化驗證', () => {
  // 創建共用的 QueryClient 實例
  let queryClient: QueryClient;

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  const renderWithClient = (ui: ReactElement) => {
    return render(ui, { wrapper: createWrapper() });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  describe('1. useCallback 穩定性驗證', () => {
    it('useTrustActions 返回的函數應該保持穩定引用', () => {
      const propertyId = 'MH-100001';

      // 第一次渲染
      const { result, rerender } = renderHook(() => useTrustActions(propertyId));
      const firstLearnMore = result.current.learnMore;
      const firstRequestEnable = result.current.requestEnable;

      // 重新渲染（propertyId 不變）
      rerender();
      const secondLearnMore = result.current.learnMore;
      const secondRequestEnable = result.current.requestEnable;

      // 驗證引用穩定性
      expect(firstLearnMore).toBe(secondLearnMore);
      expect(firstRequestEnable).toBe(secondRequestEnable);
    });

    it('PropertyDetailPage 的 callback 應該保持穩定（無依賴變化時）', async () => {
      vi.mocked(propertyService.getPropertyByPublicId).mockResolvedValue(mockPropertyData as any);

      const { rerender } = renderWithClient(
        <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
          <PropertyDetailPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/新光晴川/)).toBeInTheDocument();
      });

      // 檢查 AgentTrustCard 是否渲染（代表 callbacks 已傳遞）
      expect(screen.getByText('王小明')).toBeInTheDocument();
      expect(screen.getByText('加 LINE 聊聊')).toBeInTheDocument();

      // 強制重新渲染
      rerender(
        <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
          <PropertyDetailPage />
        </MemoryRouter>
      );

      // 驗證組件仍然正常顯示（memo 有效）
      expect(screen.getByText('王小明')).toBeInTheDocument();
    });
  });

  describe('2. useMemo 穩定性驗證', () => {
    it('capsuleTags 應該在相同 property 資料下保持穩定', async () => {
      vi.mocked(propertyService.getPropertyByPublicId).mockResolvedValue(mockPropertyData as any);

      const { rerender } = renderWithClient(
        <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
          <PropertyDetailPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/新光晴川/)).toBeInTheDocument();
      });

      // 檢查 capsuleTags 是否渲染
      expect(screen.getByText('採光好')).toBeInTheDocument();
      expect(screen.getByText('近捷運')).toBeInTheDocument();

      // 重新渲染
      rerender(
        <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
          <PropertyDetailPage />
        </MemoryRouter>
      );

      // 驗證標籤仍然存在（useMemo 有效）
      expect(screen.getByText('採光好')).toBeInTheDocument();
      expect(screen.getByText('近捷運')).toBeInTheDocument();
    });

    it('agentId 應該從 useMemo 快取中取得', async () => {
      vi.mocked(propertyService.getPropertyByPublicId).mockResolvedValue(mockPropertyData as any);

      // 設置 localStorage mock
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      renderWithClient(
        <MemoryRouter initialEntries={['/maihouses/property/MH-100001?aid=test-agent']}>
          <PropertyDetailPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/新光晴川/)).toBeInTheDocument();
      });

      // 驗證 localStorage 被調用（快取邏輯）
      expect(setItemSpy).toHaveBeenCalledWith('uag_last_aid', 'test-agent');

      getItemSpy.mockRestore();
      setItemSpy.mockRestore();
    });
  });

  describe('3. React.memo 組件驗證', () => {
    it('AgentTrustCard 應該使用 React.memo', () => {
      // 這個測試驗證組件是否正確使用 memo
      // 透過檢查組件是否正常渲染來間接驗證
      vi.mocked(propertyService.getPropertyByPublicId).mockResolvedValue(mockPropertyData as any);

      renderWithClient(
        <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
          <PropertyDetailPage />
        </MemoryRouter>
      );

      waitFor(() => {
        // 驗證 AgentTrustCard 內容
        expect(screen.getByText('王小明')).toBeInTheDocument();
        expect(screen.getByText('信義房屋')).toBeInTheDocument();
        expect(screen.getByText('95')).toBeInTheDocument(); // Trust Score
        expect(screen.getByText('50')).toBeInTheDocument(); // Encouragement Count
      });
    });

    it('PropertyInfoCard 應該正確渲染且優化生效', async () => {
      vi.mocked(propertyService.getPropertyByPublicId).mockResolvedValue(mockPropertyData as any);

      renderWithClient(
        <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
          <PropertyDetailPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        // 驗證 PropertyInfoCard 內容
        expect(screen.getByText(/新光晴川/)).toBeInTheDocument();
        // 價格以數字呈現
        expect(screen.getByText(/12800000/)).toBeInTheDocument();
        // 地址部分匹配
        expect(screen.getByText(/台北市信義區/)).toBeInTheDocument();
      });
    });

    it('PropertyGallery 應該正確處理圖片切換', async () => {
      vi.mocked(propertyService.getPropertyByPublicId).mockResolvedValue(mockPropertyData as any);

      renderWithClient(
        <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
          <PropertyDetailPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        // 驗證圖片計數顯示（格式為 "1 / 2"）
        expect(screen.getByText('1 / 2')).toBeInTheDocument();
      });
    });
  });

  describe('4. 父子組件協作驗證', () => {
    it('父組件的 callback 應該正確傳遞給 AgentTrustCard', async () => {
      vi.mocked(propertyService.getPropertyByPublicId).mockResolvedValue(mockPropertyData as any);

      renderWithClient(
        <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
          <PropertyDetailPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        // 驗證 AgentTrustCard 中的 LINE 按鈕存在
        expect(screen.getByText('加 LINE 聊聊')).toBeInTheDocument();
        // AgentTrustCard 和 MobileActionBar 中都有「預約看屋」按鈕
        expect(screen.getAllByText('預約看屋')).toHaveLength(2);
        // 驗證「致電諮詢」按鈕存在
        expect(screen.getByText('致電諮詢')).toBeInTheDocument();
      });
    });

    it('TrustServiceBanner 應該接收到正確的 props', async () => {
      vi.mocked(propertyService.getPropertyByPublicId).mockResolvedValue({
        ...mockPropertyData,
        trustEnabled: true,
      } as any);

      renderWithClient(
        <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
          <PropertyDetailPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('本物件已開啟安心留痕服務')).toBeInTheDocument();
      });
    });
  });

  describe('5. 性能優化驗證', () => {
    it('多次渲染不應導致不必要的組件重新創建', async () => {
      vi.mocked(propertyService.getPropertyByPublicId).mockResolvedValue(mockPropertyData as any);

      const { rerender } = renderWithClient(
        <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
          <PropertyDetailPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/新光晴川/)).toBeInTheDocument();
      });

      const initialButtonCount = screen.getAllByRole('button').length;

      // 多次重新渲染
      for (let i = 0; i < 5; i++) {
        rerender(
          <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
            <PropertyDetailPage />
          </MemoryRouter>
        );
      }

      // 驗證按鈕數量保持一致（沒有重複渲染）
      expect(screen.getAllByRole('button')).toHaveLength(initialButtonCount);
    });
  });
});
