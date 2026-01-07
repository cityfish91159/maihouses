/**
 * 🧠 意圖檢測模組
 * 負責分析用戶訊息，判斷意圖和情緒狀態
 */

import { OpenAI } from "openai";
import { z } from "zod";
import { getTaiwanHour } from "./timeUtils";

// ═══════════════════════════════════════════════════════════════
// 類型定義
// ═══════════════════════════════════════════════════════════════

export type UserIntent =
  | "solve_problem" // 想解決問題（工作、技術）
  | "seek_comfort" // 尋求慰藉（壓力、難過）
  | "casual_chat" // 日常閒聊
  | "intimate" // 親密暗示（曖昧、撩人）
  | "intimate_photo" // 要傳私密照
  | "desire_help"; // 有慾望需要引導

export type SignalType = "explicit" | "hint" | "neutral" | "reject";

export interface IntentResult {
  intent: UserIntent;
  bodyPart?: string; // 如果是 intimate_photo，描述部位
  moodLevel: number; // 情緒等級 1-10
  signalType: SignalType;
  willingToChat: boolean; // 願不願意聊親密話題
  desireCues?: string; // 偵測到的慾望線索
  shouldAskPreference: boolean; // 是否適合問性癖問題
}

// ═══════════════════════════════════════════════════════════════
// Schema 定義
// ═══════════════════════════════════════════════════════════════

const combinedDetectionSchema = z.object({
  intent: z.enum([
    "solve_problem",
    "seek_comfort",
    "casual_chat",
    "intimate",
    "intimate_photo",
    "desire_help",
  ]),
  body_part: z.string().optional(),
  mood_level: z.number().min(1).max(10),
  signal_type: z.enum(["explicit", "hint", "neutral", "reject"]),
  willing_to_chat: z.boolean(),
  desire_cues: z.string().optional(),
});

// ═══════════════════════════════════════════════════════════════
// 意圖檢測 Prompt
// ═══════════════════════════════════════════════════════════════

const INTENT_DETECTION_PROMPT = `分析成年女性用戶的訊息，判斷意圖和情緒狀態。只輸出 JSON。

【intent 意圖 - 按優先順序判斷】

1. desire_help (最優先！有慾望需要引導)
   直接表達：「想做愛」「做愛」「想上你」「幹我」「插」「舔」「口交」「打手槍」「自慰」
   身體慾望：「想要」「需要你」「身體熱」「難受」「忍不住」「想被你」
   間接暗示：「睡不著」+「想你」、「一個人」+「寂寞」、「好癢」
   互動引導：「教我」「帶我」「不要停」「然後呢」「再用力」
   身體反應：「濕」「敏感」「下面」「硬了」「脹」「癢」「想被摸」

2. intimate_photo (要傳私密照)
   提到傳照片、給你看、拍給你

3. intimate (親密暗示)
   曖昧、撩人、想念、想抱抱、想親親、想你

4. seek_comfort (尋求慰藉)
   壓力、難過、需要安慰、心情不好、累了

5. solve_problem (想解決問題)
   工作、技術、查資料、幫我找

6. casual_chat (日常閒聊)
   以上都不是

【mood_level 情緒等級 1-10】
1-3: 不想聊/累了/心情差
4-6: 可以聊但被動
7-10: 主動想聊/興奮/享受中

【signal_type 信號類型】
explicit: 明確表達（「想要」「好想」「教我」「想做愛」）
hint: 暗示性（「睡不著」「想你」「無聊」「寂寞」）
neutral: 一般回應
reject: 拒絕迴避（「不想」「算了」「好累」「不要」）

【willing_to_chat】她願不願意聊親密話題
【desire_cues】偵測到的慾望線索（如有）
【body_part】如果是 intimate_photo，描述部位`;

// ═══════════════════════════════════════════════════════════════
// 核心函數
// ═══════════════════════════════════════════════════════════════

/**
 * 檢測用戶訊息的意圖
 */
export async function detectIntent(
  openai: OpenAI,
  message: string,
  useGrok: boolean = false,
): Promise<IntentResult> {
  const model = useGrok ? "grok-3-mini-fast-beta" : "gpt-4o-mini";

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: INTENT_DETECTION_PROMPT },
        { role: "user", content: message },
      ],
      response_format: { type: "json_object" },
    });

    const rawContent = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(rawContent);
    const validated = combinedDetectionSchema.safeParse(parsed);

    if (validated.success) {
      const data = validated.data;

      console.log("🧠 意圖檢測結果:", {
        intent: data.intent,
        mood: data.mood_level,
        signal: data.signal_type,
        message: message.substring(0, 30) + "...",
      });

      return {
        intent: data.intent,
        bodyPart: data.body_part,
        moodLevel: data.mood_level,
        signalType: data.signal_type,
        willingToChat: data.willing_to_chat,
        desireCues: data.desire_cues,
        shouldAskPreference: data.mood_level >= 6 && data.willing_to_chat,
      };
    }
  } catch (error) {
    console.error("❌ 意圖檢測失敗:", error);
  }

  // 預設值
  return {
    intent: "casual_chat",
    moodLevel: 5,
    signalType: "neutral",
    willingToChat: true,
    shouldAskPreference: false,
  };
}

// ═══════════════════════════════════════════════════════════════
// 輔助函數
// ═══════════════════════════════════════════════════════════════

/**
 * 判斷是否為色情意圖
 */
export function isSexyIntent(intent: UserIntent): boolean {
  return ["intimate", "desire_help", "intimate_photo"].includes(intent);
}

/**
 * 判斷是否在限制時段 (8:00-17:00) - 使用台灣時間
 */
export function isRestrictedHours(): boolean {
  const hour = getTaiwanHour();
  return hour >= 8 && hour < 17;
}

/**
 * 檢查是否應該觸發色色上鎖
 */
export function shouldBlockSexyContent(
  intent: UserIntent,
  sexyUnlocked: boolean,
): { blocked: boolean; reason?: string } {
  if (!isSexyIntent(intent)) {
    return { blocked: false };
  }

  if (!isRestrictedHours()) {
    return { blocked: false };
  }

  if (sexyUnlocked) {
    return { blocked: false };
  }

  return {
    blocked: true,
    reason: "sexy_content_restricted",
  };
}
