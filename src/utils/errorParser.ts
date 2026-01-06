interface SupabaseError {
    code?: string;
    message?: string;
}

export class PropertyServiceError extends Error {
    constructor(message: string, public originalError?: unknown, public code?: string) {
        super(message);
        this.name = 'PropertyServiceError';
    }
}

export function parseSupabaseError(error: unknown): string {
    if (!error) return '發生未知錯誤';
    if (typeof error === 'string') return error;

    const supabaseError = error as SupabaseError;

    // 處理 Supabase / PostgreSQL 錯誤碼
    if (supabaseError.code) {
        switch (supabaseError.code) {
            case '23505': // unique_violation
                return '此資料已存在，請勿重複提交';
            case '42501': // insufficient_privilege
                return '您沒有權限執行此操作，請確認是否已登入';
            case '23503': // foreign_key_violation
                return '關聯資料錯誤 (例如：無效的 agent_id)';
            case 'PGRST116': // The result contains 0 rows
                return '找不到請求的資料';
        }
    }

    // 處理 Supabase JS Client 錯誤結構
    if (supabaseError.message) {
        if (supabaseError.message.includes('JWT expired')) return '登入時效已過，請重新登入';
        if (supabaseError.message.includes('network')) return '網路連線不穩定，請檢查您的網路狀況';
        return supabaseError.message;
    }

    return '系統忙碌中，請稍後再試';
}
