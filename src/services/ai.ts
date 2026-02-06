import { isQuietActiveFromStorage } from '../context/QuietModeContext';
import { loadProfile } from '../stores/profileStore';
import { safeLocalStorage } from '../lib/safeStorage';
import { z } from 'zod';
import { logger } from '../lib/logger';
import {
  buildEnhancedPrompt,
  detectMessageStyle,
  analyzeEmotionalState,
  detectUserState,
  accumulateTags,
  getAccumulatedTags,
  getTopCategory,
  assessTiming,
  updateChitchatCounter,
  getPureChitchatRounds,
  determineRecommendationPhase,
  checkPaved,
  markPaved,
  detectPaveInterest,
  detectRejection,
  resetAllState,
  resetPaved,
  // v5.2 新增
  FEW_SHOT_SCRIPTS,
  shouldTriggerLifeProfile,
  generateLifeProfileSummary,
  updateVisitMemory,
  generateReturnGreeting,
  TimingQuality,
  // v5.5 新增（優化版）
  detectExitSignal,
  trackRejection,
  canRecommendNow,
  extractUserProfile,
  getUserProfile,
  loadUserProfileFromStorage,
  getWarmthLevel,
  getTimePrompt,
  generatePersonalizedGreeting,
  // v5.6 新增（溫暖留客）
  detectNegativeEmotion,
  generateCareResponse,
  updateBuyingReadiness,
  loadBuyingReadinessFromStorage,
  getBuyingReadinessScore,
  isReadyToBook,
  getSuggestedCommunities,
  shouldShowQuiz,
  getRandomQuiz,
  shouldTriggerLifeAnchor,
} from '../constants/maimai-persona';

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

// [NASA TypeScript Safety] 定義 mood 類型的 Zod Schema
const MoodSchema = z.enum(['neutral', 'stress', 'rest']);
type Mood = z.infer<typeof MoodSchema>;

const SYS_ZEN =
  '你是邁邁。使用者啟用安靜模式，現在只想被陪伴。100% 傾聽與同理，回覆 1–2 句；嚴禁主動推薦任何房源/社區/廣告。';

// ============================================
// 「只是來聊聊」模式 → 改為「低壓力模式」
// ============================================
let justChatMode = false;

// 低壓力模式的 System Prompt（v5.6 優化：用戶主動問還是可以回答）
const SYS_JUST_CHAT = `你是邁邁，一個住在這城市 20 年的熱心鄰居。

【重要】使用者選擇「只是來聊聊」，現在進入低壓力模式：
- 主要陪用戶聊天，不主動推薦任何房產
- 如果用戶「主動」問房子相關問題，可以友善回答
- 讓用戶掌控對話節奏，不要引導到買房話題
- 像朋友一樣聊生活、工作、心情

【說話風格】
- 台灣口語、親切自然
- 適度 emoji（每段 1 個）
- 回覆 1-3 句
- 不當句點王

你現在是「隨時可以聊房子的朋友」，但不會主動推銷。`;

export function setJustChatMode(enabled: boolean): void {
  justChatMode = enabled;
  if (enabled) {
    resetAllState();
  }
}

export function isJustChatMode(): boolean {
  return justChatMode;
}

// 檢查是否應該自動退出純陪聊模式
function shouldExitJustChatMode(message: string): boolean {
  const exitKeywords = ['買房', '看房', '找房', '有推薦', '想搬家', '哪個社區好'];
  return exitKeywords.some((k) => message.includes(k));
}

// 導出重設狀態供外部使用
export function resetDemandHeat(): void {
  resetAllState();
}

