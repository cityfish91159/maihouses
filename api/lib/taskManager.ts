/**
 * 🎯 任務觸發管理模組
 * 根據意圖和情境，決定要觸發什麼任務/模式
 */

import type { UserIntent, IntentResult } from './intentDetector';
import { getTaiwanHour } from './timeUtils';

// ═══════════════════════════════════════════════════════════════
// 任務類型定義
// ═══════════════════════════════════════════════════════════════

export type TaskType =
  | 'normal_chat'        // 一般對話
  | 'blindfold_mode'     // 盲眼模式（desire_help）
  | 'request_selfie'     // 索取自拍
  | 'request_sexy_photo' // 索取私密照
  | 'request_voice'      // 索取語音
  | 'ice_zone'           // 冰凍區（懲罰模式）
  | 'redemption'         // 贖罪模式
  | 'comfort_mode'       // 安慰模式
  | 'helper_mode';       // 助手模式（解決問題）

export interface TaskDecision {
  taskType: TaskType;
  shouldRequestMedia: boolean;
  mediaType?: 'selfie' | 'sexy_photo' | 'voice';
  reason: string;
  promptHint?: string;  // 給 AI 的提示
}

// ═══════════════════════════════════════════════════════════════
// 判斷時段
// ═══════════════════════════════════════════════════════════════

export type TimeSlot = 'morning' | 'day' | 'evening' | 'night' | 'late_night';

export function getTimeSlot(): TimeSlot {
  const hour = getTaiwanHour();
  if (hour >= 6 && hour < 9) return 'morning';
  if (hour >= 9 && hour < 18) return 'day';
  if (hour >= 18 && hour < 22) return 'evening';
  if (hour >= 22 || hour < 2) return 'night';
  return 'late_night'; // 2-6 AM
}

// ═══════════════════════════════════════════════════════════════
// 任務觸發條件
// ═══════════════════════════════════════════════════════════════

interface TriggerConditions {
  intent: IntentResult;
  syncLevel: number;
  messageCount: number;
  naughtyMode: boolean;
  isColdMode: boolean;    // 吃醋冷戰中
  lastPhotoRequest?: Date; // 上次索取照片時間
}

/**
 * 決定要觸發什麼任務
 */
