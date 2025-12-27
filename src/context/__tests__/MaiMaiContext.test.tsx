import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MaiMaiProvider, useMaiMai } from '../MaiMaiContext';
import { safeLocalStorage } from '../../lib/safeStorage';

// Mock safeLocalStorage
vi.mock('../../lib/safeStorage', () => ({
  safeLocalStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
}));

describe('MaiMaiContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useMaiMai', () => {
    it('throws error when used outside provider', () => {
      // Suppress console.error for this test as React errors on uncaught context
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useMaiMai());
      }).toThrow('useMaiMai must be used within MaiMaiProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('MaiMaiProvider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MaiMaiProvider>{children}</MaiMaiProvider>
    );

    describe('Mood Management', () => {
      it('initializes with default mood (idle) when storage is empty', () => {
        vi.mocked(safeLocalStorage.getItem).mockReturnValue(null);
        
        const { result } = renderHook(() => useMaiMai(), { wrapper });
        
        expect(result.current.mood).toBe('idle');
      });

      it('initializes with valid mood from storage', () => {
        vi.mocked(safeLocalStorage.getItem).mockImplementation((key) => {
          if (key === 'maimai-mood-v1') return 'happy';
          return null;
        });

        const { result } = renderHook(() => useMaiMai(), { wrapper });
        
        expect(result.current.mood).toBe('happy');
      });

      it('initializes with idle when storage has invalid mood', () => {
        vi.mocked(safeLocalStorage.getItem).mockImplementation((key) => {
          if (key === 'maimai-mood-v1') return 'invalid_matrix_mood';
          return null;
        });

        const { result } = renderHook(() => useMaiMai(), { wrapper });
        
        expect(result.current.mood).toBe('idle'); // Should fallback to idle
      });

      it('updates mood and persists to storage', () => {
        vi.mocked(safeLocalStorage.getItem).mockReturnValue(null);
        const { result } = renderHook(() => useMaiMai(), { wrapper });

        act(() => {
          result.current.setMood('celebrate');
        });

        expect(result.current.mood).toBe('celebrate');
        expect(safeLocalStorage.setItem).toHaveBeenCalledWith('maimai-mood-v1', 'celebrate');
      });

      it('handles storage errors gracefully when setting mood', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.mocked(safeLocalStorage.getItem).mockReturnValue(null);
        vi.mocked(safeLocalStorage.setItem).mockImplementation(() => {
          throw new Error('QuotaExceeded');
        });

        const { result } = renderHook(() => useMaiMai(), { wrapper });

        // Should not throw
        act(() => {
          result.current.setMood('shy');
        });

        // State should still update even if storage fails
        expect(result.current.mood).toBe('shy');
        expect(consoleSpy).toHaveBeenCalledWith('Failed to save mood:', expect.any(Error));
        
        consoleSpy.mockRestore();
      });
    });

    describe('Message Management', () => {
      it('initializes with empty messages when storage is empty', () => {
        vi.mocked(safeLocalStorage.getItem).mockReturnValue(null);
        const { result } = renderHook(() => useMaiMai(), { wrapper });
        expect(result.current.messages).toEqual([]);
      });

      it('adds messages correctly', () => {
        vi.mocked(safeLocalStorage.getItem).mockReturnValue(null);
        const { result } = renderHook(() => useMaiMai(), { wrapper });

        act(() => {
          result.current.addMessage('Hello');
        });

        expect(result.current.messages).toEqual(['Hello']);
        expect(safeLocalStorage.setItem).toHaveBeenCalledWith(
          'maimai-messages-v1', 
          JSON.stringify(['Hello'])
        );
      });

      it('keeps only the last 3 messages', () => {
        vi.mocked(safeLocalStorage.getItem).mockReturnValue(null);
        const { result } = renderHook(() => useMaiMai(), { wrapper });

        act(() => {
          result.current.addMessage('1');
          result.current.addMessage('2');
          result.current.addMessage('3');
          result.current.addMessage('4');
        });

        expect(result.current.messages).toEqual(['2', '3', '4']);
        expect(result.current.messages).toHaveLength(3);
      });

      it('ignores empty messages', () => {
        vi.mocked(safeLocalStorage.getItem).mockReturnValue(null);
        const { result } = renderHook(() => useMaiMai(), { wrapper });

        act(() => {
          result.current.addMessage('');
          result.current.addMessage('   ');
        });

        expect(result.current.messages).toEqual([]);
      });

      it('resets messages', () => {
        vi.mocked(safeLocalStorage.getItem).mockReturnValue(null);
        const { result } = renderHook(() => useMaiMai(), { wrapper });

        act(() => {
          result.current.addMessage('Test');
          result.current.resetMessages();
        });

        expect(result.current.messages).toEqual([]);
        expect(safeLocalStorage.setItem).toHaveBeenCalledWith('maimai-messages-v1', '[]');
      });

      it('handles corrupted message storage gracefully', () => {
        vi.mocked(safeLocalStorage.getItem).mockImplementation((key) => {
          if (key === 'maimai-messages-v1') return '{invalid_json}';
          return null;
        });

        const { result } = renderHook(() => useMaiMai(), { wrapper });
        
        expect(result.current.messages).toEqual([]);
      });

      it('handles storage errors gracefully when adding messages', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        vi.mocked(safeLocalStorage.getItem).mockReturnValue(null);
        vi.mocked(safeLocalStorage.setItem).mockImplementation(() => {
          throw new Error('QuotaExceeded');
        });

        const { result } = renderHook(() => useMaiMai(), { wrapper });

        act(() => {
          result.current.addMessage('Important Message');
        });

        // State update works
        expect(result.current.messages).toContain('Important Message');
        expect(consoleSpy).toHaveBeenCalledWith('Failed to save messages:', expect.any(Error));

        consoleSpy.mockRestore();
      });
    });
  });
});
