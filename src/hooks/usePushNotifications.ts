/**
 * usePushNotifications Hook
 *
 * NOTIFY-2: Web Push 推播通知
 * 管理瀏覽器推播權限、訂閱與取消訂閱
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';
import { logger } from '../lib/logger';
import type {
  PushPermissionState,
  UsePushNotificationsReturn,
  PushSubscriptionKeys,
} from '../types/push.types';
import { PUSH_CONSTANTS } from '../types/push.types';

/**
 * 檢查瀏覽器是否支援 Web Push
 */
function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * 將 NotificationPermission 轉換為 PushPermissionState
 * 使用 type guard 避免 `as` 斷言
 */
function toPermissionState(permission: NotificationPermission): PushPermissionState {
  // NotificationPermission: 'default' | 'denied' | 'granted'
  // PushPermissionState: 'prompt' | 'granted' | 'denied' | 'unsupported'
  if (permission === 'default') {
    return 'prompt';
  }
  return permission; // 'granted' | 'denied' 直接返回
}

/**
 * 取得目前的推播權限狀態
 */
function getPermissionState(): PushPermissionState {
  if (!isPushSupported()) {
    return 'unsupported';
  }
  return toPermissionState(Notification.permission);
}

/**
 * 將 Base64 URL 安全字串轉為 ArrayBuffer（用於 applicationServerKey）
 * 返回 ArrayBuffer 以符合 PushManager.subscribe 的類型要求
 *
 * [NASA TypeScript Safety] 類型斷言說明：
 * - TypeScript 的 Uint8Array.buffer 類型為 ArrayBufferLike（包含 SharedArrayBuffer）
 * - 但從 new Uint8Array(length) 創建的陣列，底層 buffer 保證是 ArrayBuffer
 * - 此斷言是安全的，因為我們控制了 Uint8Array 的創建方式
 * - 使用 slice() 複製 buffer 以獲得獨立的 ArrayBuffer
 */
function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  // [NASA TypeScript Safety] 使用 slice(0) 返回一個新的 ArrayBuffer 副本
  // 這避免了 as ArrayBuffer 斷言，因為 ArrayBuffer.prototype.slice 返回 ArrayBuffer
  return outputArray.buffer.slice(0);
}

/**
 * 從 PushSubscription 提取金鑰資料
 */