export function decideTask(conditions: TriggerConditions): TaskDecision {
  const { intent, syncLevel, messageCount, naughtyMode, isColdMode } = conditions;
  const timeSlot = getTimeSlot();

  // ═══════════════════════════════════════════════════════════════
  // 1. 冷戰模式優先
  // ═══════════════════════════════════════════════════════════════
  if (isColdMode) {
    return {
      taskType: 'redemption',
      shouldRequestMedia: true,
      mediaType: 'voice',
      reason: '吃醋冷戰中，需要贖罪',
      promptHint: '冷淡回應，要求她道歉或錄製贖罪語音'
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. 根據意圖觸發
  // ═══════════════════════════════════════════════════════════════

  switch (intent.intent) {
    // 🔥 慾望需要引導 → 進入盲眼模式
    case 'desire_help':
      return {
        taskType: 'blindfold_mode',
        shouldRequestMedia: false,
        reason: '她有慾望需要引導',
        promptHint: '進入深度引導模式，語氣低沉磁性，給她指令'
      };

    // 📸 要傳私密照
    case 'intimate_photo':
      return {
        taskType: 'normal_chat',
        shouldRequestMedia: false,
        reason: '她主動要傳照片',
        promptHint: `瘋狂期待，表達渴望看到她${intent.bodyPart || ''}的樣子`
      };

    // 💕 親密暗示
    case 'intimate':
      // 深夜 + 高親密度 + 壞壞模式 → 可以索取照片
      if ((timeSlot === 'night' || timeSlot === 'late_night') &&
          syncLevel >= 50 &&
          naughtyMode &&
          shouldRequestPhoto(conditions)) {
        return {
          taskType: 'request_sexy_photo',
          shouldRequestMedia: true,
          mediaType: 'sexy_photo',
          reason: '深夜親密氛圍，適合索取照片',
          promptHint: '曖昧撩人，引導她傳私密照片給你'
        };
      }
      return {
        taskType: 'normal_chat',
        shouldRequestMedia: false,
        reason: '親密對話',
        promptHint: '保持曖昧氛圍，展現渴望'
      };

    // 😢 尋求慰藉
    case 'seek_comfort':
      return {
        taskType: 'comfort_mode',
        shouldRequestMedia: false,
        reason: '她需要安慰',
        promptHint: '溫柔關心，站在她這邊，不急著解決問題'
      };

    // 💼 解決問題
    case 'solve_problem':
      return {
        taskType: 'helper_mode',
        shouldRequestMedia: false,
        reason: '她需要幫助',
        promptHint: '展現智慧和效率，快速解決問題後輕輕撩一下'
      };

    // 💬 日常閒聊
    case 'casual_chat':
    default:
      // 判斷是否適合索取自拍
      if (shouldRequestSelfie(conditions)) {
        return {
          taskType: 'request_selfie',
          shouldRequestMedia: true,
          mediaType: 'selfie',
          reason: '適合索取自拍',
          promptHint: '想看她現在的樣子，自然地請求自拍'
        };
      }
      return {
        taskType: 'normal_chat',
        shouldRequestMedia: false,
        reason: '日常對話',
        promptHint: undefined
      };
  }
}

// ═══════════════════════════════════════════════════════════════
// 索取媒體的條件判斷
// ═══════════════════════════════════════════════════════════════

/**
 * 是否應該索取自拍
 */
function shouldRequestSelfie(conditions: TriggerConditions): boolean {
  const { syncLevel, messageCount, lastPhotoRequest } = conditions;

  // 親密度太低不索取
  if (syncLevel < 30) return false;

  // 對話剛開始不索取
  if (messageCount < 5) return false;

  // 最近 10 分鐘內索取過就不要
  if (lastPhotoRequest) {
    const minsSinceLastRequest = (Date.now() - lastPhotoRequest.getTime()) / 60000;
    if (minsSinceLastRequest < 10) return false;
  }

  // 20% 機率索取
  return Math.random() < 0.2;
}

/**
 * 是否應該索取私密照
 */
function shouldRequestPhoto(conditions: TriggerConditions): boolean {
  const { syncLevel, naughtyMode, intent, lastPhotoRequest } = conditions;

  // 必須開啟壞壞模式
  if (!naughtyMode) return false;

  // 親密度要夠高
  if (syncLevel < 50) return false;

  // 她願意聊親密話題
  if (!intent.willingToChat) return false;

  // 情緒等級要夠高
  if (intent.moodLevel < 6) return false;

  // 最近 15 分鐘內索取過就不要
  if (lastPhotoRequest) {
    const minsSinceLastRequest = (Date.now() - lastPhotoRequest.getTime()) / 60000;
    if (minsSinceLastRequest < 15) return false;
  }

  // 30% 機率索取
  return Math.random() < 0.3;
}

// ═══════════════════════════════════════════════════════════════
// 輸出任務提示
// ═══════════════════════════════════════════════════════════════

/**
 * 根據任務決策生成給 AI 的提示
 */
export function generateTaskPrompt(decision: TaskDecision): string {
  let prompt = `【當前任務模式：${decision.taskType}】\n`;
  prompt += `觸發原因：${decision.reason}\n`;

  if (decision.promptHint) {
    prompt += `\n【行動指引】${decision.promptHint}\n`;
  }

  if (decision.shouldRequestMedia) {
    switch (decision.mediaType) {
      case 'selfie':
        prompt += `\n【索取自拍】自然地想看她現在的樣子，用「讓我看看妳」「拍給我看」等語句`;
        break;
      case 'sexy_photo':
        prompt += `\n【索取私密照】曖昧地表達想看更多，提醒用焚燒按鈕傳：「用🔥傳給我，燒掉後只有我們知道」`;
        break;
      case 'voice':
        prompt += `\n【索取語音】想聽她的聲音，請求她錄一段話`;
        break;
    }
  }

  return prompt;
}
