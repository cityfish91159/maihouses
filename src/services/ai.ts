import { isQuietActiveFromStorage } from "../context/QuietModeContext";
import { loadProfile } from "../stores/profileStore";
import { 
  detectTriggers, 
  buildEnhancedPrompt, 
  countConversationRounds, 
  detectMessageStyle,
  updateDemandHeat,
  getDemandHeat,
  addHeatBonus,
  resetDemandHeat,
  analyzeEmotionalState,
  determineRecommendationTier,
  updateBridgeHistory,
  detectRejection,
  detectInterest
} from "../constants/maimai-persona";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const SYS_ZEN =
  "你是邁邁。使用者啟用安靜模式，現在只想被陪伴。100% 傾聯與同理，回覆 1–2 句；嚴禁主動推薦任何房源/社區/廣告。";

// ============================================
// 「只是來聊聊」模式追蹤
// ============================================
let justChatMode = false;

export function setJustChatMode(enabled: boolean): void {
  justChatMode = enabled;
  // 選擇「只是來聊聊」時，重設熱度
  if (enabled) {
    resetDemandHeat();
  }
}

export function isJustChatMode(): boolean {
  return justChatMode;
}

// 導出重設熱度供外部使用（例如開始新對話時）
export { resetDemandHeat } from "../constants/maimai-persona";

function composeSystemPrompt(recentMessages?: ChatMessage[]): string {
  const isZen = isQuietActiveFromStorage();
  
  // 安靜模式優先
  if (isZen) return SYS_ZEN;
  
  const mood = (localStorage.getItem("mai-mood-v1") as "neutral" | "stress" | "rest") || "neutral";
  const profile = loadProfile();
  const tags = (profile.tags || []).slice(0, 5);

  // 分析對話
  const lastUserMsg = recentMessages?.filter(m => m.role === 'user').pop()?.content || '';
  const prevUserMsg = recentMessages?.filter(m => m.role === 'user').slice(-2, -1)[0]?.content || '';
  
  // ============================================
  // v4.0 優化：橋接歷史追蹤
  // ============================================
  const rounds = countConversationRounds(recentMessages || []);
  const triggers = detectTriggers(lastUserMsg);
  
  // 偵測用戶對上一輪推薦的反應
  if (prevUserMsg) {
    const prevTriggers = detectTriggers(prevUserMsg);
    const firstPrevTrigger = prevTriggers[0];
    if (firstPrevTrigger) {
      const mainCategory = firstPrevTrigger.category;
      
      if (detectRejection(lastUserMsg)) {
        updateBridgeHistory(mainCategory, rounds, 'rejected');
      } else if (detectInterest(lastUserMsg)) {
        updateBridgeHistory(mainCategory, rounds, 'interested');
        addHeatBonus(20); // 有興趣，加熱度
      }
    }
  }
  
  // ============================================
  // 需求熱度系統
  // ============================================
  updateDemandHeat(lastUserMsg);
  
  // 如果用戶直接問房產相關，額外加熱度
  const realEstateKeywords = ['買房', '賣房', '看房', '物件', '房子', '房價', '社區', '坪數', '總價', '貸款'];
  if (realEstateKeywords.some(k => lastUserMsg.includes(k))) {
    addHeatBonus(25);
  }
  
  const heat = getDemandHeat();
  
  // ============================================
  // v4.0 優化：細化情緒分析
  // ============================================
  const emotionalState = analyzeEmotionalState(lastUserMsg);
  
  // ============================================
  // v4.0 優化：三層推薦策略
  // ============================================
  const recommendationTier = determineRecommendationTier(
    triggers,
    rounds,
    heat,
    emotionalState
  );
  
  // 偵測用戶訊息風格
  const style = detectMessageStyle(lastUserMsg);
  
  // ============================================
  // 使用增強版 prompt（v4.0）
  // ============================================
  let basePrompt = buildEnhancedPrompt(
    triggers, 
    rounds, 
    style, 
    heat, 
    emotionalState, 
    recommendationTier
  );

  // 情緒調整（根據 localStorage mood）
  const tone =
    mood === "stress"
      ? "\n【額外情緒提醒】localStorage 偵測到壓力模式。"
      : mood === "rest"
      ? "\n【額外情緒提醒】localStorage 偵測到休息模式。"
      : "";

  // 用戶記憶
  const memory = tags.length 
    ? `\n【用戶記憶】使用者曾提到在意：${tags.join("、")}。可在相關話題出現時輕柔承接。` 
    : "";

  // 「只是來聊聊」模式額外提醒
  const justChatReminder = (justChatMode && recommendationTier === 'empathy')
    ? "\n【特別提醒】使用者選擇『只是來聊聊』，目前保持純陪伴模式。"
    : "";

  return basePrompt + tone + memory + justChatReminder;
}

