/**
 * 內容審核工具
 *
 * 用於檢測敏感詞、廣告詞等不當內容
 * 這是前端初步過濾，後端仍需複審
 */

// 敏感詞列表（基礎版，可擴充）
const SENSITIVE_WORDS = [
  // 辱罵類
  '白癡',
  '智障',
  '廢物',
  '垃圾',
  '去死',
  '滾蛋',
  // 詐騙/誇大類
  '保證賺',
  '穩賺不賠',
  '免費送',
  '立即致富',
  // 其他不當內容
  '色情',
  '賭博',
  '毒品',
];

// 廣告詞列表
const AD_WORDS = [
  '加LINE',
  '加賴',
  '私訊領',
  '限時優惠',
  '最後機會',
  '點擊連結',
  'bit.ly',
  'tinyurl',
  '折扣碼',
  '代購',
  '代辦',
  '保證過件',
];

// 社區名稱黑名單（不該作為社區名的詞）
const COMMUNITY_NAME_BLACKLIST = [
  '透天',
  '店面',
  '華廈',
  '公寓',
  '套房',
  '大樓',
  '出租',
  '出售',
  '急售',
  '降價',
  '特價',
  '便宜',
  '超值',
  '搶手',
  '稀有',
  '唯一',
  'A棟',
  'B棟',
  'C棟',
  'A區',
  'B區',
  'C區',
];

/**
 * 預編譯 Regex 模式，提升效能 (Google 級別優化)
 */
const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// 1. 敏感詞 Regex (單次掃描)
const SENSITIVE_REGEX = new RegExp(
  SENSITIVE_WORDS.map((w) =>
    escapeRegex(w.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').toLowerCase())
  ).join('|'),
  'i'
);

// 2. 廣告詞 Regex (支援干擾字元變體)
const AD_REGEX_PATTERN = AD_WORDS.map((word) =>
  word
    .split('')
    .map((char) => escapeRegex(char))
    .join('[^\\u4e00-\\u9fa5a-zA-Z0-9]{0,2}')
).join('|');
const AD_REGEX = new RegExp(AD_REGEX_PATTERN, 'i');

// 3. 社區黑名單 Regex
const COMMUNITY_BLACKLIST_REGEX = new RegExp(
  `^(${COMMUNITY_NAME_BLACKLIST.map(escapeRegex).join('|')})$`,
  'i'
);

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
 * 採用 Regex 強化版，可過濾干擾字元（如：幹.你.娘、加-L-I-N-E）
 * 效能優化：使用預編譯 Regex 達成 O(N) 匹配
 */
export function checkContent(text: string): ContentCheckResult {
  const issues: ContentCheckResult['issues'] = [];
  if (!text) return { passed: true, issues: [] };

  // 建立干擾字元過濾後的純文字 (移除所有標點符號、空白、特殊字元)
  const cleanText = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').toLowerCase();

  // 1. 檢查敏感詞 (使用預編譯 Regex)
  const sensitiveMatch = cleanText.match(SENSITIVE_REGEX);
  if (sensitiveMatch) {
    issues.push({
      type: 'sensitive',
      word: sensitiveMatch[0],
      message: `包含不當用語`,
    });
  }

  // 2. 檢查廣告詞 (使用預編譯 Regex 偵測變體)
  const adMatch = text.match(AD_REGEX);
  if (adMatch) {
    issues.push({
      type: 'ad',
      word: adMatch[0],
      message: `疑似廣告內容`,
    });
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

  // 黑名單檢查 (使用預編譯 Regex)
  if (COMMUNITY_BLACKLIST_REGEX.test(trimmed)) {
    issues.push({
      type: 'blacklist',
      message: `「${trimmed}」不是正式社區名稱，請輸入完整社區名`,
    });
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
export function checkPropertyReview(
  text: string,
  type: 'advantage' | 'disadvantage'
): ContentCheckResult {
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