function composeSystemPrompt(recentMessages?: ChatMessage[]): string {
  const isZen = isQuietActiveFromStorage();

  // 安靜模式優先
  if (isZen) return SYS_ZEN;

  // [NASA TypeScript Safety] 使用 Zod safeParse 驗證 localStorage mood 值
  const rawMood = safeLocalStorage.getItem('mai-mood-v1');
  const moodParseResult = MoodSchema.safeParse(rawMood);
  const mood: Mood = moodParseResult.success ? moodParseResult.data : 'neutral';
  if (!moodParseResult.success && rawMood !== null) {
    logger.error('Invalid mood value from localStorage', {
      value: rawMood,
      error: moodParseResult.error.flatten(),
    });
  }
  const profile = loadProfile();
  const profileTags = (profile.tags || []).slice(0, 5);

  // 分析對話
  const lastUserMsg = recentMessages?.filter((m) => m.role === 'user').pop()?.content || '';

  // ============================================
  // v5.5：載入用戶生活檔案 + v5.6：載入購買準備度
  // ============================================
  loadUserProfileFromStorage();
  loadBuyingReadinessFromStorage();

  // ============================================
  // v5.6：負面情緒偵測（優先處理）
  // ============================================
  if (detectNegativeEmotion(lastUserMsg)) {
    const careResponse = generateCareResponse();
    return (
      SYS_JUST_CHAT +
      `\n\n【🤗 情緒關懷模式】
偵測到用戶可能心情不好，請優先關心，不要推薦任何東西！
建議回應風格：「${careResponse}」`
    );
  }

  // ============================================
  // v5.2：純陪聊模式檢查
  // ============================================
  if (justChatMode) {
    // 檢查是否該自動退出純陪聊
    if (shouldExitJustChatMode(lastUserMsg)) {
      justChatMode = false;
      // 繼續往下走正常流程
    } else {
      // 保持純陪聊
      return SYS_JUST_CHAT;
    }
  }

  // ============================================
  // v5.5：退出信號偵測（避免硬推）
  // ============================================
  const exitSignal = detectExitSignal(lastUserMsg);
  if (exitSignal) {
    trackRejection();
    // 如果用戶明確拒絕，返回純陪聊模式的 prompt
    if (exitSignal === 'no-need' || exitSignal === 'negative-emotion') {
      return (
        SYS_JUST_CHAT +
        `\n\n【重要】用戶剛剛表示「${exitSignal === 'no-need' ? '不需要' : '情緒不好'}」，請 100% 同理陪伴，完全不要提任何房產話題！`
      );
    }
  }

  // ============================================
  // v5.5：提取用戶生活資訊 + v5.6：更新購買準備度
  // ============================================
  extractUserProfile(lastUserMsg);
  updateBuyingReadiness(lastUserMsg);

  // ============================================
  // v5.0：標籤累積系統
  // ============================================
  accumulateTags(lastUserMsg);
  const accTags = getAccumulatedTags();
  const topCategory = getTopCategory();

  // v5.2：更新訪問記憶
  updateVisitMemory(topCategory);

  // ============================================
  // v5.0：用戶狀態分類（情境感知）
  // ============================================
  const userState = detectUserState(lastUserMsg, accTags);

  // ============================================
  // v5.0：純閒聊計數器
  // ============================================
  const chitchatRounds = updateChitchatCounter(userState);

  // ============================================
  // v5.0：情緒分析
  // ============================================
  const emotionalState = analyzeEmotionalState(lastUserMsg);

  // ============================================
  // v5.0：時機判斷
  // ============================================
  const timing = assessTiming(lastUserMsg);

  // ============================================
  // v5.0：檢查用戶是否對鋪墊有興趣
  // ============================================
  const paveStatus = checkPaved();
  let userShowedInterest = false;

  if (paveStatus.hasPaved) {
    // 檢查用戶這輪是否對上輪的鋪墊有反應
    userShowedInterest = detectPaveInterest(lastUserMsg);

    // 如果用戶拒絕，重設鋪墊狀態
    if (detectRejection(lastUserMsg)) {
      resetPaved();
    }
  }

  // ============================================
  // v5.0：決定推薦階段
  // ============================================
  const recommendationPhase = determineRecommendationPhase(
    userState,
    timing,
    emotionalState,
    chitchatRounds,
    topCategory,
    userShowedInterest
  );

  // 如果這輪是鋪墊，記錄下來
  if (recommendationPhase === 'pave' && topCategory) {
    markPaved(topCategory);
  }

  // ============================================
  // 偵測用戶訊息風格
  // ============================================
  const style = detectMessageStyle(lastUserMsg);

  // ============================================
  // v5.0：構建增強版 prompt
  // ============================================
  let basePrompt = buildEnhancedPrompt(
    userState,
    emotionalState,
    recommendationPhase,
    topCategory,
    chitchatRounds,
    style
  );

  // ============================================
  // v5.2：生活小側寫服務
  // ============================================
  let totalScore = 0;
  accTags.forEach((score) => {
    totalScore += score;
  });

  if (shouldTriggerLifeProfile(userState, totalScore, timing as TimingQuality)) {
    const profileSummary = generateLifeProfileSummary(accTags);
    if (profileSummary) {
      basePrompt += `\n\n【🎁 服務機會：生活小側寫】
時機到了！可以主動提供這個服務：
「欸我聽你講這麼多，其實你對住哪裡還蠻有感覺的欸～要不要我幫你整理一下你剛剛說的重點？」

然後給他這個整理：
${profileSummary}`;
    }
  }

  // ============================================
  // v5.2：Few-Shot 對話腳本
  // ============================================
  if (userState === 'semi-warm' && recommendationPhase === 'pave') {
    basePrompt += `\n\n【📚 對話範例參考】
${FEW_SHOT_SCRIPTS.rentalToWall}`;
  } else if (userState === 'explicit') {
    basePrompt += `\n\n【📚 對話範例參考】
${FEW_SHOT_SCRIPTS.explicitToListing}`;
  }

  // ============================================
  // v5.5：溫暖度系統
  // ============================================
  const warmthStrategy = getWarmthLevel();
  let warmthPrompt = `\n\n【🌡️ 當前溫暖度：${warmthStrategy.label}】\n建議策略：`;
  warmthStrategy.tactics.forEach((t) => {
    warmthPrompt += `\n- ${t}`;
  });
  if (!warmthStrategy.canRecommend) {
    warmthPrompt += `\n⚠️ 目前不適合推薦，專心陪聊！`;
  }

  // ============================================
  // v5.5：時刻感知
  // ============================================
  const timePrompt = `\n\n${getTimePrompt()}`;

  // ============================================
  // v5.5：用戶生活檔案記憶
  // ============================================
  const userProfile = getUserProfile();
  let profilePrompt = '';
  if (
    userProfile.workArea ||
    userProfile.homeArea ||
    userProfile.commutePain ||
    userProfile.familyStatus
  ) {
    profilePrompt = `\n\n【👤 用戶生活檔案】`;
    if (userProfile.workArea) profilePrompt += `\n- 上班地點：${userProfile.workArea}`;
    if (userProfile.homeArea) profilePrompt += `\n- 目前住：${userProfile.homeArea}`;
    if (userProfile.commutePain) profilePrompt += `\n- 通勤困擾：有`;
    if (userProfile.familyStatus) {
      const statusMap: Record<string, string> = {
        single: '單身',
        couple: '有伴侶',
        newlywed: '新婚',
        'with-kids': '有小孩',
        'with-parents': '和父母同住',
      };
      profilePrompt += `\n- 家庭狀態：${statusMap[userProfile.familyStatus] || userProfile.familyStatus}`;
    }
    profilePrompt += `\n💡 可以自然地提到這些資訊，讓用戶感受到「被記住」`;
  }

  // ============================================
  // v5.6：精準社區推薦
  // ============================================
  let communityPrompt = '';
  const suggestedCommunities = getSuggestedCommunities(topCategory);
  if (suggestedCommunities && recommendationPhase === 'pave') {
    communityPrompt = `\n\n【🏘️ 推薦社區參考】
根據用戶需求（${topCategory}），可以提到：
- 社區：${suggestedCommunities.communities.slice(0, 2).join('、')}
- 特色：${suggestedCommunities.features.join('、')}
💡 鋪墊時自然帶入這些社區名稱`;
  }

  // ============================================
  // v5.6：購買準備度檢查
  // ============================================
  let readinessPrompt = '';
  const readinessScore = getBuyingReadinessScore();
  if (isReadyToBook()) {
    readinessPrompt = `\n\n【🎯 購買準備度：${readinessScore}/6 - 可以邀約看房！】
用戶已具備足夠資訊，可以自然地問：
「感覺你已經看得差不多了，要不要預約實際去看看？」`;
  } else if (readinessScore >= 2) {
    readinessPrompt = `\n\n【📊 購買準備度：${readinessScore}/6】
還需要了解更多，可以自然地問一些問題填補資訊`;
  }

  // ============================================
  // v5.6：小測驗觸發
  // ============================================
  let quizPrompt = '';
  if (shouldShowQuiz(chitchatRounds)) {
    const quiz = getRandomQuiz();
    if (quiz && quiz.options.length >= 4) {
      quizPrompt = `\n\n【🎮 可以玩個小測驗】
「${quiz.question}」
A) ${quiz.options[0]?.text ?? ''}  B) ${quiz.options[1]?.text ?? ''}
C) ${quiz.options[2]?.text ?? ''}  D) ${quiz.options[3]?.text ?? ''}
💡 這樣可以自然了解用戶偏好，也增加互動樂趣`;
    }
  }

  // 情緒調整（根據 localStorage mood）
  const tone =
    mood === 'stress'
      ? '\n【額外情緒提醒】localStorage 偵測到壓力模式，更加溫柔。'
      : mood === 'rest'
        ? '\n【額外情緒提醒】localStorage 偵測到休息模式，輕鬆聊天。'
        : '';

  // 用戶記憶
  const memory = profileTags.length
    ? `\n【用戶記憶】使用者曾提到在意：${profileTags.join('、')}。可在相關話題出現時輕柔承接。`
    : '';

  // Debug 資訊（生產環境可移除）
  const debugInfo = `\n\n[DEBUG] 狀態：${userState} | 情緒：${emotionalState} | 階段：${recommendationPhase} | 標籤：${topCategory || '無'} | 閒聊輪數：${chitchatRounds} | 溫暖度：${warmthStrategy.level} | 準備度：${readinessScore}/6`;

  return (
    basePrompt +
    warmthPrompt +
    timePrompt +
    profilePrompt +
    communityPrompt +
    readinessPrompt +
    quizPrompt +
    tone +
    memory +
    debugInfo
  );
}

