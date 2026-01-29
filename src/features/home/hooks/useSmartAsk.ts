import { useReducer, useCallback, useRef, startTransition } from 'react';
import { aiAsk } from '../../../services/api';
import { trackEvent } from '../../../services/analytics';
import type { AiMessage, PropertyCard } from '../../../types';
import { safeLocalStorage } from '../../../lib/safeStorage';

interface SmartAskState {
  messages: AiMessage[];
  reco: PropertyCard[];
  loading: boolean;
  totalTokens: number;
}

type SmartAskAction =
  | { type: 'START_ASK'; payload: string }
  | { type: 'UPDATE_AI_CHUNK'; payload: string }
  | {
      type: 'FINISH_ASK';
      payload: {
        answer?: string | undefined;
        recommends: PropertyCard[];
        tokens?: number | undefined;
      };
    }
  | { type: 'SET_ERROR'; payload: string };

function smartAskReducer(state: SmartAskState, action: SmartAskAction): SmartAskState {
  switch (action.type) {
    case 'START_ASK':
      const userMsg: AiMessage = {
        role: 'user',
        content: action.payload,
        timestamp: new Date().toISOString(),
      };
      const aiPlaceholder: AiMessage = {
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      };
      return {
        ...state,
        messages: [...state.messages, userMsg, aiPlaceholder],
        loading: true,
      };
    case 'UPDATE_AI_CHUNK':
      return {
        ...state,
        messages: state.messages.map((msg, i) =>
          i === state.messages.length - 1 ? { ...msg, content: msg.content + action.payload } : msg
        ),
      };
    case 'FINISH_ASK':
      return {
        ...state,
        loading: false,
        reco: action.payload.recommends,
        totalTokens: state.totalTokens + (action.payload.tokens || 0),
        messages: state.messages.map((msg, i) =>
          i === state.messages.length - 1 && action.payload.answer
            ? { ...msg, content: action.payload.answer }
            : msg
        ),
      };
    case 'SET_ERROR':
      return {
        ...state,
        messages: state.messages.map((msg, i) =>
          i === state.messages.length - 1 ? { ...msg, content: action.payload } : msg
        ),
        loading: false,
      };
    default:
      return state;
  }
}

export function useSmartAsk() {
  const [state, dispatch] = useReducer(smartAskReducer, {
    messages: [],
    reco: [],
    loading: false,
    totalTokens: 0,
  });
  const chunkRef = useRef('');
  const flushScheduled = useRef(false);

  const sendMessage = useCallback(
    async (input: string) => {
      const trimmedInput = input.trim();
      if (!trimmedInput || state.loading) return;

      dispatch({ type: 'START_ASK', payload: trimmedInput });
      trackEvent('ai_message_sent', '/');

      try {
        let isStreamingComplete = false;
        const res = await aiAsk(
          {
            messages: [...state.messages, { role: 'user', content: trimmedInput }],
          },
          (chunk: string) => {
            isStreamingComplete = true;
            chunkRef.current += chunk;
            if (!flushScheduled.current) {
              flushScheduled.current = true;
              requestAnimationFrame(() => {
                flushScheduled.current = false;
                if (!chunkRef.current) return;
                const buffered = chunkRef.current;
                chunkRef.current = '';
                startTransition(() => {
                  dispatch({ type: 'UPDATE_AI_CHUNK', payload: buffered });
                });
              });
            }
          }
        );

        if (res.ok && res.data) {
          const r = res.data.recommends || [];
          if (r[0]?.communityId) safeLocalStorage.setItem('recoCommunity', r[0].communityId);

          dispatch({
            type: 'FINISH_ASK',
            payload: {
              answer: !isStreamingComplete && res.data.answers ? res.data.answers[0] : undefined,
              recommends: r,
              tokens: res.data.usage?.totalTokens,
            },
          });
        } else {
          dispatch({
            type: 'SET_ERROR',
            payload: '抱歉，AI 服務目前暫時不可用，請稍後再試。',
          });
        }
      } catch (e) {
        dispatch({
          type: 'SET_ERROR',
          payload: '抱歉，AI 服務連線失敗（可能未設定金鑰）。',
        });
      }
    },
    [state.messages, state.loading]
  );

  return {
    messages: state.messages,
    reco: state.reco,
    loading: state.loading,
    totalTokens: state.totalTokens,
    sendMessage,
  };
}