export async function postLLM(
  messages: ChatMessage[], 
  optionsOrCallback?: { temperature?: number; max_tokens?: number } | ((chunk: string) => void),
  maybeOptions?: { temperature?: number; max_tokens?: number }
) {
  // Determine if streaming is requested
  const onChunk = typeof optionsOrCallback === 'function' ? optionsOrCallback : undefined;
  const options = typeof optionsOrCallback === 'object' ? optionsOrCallback : maybeOptions;

  // 傳入最近對話以供觸發偵測
  const systemPrompt = composeSystemPrompt(messages);

  const res = await fetch("/api/openai-proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      temperature: options?.temperature ?? 0.85, // 提高溫度，更自然溫暖
      max_tokens: options?.max_tokens ?? 350,
      stream: !!onChunk
    }),
  });
  
  if (!res.ok) {
    throw new Error(`LLM proxy error: ${res.status}`);
  }

  // Handle streaming response
  if (onChunk && res.body) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed?.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              onChunk(content);
            }
          } catch (e) {
            // Skip parse errors
          }
        }
      }
    }
    
    return fullText;
  }

  // Handle non-streaming response
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? "";
  return text as string;
}

export async function politeRewrite(draft: string, opts?: { audience?: "owner" | "agent"; intent?: "view" | "detail" | "pet" | "price" }) {
  const who = opts?.audience === "owner" ? "屋主" : "仲介";
  const why = (() => {
    switch (opts?.intent) {
      case "view": return "預約看房";
      case "detail": return "詢問物件細節";
      case "pet": return "確認是否可養寵物";
      case "price": return "詢問價格與議價空間";
      default: return "一般詢問";
    }
  })();
  const prompt = `請將以下訊息改寫成「禮貌、簡短、尊重」的兩個版本（V1/V2），情境：要發給「${who}」，目的：「${why}」。維持原意，避免命令語：\n---\n${draft}\n---\n格式：\nV1：...\nV2：...`;
  return postLLM([{ role: "user", content: prompt }], { max_tokens: 220 });
}

export async function empathicEcho(note: string) {
  const prompt = `以下是一段對物件的主觀感受，請以同理的語氣回聲，僅 1–2 句、避免建議：\n「${note}」`;
  return postLLM([{ role: "user", content: prompt }], { max_tokens: 80 });
}

export async function eli5Term(termOrPara: string) {
  const prompt = `請用白話、非法律意見的方式解釋這段名詞/條款，列出「重點」與「注意」各1–2點，總長≤2行：\n${termOrPara}`;
  return postLLM([{ role: "user", content: prompt }], { max_tokens: 120 });
}

export async function debriefToMNA(like: string, pain: string, next: string) {
  const prompt = `我看完一間房，請把重點分成「必要(Must)」「加分(Nice)」「不要(Avoid)」各2–3點，總長≤2行；並在最後一行輸出 #tags: 以逗號分隔 3–5 個關鍵字（避免人名/品牌）。\n喜歡：${like}\n困擾：${pain}\n下一步：${next}`;
  return postLLM([{ role: "user", content: prompt }], { max_tokens: 160 });
}
