import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GlobalHeader } from '../../components/layout/GlobalHeader';
import { HEADER_MODES } from '../../constants/header';
import { parseConnectToken, isTokenExpired } from '../../lib/connectTokenCrypto';
import { logger } from '../../lib/logger';
import { safeLocalStorage } from '../../lib/safeStorage';

// ============================================================================
// Type Definitions
// ============================================================================

interface ConnectTokenPayload {
  conversationId: string;
  sessionId: string;
  propertyId?: string;
  exp: number;
}

// ============================================================================
// Constants
// ============================================================================

const SESSION_STORAGE_KEY = 'uag_session';

/**
 * 設置 Consumer Session（讓聊天室知道是哪個用戶）
 */
function setConsumerSession(sessionId: string): void {
  try {
    safeLocalStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  } catch {
    logger.warn('[ConnectPage] Storage unavailable while setting session', { sessionId });
  }
}

// ============================================================================
// Error Display Component
// ============================================================================

interface ErrorDisplayProps {
  title: string;
  message: string;
}

function ErrorDisplay({ title, message }: ErrorDisplayProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <GlobalHeader mode={HEADER_MODES.CONSUMER} />
      <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 pt-20">
        <div className="w-full rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 text-4xl">⚠️</div>
          <h1 className="mb-2 text-xl font-bold text-slate-800">{title}</h1>
          <p className="mb-6 text-sm text-slate-600">{message}</p>
          <a
            href="/maihouses"
            className="inline-block rounded-full bg-brand-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            返回首頁
          </a>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Loading Display Component
// ============================================================================

function LoadingDisplay() {
  return (
    <div className="min-h-screen bg-slate-50">
      <GlobalHeader mode={HEADER_MODES.CONSUMER} />
      <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 pt-20">
        <div className="w-full rounded-2xl border border-brand-100 bg-white p-8 text-center shadow-sm">
          <div className="border-brand-200 mb-4 inline-block size-8 animate-spin rounded-full border-4 border-t-brand-600" />
          <p className="text-sm text-slate-600">載入中...</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

type TokenStatus = 'loading' | 'invalid' | 'expired' | 'redirecting';

interface TokenState {
  status: TokenStatus;
  payload: ConnectTokenPayload | null;
}

/**
 * Connect Page - LINE 通知點擊後的入口頁面
 *
 * 功能：
 * 1. 解析 URL 中的 token 參數（支援加密格式）
 * 2. 驗證 token 有效性和過期時間
 * 3. 設置 consumer session（恢復用戶身份）
 * 4. 自動導向到對應的聊天室
 *
 * URL 格式：/maihouses/chat/connect?token=xxx
 */
export default function ConnectPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');

  // Token 狀態（異步解密需要 loading 狀態）
  const [tokenState, setTokenState] = useState<TokenState>({
    status: 'loading',
    payload: null,
  });
  const { status, payload } = tokenState;

  // 異步解析 token（支援加密格式）
  useEffect(() => {
    async function parseToken() {
      if (!token) {
        setTokenState({ status: 'invalid', payload: null });
        return;
      }

      const parsed = await parseConnectToken(token);
      if (!parsed) {
        setTokenState({ status: 'invalid', payload: null });
        return;
      }

      if (isTokenExpired(parsed)) {
        setTokenState({ status: 'expired', payload: null });
        return;
      }

      setTokenState({ status: 'redirecting', payload: parsed });
    }

    parseToken();
  }, [token]);

  // 只在 token 有效時執行導向（副作用）
  useEffect(() => {
    if (status === 'redirecting' && payload) {
      setConsumerSession(payload.sessionId);
      navigate(`/maihouses/chat/${payload.conversationId}`, {
        replace: true,
      });
    }
  }, [status, payload, navigate]);

  // OG Meta 設定（讓 LINE 預覽顯示正確）
  const ogMeta = (
    <Helmet>
      <title>邁房子 - 查看訊息</title>
      <meta property="og:title" content="邁房子 - 你有一則新訊息" />
      <meta property="og:description" content="房仲傳送了一則訊息，點擊查看並回覆" />
      <meta property="og:image" content="https://maihouses.vercel.app/og-chat.png" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="邁房子 MaiHouses" />
    </Helmet>
  );

  // 根據狀態顯示不同內容
  switch (status) {
    case 'expired':
      return (
        <>
          {ogMeta}
          <ErrorDisplay
            title="連結已過期"
            message="此連結已超過 7 天有效期限，請聯繫房仲重新發送訊息。"
          />
        </>
      );

    case 'invalid':
      return (
        <>
          {ogMeta}
          <ErrorDisplay title="連結無效" message="此連結格式不正確或已損壞，請確認連結是否完整。" />
        </>
      );

    case 'redirecting':
    default:
      return (
        <>
          {ogMeta}
          <LoadingDisplay />
        </>
      );
  }
}
