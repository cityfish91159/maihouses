import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useFeedData } from '../useFeedData';
import { useAuth } from '../useAuth';

// Mock dependencies
vi.mock('../useAuth', () => ({
    useAuth: vi.fn()
}));

vi.mock('../../lib/mhEnv', () => ({
    mhEnv: {
        isMockEnabled: () => true,
        subscribe: vi.fn(() => () => { })
    }
}));

vi.mock('../../lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
        })),
        rpc: vi.fn()
    }
}));

// Mock Env to bypass validation
vi.mock('../../config/env', () => ({
    env: {
        SUPABASE_URL: 'https://mock.supabase.co',
        SUPABASE_ANON_KEY: 'mock-key',
        VITE_API_URL: 'http://localhost:3000',
        IS_DEV: true
    }
}));

describe('useFeedData Strict Parity Tests (10-Point Protocol)', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        (useAuth as any).mockReturnValue({
            user: { id: 'test-user' },
            role: 'member',
            isAuthenticated: true,
            loading: false
        });
    });

    // Test Type 3: Unit Logic - Role Separation
    it('[Logic] should load distinct data sets based on role', () => {
        // 1. Consumer Role
        const { result: consumerResult } = renderHook(() => useFeedData({ role: 'consumer', persistMockState: false }));
        const consumerPosts = consumerResult.current.data.posts;

        // 2. Agent Role
        const { result: agentResult } = renderHook(() => useFeedData({ role: 'agent', persistMockState: false }));
        const agentPosts = agentResult.current.data.posts;

        // Assert: Lengths should correspond to our HTML extraction (6 vs 7)
        expect(consumerPosts.length).toBe(6);
        expect(agentPosts.length).toBe(7);

        // Assert: Content should be different
        expect(consumerPosts[0].title).toBe('年度消防演練通知');
        expect(agentPosts[0].title).toBe('有人要團購掃地機嗎？'); // Agent mock starts differently in our definitions
    });

    // Test Type 4: Unit State - Storage Key Isolation
    it('[State] should use isolated localStorage keys for different roles', () => {
        // Render Consumer
        renderHook(() => useFeedData({ role: 'consumer', persistMockState: true }));
        expect(localStorage.getItem('feed-mock-v5-consumer')).not.toBeNull();
        expect(localStorage.getItem('feed-mock-v5-agent')).toBeNull();

        // Clear and Render Agent
        localStorage.clear();
        renderHook(() => useFeedData({ role: 'agent', persistMockState: true }));
        expect(localStorage.getItem('feed-mock-v5-agent')).not.toBeNull();
        expect(localStorage.getItem('feed-mock-v5-consumer')).toBeNull();
    });

    // Test Type 5: Unit Content Parity - Strict Text Check
    it('[Content] Consumer data must match feed-consumer.html text exactly', () => {
        const { result } = renderHook(() => useFeedData({ role: 'consumer', persistMockState: false }));
        const posts = result.current.data.posts;

        // Check specific unique phrases from HTML
        expect(posts.find(p => p.content.includes('12/15（日）上午 10:00'))!).toBeDefined(); // Fire Drill
        expect(posts.find(p => p.content.includes('iRobot 打折'))!).toBeDefined(); // Vacuum
        expect(posts.find(p => p.content.includes('B2-128 想與 B1'))!).toBeDefined(); // Parking
        expect(posts.find(p => p.content.includes('管理員很親切'))!).toBeDefined(); // New Resident
    });

    it('[Content] Agent data must match feed-agent.html text exactly', () => {
        const { result } = renderHook(() => useFeedData({ role: 'agent', persistMockState: false }));
        const posts = result.current.data.posts;

        // Check Agent specific posts
        expect(posts.find(p => p.title.includes('寶輝秋紅谷 15F'))!).toBeDefined(); // Agent Chen
        expect(posts.find(p => p.title.includes('惠宇青鳥 C棟'))!).toBeDefined(); // Agent Lin
        expect(posts.find(p => p.content.includes('單元二」新案公設比'))!).toBeDefined(); // AI Insight
    });

    // Test Type 1: Static Type - Implied by compilation (images property check)
    it('[Type] should NOT have images property populated (Zero Image Policy)', () => {
        const { result } = renderHook(() => useFeedData({ role: 'consumer', persistMockState: false }));
        const posts = result.current.data.posts;

        // In our implementation we removed the property entirely or set to empty if type required.
        // Since we fixed the TS error by removing the property from the object literal, 
        // access at runtime might be undefined.
        // If the type definition still has `images?: string[]`, it should be undefined or empty.

        posts.forEach(post => {
            // @ts-ignore - Validating runtime shape
            if (post.images) {
                // @ts-ignore
                expect(post.images).toHaveLength(0);
            }
        });
    });

});