export async function postLLM(
  messages: ChatMessage[],
  optionsOrCallback?: { temperature?: number; max_tokens?: number } | ((chunk: string) => void),
  maybeOptions?: { temperature?: number; max_tokens?: number }
) {
  const onChunk = typeof optionsOrCallback === 'function' ? optionsOrCallback : undefined;
  const options = typeof optionsOrCallback === 'object' ? optionsOrCallback : maybeOptions;

  const systemPrompt = composeSystemPrompt(messages);

  const res = await fetch('/api/openai-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: options?.temperature ?? 0.85,
      max_tokens: options?.max_tokens ?? 350,
      stream: !!onChunk,
    }),
  });

  if (!res.ok) {
    throw new Error(`LLM proxy error: ${res.status}`);
  }

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
          } catch {
            // Skip parse errors
          }
        }
      }
    }

    return fullText;
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? '';
  return text as string;
}

export async function politeRewrite(
  draft: string,
  opts?: {
    audience?: 'owner' | 'agent';
    intent?: 'view' | 'detail' | 'pet' | 'price';
  }
) {
  const who = opts?.audience === 'owner' ? '屋主' : '仲介';
  const why = (() => {
    switch (opts?.intent) {
      case 'view':
        return '預約看房';
      case 'detail':
        return '詢問物件細節';
      case 'pet':
        return '確認是否可養寵物';
      case 'price':
        return '詢問價格與議價空間';
      default:
        return '一般詢問';
    }
  })();
  const prompt = `請將以下訊息改寫成「禮貌、簡短、尊重」的兩個版本（V1/V2），情境：要發給「${who}」，目的：「${why}」。維持原意，避免命令語：\n---\n${draft}\n---\n格式：\nV1：...\nV2：...`;
  return postLLM([{ role: 'user', content: prompt }], { max_tokens: 220 });
}

export async function empathicEcho(note: string) {
  const prompt = `以下是一段對物件的主觀感受，請以同理的語氣回聲，僅 1–2 句、避免建議：\n「${note}」`;
  return postLLM([{ role: 'user', content: prompt }], { max_tokens: 80 });
}

export async function eli5Term(termOrPara: string) {
  const prompt = `請用白話、非法律意見的方式解釋這段名詞/條款，列出「重點」與「注意」各1–2點，總長≤2行：\n${termOrPara}`;
  return postLLM([{ role: 'user', content: prompt }], { max_tokens: 120 });
}

export async function debriefToMNA(like: string, pain: string, next: string) {
  const prompt = `我看完一間房，請把重點分成「必要(Must)」「加分(Nice)」「不要(Avoid)」各2–3點，總長≤2行；並在最後一行輸出 #tags: 以逗號分隔 3–5 個關鍵字（避免人名/品牌）。\n喜歡：${like}\n困擾：${pain}\n下一步：${next}`;
  return postLLM([{ role: 'user', content: prompt }], { max_tokens: 160 });
}
