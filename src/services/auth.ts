import { supabase } from '../lib/supabase';
import { z } from 'zod';
import { logger } from '../lib/logger';

export interface User {
  id: string;
  email: string;
  created_at: string;
}

// [NASA TypeScript Safety] 定義 User Zod Schema 進行運行時驗證
// Supabase user 物件可能缺少某些欄位，使用預設值確保符合 User 介面
const UserSchema = z.object({
  id: z.string(),
  email: z.string().default(''),
  created_at: z.string().default(''),
});

export interface AuthError {
  message: string;
  status?: number;
}

/**
 * 註冊新使用者
 */
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * 登入
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Google 登入
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${globalThis.location.origin}/`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) throw error;
  return data;
}

/**
 * 登出
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * 取得當前使用者
 */
export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * 監聽認證狀態變化
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    // [NASA TypeScript Safety] 使用 Zod safeParse 驗證 user 物件
    if (!session?.user) {
      callback(null);
      return;
    }

    const parseResult = UserSchema.safeParse(session.user);
    if (parseResult.success) {
      callback(parseResult.data);
    } else {
      logger.error('Invalid user data from auth state change', {
        error: parseResult.error.flatten(),
      });
      callback(null);
    }
  });
}

/**
 * 重設密碼
 */
export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${globalThis.location.origin}/reset-password`,
  });

  if (error) throw error;
}

/**
 * 更新密碼
 */
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
}