function extractSubscriptionKeys(subscription: PushSubscriptionJSON): PushSubscriptionKeys | null {
  if (!subscription.endpoint || !subscription.keys) {
    return null;
  }

  const p256dh = subscription.keys.p256dh;
  const auth = subscription.keys.auth;

  if (!p256dh || !auth) {
    return null;
  }

  return {
    endpoint: subscription.endpoint,
    p256dh,
    auth,
  };
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const { isAuthenticated, user } = useAuth();
  const [permission, setPermission] = useState<PushPermissionState>(getPermissionState);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 追蹤 Service Worker registration
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);

  /**
   * 取得 VAPID 公鑰
   * 從環境變數讀取，如果沒有設定則返回 null
   */
  const getVapidPublicKey = useCallback((): string | null => {
    const key = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!key) {
      logger.warn('usePushNotifications.getVapidPublicKey.missing', {
        message: 'VITE_VAPID_PUBLIC_KEY is not set',
      });
      return null;
    }
    return key;
  }, []);

  /**
   * 註冊 Service Worker
   */
  const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!isPushSupported()) {
      logger.info('usePushNotifications.registerServiceWorker.unsupported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register(PUSH_CONSTANTS.SW_PATH, {
        scope: PUSH_CONSTANTS.SW_SCOPE,
      });

      // 等待 Service Worker 就緒
      await navigator.serviceWorker.ready;
      swRegistrationRef.current = registration;

      logger.info('usePushNotifications.registerServiceWorker.success', {
        scope: registration.scope,
      });

      return registration;
    } catch (err) {
      logger.error('usePushNotifications.registerServiceWorker.failed', {
        error: err,
      });
      throw err;
    }
  }, []);

  /**
   * 檢查目前是否已訂閱
   */
  const checkSubscription = useCallback(async (): Promise<boolean> => {
    if (!isPushSupported() || !swRegistrationRef.current) {
      return false;
    }

    try {
      const subscription = await swRegistrationRef.current.pushManager.getSubscription();
      return subscription !== null;
    } catch (err) {
      logger.warn('usePushNotifications.checkSubscription.failed', {
        error: err,
      });
      return false;
    }
  }, []);

  /**
   * 儲存訂閱到資料庫
   */
  const saveSubscriptionToDatabase = useCallback(
    async (keys: PushSubscriptionKeys): Promise<void> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { error: dbError } = await supabase.rpc('fn_upsert_push_subscription', {
        p_profile_id: user.id,
        p_endpoint: keys.endpoint,
        p_p256dh: keys.p256dh,
        p_auth: keys.auth,
        p_user_agent: navigator.userAgent,
      });

      if (dbError) {
        throw dbError;
      }

      logger.info('usePushNotifications.saveSubscriptionToDatabase.success', {
        userId: user.id,
      });
    },
    [user]
  );

  /**
   * 從資料庫刪除訂閱
   */
  const removeSubscriptionFromDatabase = useCallback(
    async (endpoint: string): Promise<void> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { error: dbError } = await supabase.rpc('fn_delete_push_subscription', {
        p_profile_id: user.id,
        p_endpoint: endpoint,
      });

      if (dbError) {
        throw dbError;
      }

      logger.info('usePushNotifications.removeSubscriptionFromDatabase.success', {
        userId: user.id,
      });
    },
    [user]
  );

  /**
   * 訂閱推播通知
   */
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isPushSupported()) {
      setError(new Error('Push notifications are not supported'));
      return false;
    }

    if (!isAuthenticated || !user) {
      setError(new Error('User not authenticated'));
      return false;
    }

    const vapidPublicKey = getVapidPublicKey();
    if (!vapidPublicKey) {
      setError(new Error('VAPID public key not configured'));
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. 請求通知權限
      const permissionResult = await Notification.requestPermission();
      setPermission(toPermissionState(permissionResult));

      if (permissionResult !== 'granted') {
        logger.info('usePushNotifications.subscribe.permissionDenied', {
          permission: permissionResult,
        });
        return false;
      }

      // 2. 註冊 Service Worker（如果尚未註冊）
      let registration = swRegistrationRef.current;
      if (!registration) {
        registration = await registerServiceWorker();
        if (!registration) {
          throw new Error('Failed to register service worker');
        }
      }

      // 3. 若已訂閱，直接同步到資料庫
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        const existingKeys = extractSubscriptionKeys(existingSubscription.toJSON());
        if (existingKeys) {
          await saveSubscriptionToDatabase(existingKeys);
          setIsSubscribed(true);
          logger.info('usePushNotifications.subscribe.alreadySubscribed', {
            userId: user.id,
          });
          return true;
        }
      }

      // 4. 訂閱推播
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToArrayBuffer(vapidPublicKey),
      });

      // 5. 提取訂閱金鑰
      const keys = extractSubscriptionKeys(subscription.toJSON());
      if (!keys) {
        throw new Error('Failed to extract subscription keys');
      }

      // 6. 儲存到資料庫
      await saveSubscriptionToDatabase(keys);

      setIsSubscribed(true);
      logger.info('usePushNotifications.subscribe.success', {
        userId: user.id,
      });
      return true;
    } catch (err) {
      logger.error('usePushNotifications.subscribe.failed', {
        error: err,
        userId: user?.id,
      });
      setError(err instanceof Error ? err : new Error('Failed to subscribe'));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, getVapidPublicKey, registerServiceWorker, saveSubscriptionToDatabase]);

  /**
   * 取消訂閱推播通知
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!swRegistrationRef.current) {
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const subscription = await swRegistrationRef.current.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;

        // 1. 取消瀏覽器訂閱
        await subscription.unsubscribe();

        // 2. 從資料庫刪除
        await removeSubscriptionFromDatabase(endpoint);
      }

      setIsSubscribed(false);
      logger.info('usePushNotifications.unsubscribe.success', {
        userId: user?.id,
      });
      return true;
    } catch (err) {
      logger.error('usePushNotifications.unsubscribe.failed', {
        error: err,
        userId: user?.id,
      });
      setError(err instanceof Error ? err : new Error('Failed to unsubscribe'));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, removeSubscriptionFromDatabase]);

  /**
   * 處理 Service Worker 的訂閱變更訊息
   */
  const handleSubscriptionChange = useCallback(
    async (subscriptionJSON: PushSubscriptionJSON) => {
      if (!user?.id) return;

      const keys = extractSubscriptionKeys(subscriptionJSON);
      if (keys) {
        try {
          await saveSubscriptionToDatabase(keys);
          logger.info('usePushNotifications.subscriptionChanged.synced', {
            userId: user.id,
          });
        } catch (err) {
          logger.error('usePushNotifications.subscriptionChanged.failed', {
            error: err,
          });
        }
      }
    },
    [user, saveSubscriptionToDatabase]
  );

  // 初始化：註冊 Service Worker 並檢查訂閱狀態
  useEffect(() => {
    if (!isPushSupported()) {
      setPermission('unsupported');
      return;
    }

    let isMounted = true;

    const init = async () => {
      try {
        // 註冊 Service Worker
        const registration = await registerServiceWorker();
        if (!registration || !isMounted) return;

        // 檢查訂閱狀態
        const subscribed = await checkSubscription();
        if (isMounted) {
          setIsSubscribed(subscribed);
        }
      } catch (err) {
        if (isMounted) {
          logger.warn('usePushNotifications.init.failed', { error: err });
        }
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [registerServiceWorker, checkSubscription]);

  // 監聽 Service Worker 的訂閱變更訊息
  useEffect(() => {
    if (!isPushSupported()) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SUBSCRIPTION_CHANGED' && event.data?.subscription) {
        handleSubscriptionChange(event.data.subscription);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [handleSubscriptionChange]);

  // 監聽權限變更
  useEffect(() => {
    if (!isPushSupported()) return;

    let permissionStatus: PermissionStatus | null = null;

    const handlePermissionChange = () => {
      setPermission(getPermissionState());
    };

    // 某些瀏覽器支援 permission change 事件
    if ('permissions' in navigator) {
      navigator.permissions
        .query({ name: 'notifications' })
        .then((status) => {
          permissionStatus = status;
          permissionStatus.onchange = handlePermissionChange;
        })
        .catch(() => {
          // 忽略不支援的情況
        });
    }

    return () => {
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, []);

  return {
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  };
}
