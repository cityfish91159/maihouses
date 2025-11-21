import { useState, useCallback } from 'react';
import { aiAsk } from '../../../services/api';
import { trackEvent } from '../../../services/analytics';
import type { AiMessage, PropertyCard } from '../../../types';

export function useSmartAsk() {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [reco, setReco] = useState<PropertyCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalTokens, setTotalTokens] = useState(0);

  const sendMessage = useCallback(async (input: string) => {
    if (!input.trim() || loading) return;

    const userMsg: AiMessage = { 
      role: 'user', 
      content: input.trim(), 
      timestamp: new Date().toISOString() 
    };
    
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    trackEvent('ai_message_sent', '/');

    // Add placeholder for AI response
    const aiMsg: AiMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, aiMsg]);

    try {
      let isStreamingComplete = false;
      const res = await aiAsk(
        { messages: newMessages },
        (chunk: string) => {
          isStreamingComplete = true;
          setMessages(prev => {
            const updated = [...prev];
            const lastMsg = updated[updated.length - 1];
            if (lastMsg) {
              const newMsg: AiMessage = {
                role: lastMsg.role || 'assistant',
                content: (lastMsg.content || '') + chunk
              };
              if (lastMsg.timestamp) {
                newMsg.timestamp = lastMsg.timestamp;
              }
              updated[updated.length - 1] = newMsg;
            }
            return updated;
          });
        }
      );

      if (res.ok && res.data) {
        // If not streaming or streaming failed but we got a final answer
        if (!isStreamingComplete && res.data.answers && res.data.answers.length > 0) {
          setMessages(prev => {
            const updated = [...prev];
            if (updated.length > 0) {
              const last = updated[updated.length - 1];
              updated[updated.length - 1] = {
                ...last,
                role: 'assistant',
                content: res.data!.answers[0] || ''
              };
            }
            return updated;
          });
        }
        
        const r = res.data.recommends || [];
        setReco(r);
        if (r[0]?.communityId) localStorage.setItem('recoCommunity', r[0].communityId);

        if (res.data.usage?.totalTokens) {
          setTotalTokens(prev => prev + res.data!.usage!.totalTokens);
        }
      } else {
        // Error handling for API failure
        setMessages(prev => {
          const updated = [...prev];
          if (updated.length > 0) {
            const last = updated[updated.length - 1];
            updated[updated.length - 1] = {
              ...last,
              role: 'assistant',
              content: '抱歉，AI 服務目前暫時不可用，請稍後再試。您也可以先描述需求讓我為您推薦房源格局與區域喔。'
            };
          }
          return updated;
        });
      }
    } catch (e) {
      // Network or other error
      setMessages(prev => {
        const updated = [...prev];
        if (updated.length > 1) {
           // Remove the empty assistant message if it failed immediately? 
           // Or just update it with error message. Updating is safer.
           const last = updated[updated.length - 1];
           updated[updated.length - 1] = {
             ...last,
             role: 'assistant',
             content: '抱歉，AI 服務連線失敗（可能未設定金鑰）。請稍後再試，或通知我們協助處理。'
           };
        }
        return updated;
      });
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  return {
    messages,
    reco,
    loading,
    totalTokens,
    sendMessage
  };
}