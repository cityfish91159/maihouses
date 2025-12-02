/**
 * 內容審核工具
 * 
 * 用於檢測敏感詞、廣告詞等不當內容
 * 這是前端初步過濾，後端仍需複審
 */

// 敏感詞列表（基礎版，可擴充）
const SENSITIVE_WORDS = [
  // 辱罵類
  '白癡', '智障', '廢物', '垃圾', '去死', '滾蛋',
  // 詐騙/誇大類
  '保證賺', '穩賺不賠', '免費送', '立即致富',
  // 其他不當內容
  '色情', '賭博', '毒品',
];

// 廣告詞列表
const AD_WORDS = [
  '加LINE', '加賴', '私訊領', '限時優惠', '最後機會',
  '點擊連結', 'bit.ly', 'tinyurl', '折扣碼',
  '代購', '代辦', '保證過件',
];

// 社區名稱黑名單（不該作為社區名的詞）
const COMMUNITY_NAME_BLACKLIST = [
  '透天', '店面', '華廈', '公寓', '套房', '大樓',
  '出租', '出售', '急售', '降價', '特價', '便宜',
  '超值', '搶手', '稀有', '唯一',
  'A棟', 'B棟', 'C棟', 'A區', 'B區', 'C區',
];

export interface ContentCheckResult {
  passed: boolean;
  issues: {
    type: 'sensitive' | 'ad' | 'blacklist' | 'format';
    word?: string;
    message: string;
  }[];
}

/**
 * 檢查文字內容是否包含敏感詞
 */
export function checkContent(text: string): ContentCheckResult {
  const issues: ContentCheckResult['issues'] = [];
  const lowerText = text.toLowerCase();

  // 檢查敏感詞
  for (const word of SENSITIVE_WORDS) {
    if (text.includes(word)) {
      issues.push({
        type: 'sensitive',
        word,
        message: `包含不當用語「${word}」`,
      });
    }
  }

  // 檢查廣告詞
  for (const word of AD_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      issues.push({
        type: 'ad',
        word,
        message: `疑似廣告內容「${word}」`,
      });
    }
  }

  return {
    passed: issues.length === 0,
    issues,
  };
}

/**
 * 檢查社區名稱是否有效
 */
export function checkCommunityName(name: string): ContentCheckResult {
  const issues: ContentCheckResult['issues'] = [];
  const trimmed = name.trim();

  // 長度檢查
  if (trimmed.length < 2) {
    issues.push({
      type: 'format',
      message: '名稱太短，至少需要 2 個字',
    });
  }

  if (trimmed.length > 30) {
    issues.push({
      type: 'format',
      message: '名稱太長，最多 30 個字',
    });
  }

  // 黑名單檢查
  for (const word of COMMUNITY_NAME_BLACKLIST) {
    if (trimmed === word || new RegExp(`^${word}$`, 'i').test(trimmed)) {
      issues.push({
        type: 'blacklist',
        word,
        message: `「${word}」不是正式社區名稱，請輸入完整社區名`,
      });
    }
  }

  // 格式檢查：純地址（路街巷弄+號）
  if (/^.*[路街巷弄]\d+號?$/.test(trimmed) && !/社區|大樓|花園|莊園/.test(trimmed)) {
    issues.push({
      type: 'format',
      message: '這看起來是地址，請輸入社區名稱',
    });
  }

  // 格式檢查：純數字
  if (/^\d+$/.test(trimmed)) {
    issues.push({
      type: 'format',
      message: '社區名稱不能只有數字',
    });
  }

  // 格式檢查：純英文（可能是打錯）
  if (/^[a-zA-Z\s]+$/.test(trimmed) && trimmed.length < 5) {
    issues.push({
      type: 'format',
      message: '請輸入中文社區名稱',
    });
  }

  // 廣告詞檢查
  for (const word of ['超便宜', '稀有', '唯一', '急售', '降價', '特價']) {
    if (trimmed.includes(word)) {
      issues.push({
        type: 'ad',
        word,
        message: `社區名稱不應包含「${word}」`,
      });
    }
  }

  return {
    passed: issues.length === 0,
    issues,
  };
}

/**
 * 檢查「兩好一公道」內容品質
 */
export function checkPropertyReview(text: string, type: 'advantage' | 'disadvantage'): ContentCheckResult {
  const issues: ContentCheckResult['issues'] = [];
  const trimmed = text.trim();

  // 基本內容檢查
  const contentCheck = checkContent(trimmed);
  issues.push(...contentCheck.issues);

  // 檢查是否太簡短/無意義
  if (trimmed.length > 0 && trimmed.length < 3) {
    issues.push({
      type: 'format',
      message: '內容太簡短，請詳細描述',
    });
  }

  // 檢查純標點符號
  if (/^[，。！？、；：""''（）【】]+$/.test(trimmed)) {
    issues.push({
      type: 'format',
      message: '請輸入有意義的內容',
    });
  }

  // 檢查重複字元
  if (/(.)\1{4,}/.test(trimmed)) {
    issues.push({
      type: 'format',
      message: '請勿輸入重複字元',
    });
  }

  return {
    passed: issues.length === 0,
    issues,
  };
}

export default {
  checkContent,
  checkCommunityName,
  checkPropertyReview,
};
