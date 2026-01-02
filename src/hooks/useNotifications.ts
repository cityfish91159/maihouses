/**
 * useNotifications Hook
 *
 * MSG-2: 鈴鐺通知功能（消費者 + 房仲共用）
 * 查詢 conversations 表，計算未讀私訊數量並返回通知列表
 */

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';
import type { ConversationListItem } from '../types/messaging.types';

interface UseNotificationsReturn {
    count: number;
    notifications: ConversationListItem[];
    isLoading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
    const { isAuthenticated, user, role } = useAuth();
    const [count, setCount] = useState(0);
    const [notifications, setNotifications] = useState<ConversationListItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchNotifications = async () => {
        if (!isAuthenticated || !user) {
            setCount(0);
            setNotifications([]);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // 根據用戶角色決定查詢條件
            const isAgent = role === 'agent';
            const filterField = isAgent ? 'agent_id' : 'consumer_profile_id';

            // 查詢有未讀訊息的對話（分別處理 agent 和 consumer）
            if (isAgent) {
                const { data: conversations, error: convError } = await supabase
                    .from('conversations')
                    .select(`
                        id,
                        status,
                        unread_agent,
                        agent_id,
                        consumer_session_id,
                        consumer_profile_id,
                        property_id,
                        updated_at,
                        messages (
                            content,
                            created_at,
                            sender_type
                        )
                    `)
                    .eq('agent_id', user.id)
                    .gt('unread_agent', 0)
                    .order('updated_at', { ascending: false });

                if (convError) throw convError;

                // 計算總未讀數
                const totalUnread = conversations?.reduce((sum, conv) => sum + (conv.unread_agent || 0), 0) || 0;
                setCount(totalUnread);

                // 轉換為 ConversationListItem 格式
                const notificationList: ConversationListItem[] = await Promise.all(
                    (conversations || []).map(async (conv) => {
                        // 獲取對方資訊
                        let counterpartName = 'Unknown';
                        const counterpartId = conv.consumer_profile_id;

                        if (counterpartId) {
                            const { data: profile } = await supabase
                                .from('profiles')
                                .select('name, email')
                                .eq('id', counterpartId)
                                .single();

                            counterpartName = profile?.name || profile?.email?.split('@')[0] || 'User';
                        } else {
                            // 消費者尚未回覆，顯示匿名標識
                            counterpartName = `訪客-${conv.consumer_session_id.slice(-4).toUpperCase()}`;
                        }

                        // 獲取物件資訊
                        let propertyInfo = undefined;
                        if (conv.property_id) {
                            const { data: property } = await supabase
                                .from('properties')
                                .select('public_id, title, images')
                                .eq('public_id', conv.property_id)
                                .single();

                            if (property) {
                                propertyInfo = {
                                    id: property.public_id,
                                    title: property.title,
                                    image: property.images?.[0]
                                };
                            }
                        }

                        // 獲取最新訊息
                        const messages = Array.isArray(conv.messages) ? conv.messages : [];
                        const latestMessage = messages.length > 0
                            ? messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                            : undefined;

                        return {
                            id: conv.id,
                            status: conv.status,
                            unread_count: conv.unread_agent || 0,
                            last_message: latestMessage ? {
                                content: latestMessage.content,
                                created_at: latestMessage.created_at,
                                sender_type: latestMessage.sender_type
                            } : undefined,
                            counterpart: {
                                name: counterpartName
                            },
                            property: propertyInfo
                        };
                    })
                );

                setNotifications(notificationList);
            } else {
                // Consumer
                const { data: conversations, error: convError } = await supabase
                    .from('conversations')
                    .select(`
                        id,
                        status,
                        unread_consumer,
                        agent_id,
                        consumer_session_id,
                        consumer_profile_id,
                        property_id,
                        updated_at,
                        messages (
                            content,
                            created_at,
                            sender_type
                        )
                    `)
                    .eq('consumer_profile_id', user.id)
                    .gt('unread_consumer', 0)
                    .order('updated_at', { ascending: false });

                if (convError) throw convError;

                // 計算總未讀數
                const totalUnread = conversations?.reduce((sum, conv) => sum + (conv.unread_consumer || 0), 0) || 0;
                setCount(totalUnread);

                // 轉換為 ConversationListItem 格式
                const notificationList: ConversationListItem[] = await Promise.all(
                    (conversations || []).map(async (conv) => {
                        // 獲取對方資訊（房仲）
                        let counterpartName = 'Unknown';
                        const counterpartId = conv.agent_id;

                        if (counterpartId) {
                            const { data: profile } = await supabase
                                .from('profiles')
                                .select('name, email')
                                .eq('id', counterpartId)
                                .single();

                            counterpartName = profile?.name || profile?.email?.split('@')[0] || 'Agent';
                        }

                        // 獲取物件資訊
                        let propertyInfo = undefined;
                        if (conv.property_id) {
                            const { data: property } = await supabase
                                .from('properties')
                                .select('public_id, title, images')
                                .eq('public_id', conv.property_id)
                                .single();

                            if (property) {
                                propertyInfo = {
                                    id: property.public_id,
                                    title: property.title,
                                    image: property.images?.[0]
                                };
                            }
                        }

                        // 獲取最新訊息
                        const messages = Array.isArray(conv.messages) ? conv.messages : [];
                        const latestMessage = messages.length > 0
                            ? messages.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                            : undefined;

                        return {
                            id: conv.id,
                            status: conv.status,
                            unread_count: conv.unread_consumer || 0,
                            last_message: latestMessage ? {
                                content: latestMessage.content,
                                created_at: latestMessage.created_at,
                                sender_type: latestMessage.sender_type
                            } : undefined,
                            counterpart: {
                                name: counterpartName
                            },
                            property: propertyInfo
                        };
                    })
                );

                setNotifications(notificationList);
            }
        } catch (err) {
            console.error('[useNotifications] Error:', err);
            setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
            setCount(0);
            setNotifications([]);
        } finally {
            setIsLoading(false);
        }
    };

    // 初始載入和用戶變更時重新查詢
    useEffect(() => {
        fetchNotifications();
    }, [isAuthenticated, user?.id, role]);

    return {
        count,
        notifications,
        isLoading,
        error,
        refresh: fetchNotifications
    };
}
