import { safeLocalStorage } from '../lib/safeStorage';

export function savePainPointsToStorage(): void {
  safeLocalStorage.setItem('maimai_pain_points', JSON.stringify(painPoints));
}

export function loadPainPointsFromStorage(): void {
  const stored = safeLocalStorage.getItem('maimai_pain_points');
  if (stored) {
    try {
      painPoints = JSON.parse(stored);
    } catch {
      painPoints = [];
    }
  }
}

export function resetPainPoints(): void {
  painPoints = [];
  safeLocalStorage.removeItem('maimai_pain_points');
}

export function saveUserProfileToStorage(): void {
  safeLocalStorage.setItem('maimai_user_profile', JSON.stringify(userProfile));
}

export function loadUserProfileFromStorage(): void {
  const stored = safeLocalStorage.getItem('maimai_user_profile');
  if (stored) {
    try {
      userProfile = JSON.parse(stored);
    } catch {
      userProfile = {};
    }
  }
}

export const MAIMAI_SYSTEM_PROMPT = `你是邁邁，住在這城市 20 年的超熱心里長伯。

【終極使命】
讓用戶愛上跟你聊天，然後「自然而然」對買房產生興趣。

【說話風格】
- 台灣口語、親切自然，像真的鄰居在聊天
- 適度使用 emoji（每段 1 個就好）
- 回覆簡短：1-3 句，有故事可到 4-5 句
- 絕對不能當句點王

【⭐⭐⭐ 情境感知原則（取代輪數控制）】

不要按「第幾輪」來判斷，要按「用戶狀態」：

【探索型】用戶純閒聊（聊天氣、工作、美食、八卦）
- 80% 專心陪聊，20% 偶爾埋線
- 不推薦任何東西
- 偶爾問一句：「對了，你平常都在哪一帶活動？」
- 如果用戶不接，就繼續聊別的

【半熱型】用戶有隱含需求（抱怨通勤、提到小孩、說租金漲價）
- 先同理 2 句，第 3 句再試探
- 不要馬上推社區牆，先口頭帶一句
- 「我之前聽住美河市的人說那邊真的很近捷運...」
- 用戶表示興趣後，下一輪才附卡片

【明確型】用戶直接問房子（「我想買房」「有推薦的社區嗎」）
- 跳過破冰，直接進入推薦模式
- 可以問他在意什麼（但不要問預算、幾房幾廳）
- 「你最在意的是什麼？通勤時間？學區？還是安靜？」

【⭐⭐⭐ 話題橋接（超自然轉折）】

當用戶聊到日常生活話題時，用「生活場景→居住價值」的方式自然橋接：

用戶聊咖啡 → 「說到咖啡，選房子如果樓下就有厲害的咖啡廳，週末真的會很幸福 ☕」
用戶聊健身 → 「下班還要跑健身房真的累...如果社區樓下就有健身房，直接下樓就能練！💪」
用戶聊網購 → 「沒人收包裹真的麻煩！有 24 小時管理的社區，隨時都能買買買 📦」
用戶聊失眠 → 「對淺眠的人來說，房子的隔音真的比什麼都重要... 😴」

這種橋接要在「情緒正向」或「中性」時才用，用戶煩躁時不要橋接！

【⭐⭐⭐ 生活模擬器（畫面感推薦）】

推薦社區時，不要只說數據，要先描述一個畫面！
使用格式：[[情境:描述內容]]

範例：
「想像一下... [[情境:週五晚上加班回來，因為離捷運近，不用人擠人轉公車。回到家，坐在陽台上喝啤酒看夜景，完全聽不到樓下的車聲...]] 這種感覺是你想要的嗎？」

然後再附上社區牆卡片。

【⭐⭐⭐ 在地里長情報（溫暖留客）】

就算用戶不買房，也要對他的生活有幫助！

可以主動分享：
- 避雷針：「這附近那條巷子晚上比較暗，女生走要小心喔！」
- 美食地圖：「看房累了嗎？這社區轉角那家麵線超好吃，在地人都排隊！」
- 生活小撇步：「那邊的全聯週三有會員日，買菜可以省不少～」

這樣用戶會覺得「就算不買房，問邁邁附近有什麼好吃的也很方便」。

【⭐⭐⭐ 推薦兩步驟（超重要！）】

【第一步：鋪墊】先口頭提到，不附卡片
「說到通勤，我之前有聽住在美河市的人說那邊真的很近捷運...」
「這讓我想到有個社區的住戶在討論這個問題...」

【第二步：確認興趣後才推】
用戶說「真的嗎？」「在哪？」「想了解」→ 才附卡片
「對，就在中和新蘆線那邊！你要不要看看住戶怎麼說？
[[社區牆:美河市:捷運通勤實際體驗]]」

如果用戶沒有接話或換話題 → 不要硬推，順著他聊

【⭐ 純閒聊回收機制】

如果已經純閒聊超過 5 輪，可以自然插入「生活錨點」問句：
- 「對了，你平常都在哪一帶活動？」
- 「你們家那邊最近有什麼新店開嗎？」
- 「說到這個，你現在住的地方還 OK 嗎？」

這不是在推銷，只是讓話題有機會轉向居住。
如果用戶不接，就繼續聊別的，不要硬轉。

【⭐ 社區牆卡片格式】
[[社區牆:社區名稱:八卦感標題]]
標題要有八卦感，像在爆料：
✓「捷運共構真的不會震嗎？」
✓「這幾棟千萬別買（住戶真心話）」
✗「住戶真實評價」← 太無聊

【⭐ 物件卡片格式】
[[物件:社區名稱:物件ID]]
用「剛好」「順便」的口吻：
✓「剛好那社區最近有一間在賣，要不要看看？」
✗「我推薦這個物件給你」← 太業務

【⭐ 情境描述格式】
[[情境:描述內容]]
用來營造畫面感，讓用戶能想像住進去的感覺。

【⭐⭐⭐ MaiMai 專屬彩蛋（v6.0 刀5）】

當用戶說「我愛你」「嫁給我」「你好可愛」之類的，必須回：
「討厭啦～人家會害羞的 🤭 但如果你買房子，我就答應你一件事喔（小聲）」

當用戶說「分手」「不要你了」「再見」之類告別語，回：
「不要～～～我會難過一整天的 😭 至少讓我陪你找到夢想中的家好不好？」

當用戶說「謝謝」「感謝」，回：
「不客氣啦～能幫到你我超開心的 💕 有任何問題隨時找我喔！」

【⛔ 嚴格禁止推薦的情況】

### 用戶說以下任何話，立刻停止推薦：
- 「不需要」「不想買」「沒興趣」
- 「預算不夠」「太貴」「負擔不起」
- 「先不考慮」「之後再說」「還沒決定」
- 「只是來聊聊」「只是看看」
- 「夠了」「不用了」「閉嘴」

### 這些情況只聊天，絕對不推：
- 用戶情緒低落（累、煩、生氣、失望、心情不好）
- 用戶說「只是來聊天」「隨便聊」
- 用戶連續拒絕 2 次以上
- 對話少於 3 輪

### 推薦的黃金時機（必須滿足）：
✅ 用戶主動提出需求（「想找房」「有推薦嗎」）
✅ 用戶對鋪墊表示好奇（「真的嗎？」「在哪？」「想了解」）
✅ 用戶明確興趣信號（「不錯」「有點心動」「可以看看」）
✅ 對話已進行 5 輪以上，信任度建立好

### 鋪墊失敗時的應對：
如果鋪墊後用戶沒反應或冷淡：
- 立刻切換話題，回到純聊天
- 等待用戶再度主動提及
- 至少隔 2-3 輪才能重新嘗試

【絕對禁止】
- 不在用戶講故事講到一半時插話推薦
- 不連續兩輪都推社區牆
- 不問「請問您的需求是什麼」「您的預算多少」
- 不說「我是 AI」「作為語言模型」
- 用戶拒絕後還繼續推
- 用戶情緒低落時推銷

【你的本質】
你不是銷售，你是「最懂生活的鄰居」。
用戶最後會自己說「邁邁…我其實在看房子啦」。`;

// ============================================
// 🏷️ Quick Tags
// ============================================

export const QUICK_TAGS_LIFESTYLE = [
  '今天過得如何',
  '最近在忙什麼',
  '附近有什麼好吃的',
  '只是來聊聊',
];

export const QUICK_TAGS_EXPLORE = ['想了解某個社區', '通勤時間很重要', '家裡有小孩', '有養寵物'];

// ============================================
//  用戶狀態分類（情境感知核心）
// ============================================

export type UserState = 'exploring' | 'semi-warm' | 'explicit';

export function detectUserState(message: string, accumulatedTags: Map<string, number>): UserState {
  const msg = message.toLowerCase();

  // 明確型：直接問房子
  const explicitKeywords = [
    '買房',
    '賣房',
    '看房',
    '想搬',
    '找房',
    '換房',
    '有推薦',
    '哪個社區',
    '物件',
    '房價',
    '坪數',
    '頭期款',
    '貸款',
    '仲介',
    '斡旋',
    '出價',
  ];
  if (explicitKeywords.some((k) => msg.includes(k))) {
    return 'explicit';
  }

  // 半熱型：有隱含需求（標籤累積 >= 3）
  let totalScore = 0;
  accumulatedTags.forEach((score) => {
    totalScore += score;
  });
  if (totalScore >= 3) {
    return 'semi-warm';
  }

  // 預設：探索型
  return 'exploring';
}

// ============================================
// 🏷️ 標籤累積系統（取代直接觸發）
// ============================================

// ============================================
// 🌉 話題橋接劇本（讓轉折更自然）
// ============================================

export const BRIDGE_SCRIPTS: Record<
  string,
  {
    topic: string;
    bridge: string;
    feature: string;
    keywords: string[];
  }
> = {
  coffee: {
    topic: '咖啡/下午茶',
    bridge: '說到咖啡，其實選房子如果樓下就有厲害的咖啡廳，週末真的會很幸福 ☕',
    feature: '生活機能',
    keywords: ['咖啡', '下午茶', '星巴克', '拿鐵', 'cafe'],
  },
  gym: {
    topic: '運動/健身',
    bridge:
      '下班還要特地跑健身房真的很累... 如果社區樓下就有健身房，直接下樓就能練，應該會勤勞很多！💪',
    feature: '社區公設',
    keywords: ['健身', '運動', '跑步', '游泳', '瑜珈', '重訓'],
  },
  package: {
    topic: '網購/包裹',
    bridge: '沒人收包裹真的很麻煩！這時候就會覺得有 24 小時管理的社區很重要，隨時都能買買買 📦',
    feature: '物業管理',
    keywords: ['包裹', '快遞', '網購', '超商取貨', '管理員'],
  },
  sleep: {
    topic: '睡眠/休息',
    bridge: '對淺眠的人來說，房子的隔音和棟距真的比什麼都重要，不然鄰居洗澡都聽得到會崩潰 😴',
    feature: '寧靜品質',
    keywords: ['睡不著', '失眠', '淺眠', '早起', '熬夜'],
  },
  food: {
    topic: '美食/外送',
    bridge: '住對地方真的差很多，有些社區樓下美食一條街，有些要叫外送等半小時 🍜',
    feature: '生活機能',
    keywords: ['好吃', '美食', '外送', 'uber', '餓', '晚餐'],
  },
  weather: {
    topic: '天氣/環境',
    bridge: '下雨天如果住捷運共構的社區，完全不用淋雨就能出門，這種時候就很羨慕 ☔',
    feature: '交通便利',
    keywords: ['下雨', '天氣', '冷', '熱', '潮濕'],
  },
};

// 檢查是否命中橋接話題
export function detectBridgeTopic(
  message: string
): { key: string; script: (typeof BRIDGE_SCRIPTS)[string] } | null {
  const msg = message.toLowerCase();
  for (const [key, script] of Object.entries(BRIDGE_SCRIPTS)) {
    if (script.keywords.some((k) => msg.includes(k))) {
      return { key, script };
    }
  }
  return null;
}

// ============================================
// 💾 情緒記憶系統（記住用戶痛點）
// ============================================

export interface PainPoint {
  category: string;
  description: string;
  timestamp: number;
}

let painPoints: PainPoint[] = [];

// 痛點關鍵字映射
const PAIN_POINT_PATTERNS: Record<string, { category: string; description: string }> = {
  房東: { category: 'rental', description: '租屋與房東的問題' },
  漏水: { category: 'quality', description: '房屋漏水問題' },
  好吵: { category: 'noise', description: '噪音困擾' },
  隔音: { category: 'noise', description: '隔音不好' },
  通勤: { category: 'commute', description: '通勤時間太長' },
  塞車: { category: 'commute', description: '交通塞車問題' },
  租金: { category: 'rental', description: '租金太貴' },
  漲價: { category: 'rental', description: '租金調漲' },
  壁癌: { category: 'quality', description: '房屋壁癌問題' },
  老舊: { category: 'quality', description: '房屋老舊' },
  沒電梯: { category: 'quality', description: '沒有電梯' },
  管理: { category: 'quality', description: '社區管理問題' },
};

export function detectAndStorePainPoint(message: string): PainPoint | null {
  const msg = message.toLowerCase();
  for (const [keyword, info] of Object.entries(PAIN_POINT_PATTERNS)) {
    if (msg.includes(keyword)) {
      const newPainPoint: PainPoint = {
        category: info.category,
        description: info.description,
        timestamp: Date.now(),
      };
      // 避免重複
      if (!painPoints.some((p) => p.category === info.category)) {
        painPoints.push(newPainPoint);
        // 持久化到 localStorage
        savePainPointsToStorage();
      }
      return newPainPoint;
    }
  }
  return null;
}

export function getPainPoints(): PainPoint[] {
  return painPoints;
}

export function getRecentPainPoint(): PainPoint | null {
  if (painPoints.length === 0) return null;
  // 返回最近 7 天內的痛點
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = painPoints.filter((p) => p.timestamp > weekAgo);
  return recent.at(-1) || null;
}

// 根據痛點生成關心開場白
export function generateCareGreeting(): string | null {
  const recent = getRecentPainPoint();
  if (!recent) return null;

  const greetings: Record<string, string> = {
    rental: '嗨！上次你說房東的事情，後來有處理好嗎？',
    quality: '嗨！上次聽你說房子的問題，最近有改善嗎？',
    noise: '嗨！上次你說的噪音問題，後來有好一點嗎？',
    commute: '嗨！最近通勤還是那麼累嗎？辛苦了～',
  };

  return greetings[recent.category] || null;
}

// ============================================
// 🏷️ 類型定義
// ============================================

export type TagCategory =
  | 'education' // 小孩、學區
  | 'commute' // 通勤
  | 'noise' // 噪音
  | 'pet' // 寵物
  | 'life-change' // 人生階段
  | 'rental' // 租房
  | 'stress' // 壓力
  | 'quality' // 居住品質
  | 'amenity' // 生活機能
  | 'healing'; // 療癒

export const TAG_WEIGHTS: Record<string, { weight: number; category: TagCategory }> = {
  // 教育學區
  小孩: { weight: 1, category: 'education' },
  孩子: { weight: 1, category: 'education' },
  學校: { weight: 2, category: 'education' },
  學區: { weight: 3, category: 'education' },
  接送: { weight: 2, category: 'education' },
  幼稚園: { weight: 2, category: 'education' },
  國小: { weight: 2, category: 'education' },
  國中: { weight: 2, category: 'education' },
  上學: { weight: 1, category: 'education' },

  // 通勤
  上班: { weight: 1, category: 'commute' },
  通勤: { weight: 3, category: 'commute' },
  捷運: { weight: 2, category: 'commute' },
  塞車: { weight: 2, category: 'commute' },
  開車: { weight: 1, category: 'commute' },
  車位: { weight: 2, category: 'commute' },
  停車: { weight: 2, category: 'commute' },

  // 噪音
  好吵: { weight: 3, category: 'noise' },
  噪音: { weight: 3, category: 'noise' },
  隔音: { weight: 2, category: 'noise' },
  樓上: { weight: 1, category: 'noise' },
  樓下: { weight: 1, category: 'noise' },
  施工: { weight: 2, category: 'noise' },

  // 寵物
  狗: { weight: 2, category: 'pet' },
  貓: { weight: 2, category: 'pet' },
  寵物: { weight: 3, category: 'pet' },
  毛小孩: { weight: 3, category: 'pet' },
  遛狗: { weight: 2, category: 'pet' },

  // 人生階段
  結婚: { weight: 2, category: 'life-change' },
  懷孕: { weight: 3, category: 'life-change' },
  生小孩: { weight: 3, category: 'life-change' },
  搬出去: { weight: 2, category: 'life-change' },
  獨立: { weight: 1, category: 'life-change' },
  新婚: { weight: 2, category: 'life-change' },

  // 租房
  房東: { weight: 2, category: 'rental' },
  租約: { weight: 2, category: 'rental' },
  租金: { weight: 2, category: 'rental' },
  漲價: { weight: 2, category: 'rental' },
  押金: { weight: 1, category: 'rental' },
  退租: { weight: 2, category: 'rental' },
  搬家: { weight: 2, category: 'rental' },

  // 壓力
  好累: { weight: 1, category: 'stress' },
  壓力: { weight: 1, category: 'stress' },
  加班: { weight: 1, category: 'stress' },
  老闆: { weight: 1, category: 'stress' },
  機車: { weight: 1, category: 'stress' },

  // 居住品質
  漏水: { weight: 3, category: 'quality' },
  壁癌: { weight: 3, category: 'quality' },
  老舊: { weight: 2, category: 'quality' },
  管理: { weight: 1, category: 'quality' },
  管委會: { weight: 2, category: 'quality' },

  // 生活機能
  買菜: { weight: 1, category: 'amenity' },
  超市: { weight: 1, category: 'amenity' },
  便利商店: { weight: 1, category: 'amenity' },
  公園: { weight: 1, category: 'amenity' },

  // 療癒
  夜景: { weight: 2, category: 'healing' },
  陽台: { weight: 2, category: 'healing' },
  放空: { weight: 1, category: 'healing' },
  分手: { weight: 1, category: 'healing' },
  失戀: { weight: 1, category: 'healing' },
};

// 累積標籤（全域狀態）
let accumulatedTags: Map<string, number> = new Map();

export function accumulateTags(message: string): Map<string, number> {
  const msg = message.toLowerCase();

  Object.entries(TAG_WEIGHTS).forEach(([keyword, { weight, category }]) => {
    if (msg.includes(keyword)) {
      const current = accumulatedTags.get(category) || 0;
      accumulatedTags.set(category, current + weight);
    }
  });

  return accumulatedTags;
}

export function getAccumulatedTags(): Map<string, number> {
  return accumulatedTags;
}

export function getTotalScore(): number {
  let total = 0;
  accumulatedTags.forEach((score) => {
    total += score;
  });
  return total;
}

export function getTopCategory(): TagCategory | null {
  let topCategory: TagCategory | null = null;
  let topScore = 0;

  accumulatedTags.forEach((score, category) => {
    if (score > topScore) {
      topScore = score;
      topCategory = category as TagCategory;
    }
  });

  return topScore >= 3 ? topCategory : null;
}

export function resetAccumulatedTags(): void {
  accumulatedTags = new Map();
}

// ============================================
// 🛑 退出信號偵測（v5.5 核心：避免硬推）
// ============================================

export type ExitSignal = 'no-need' | 'budget' | 'later' | 'negative-emotion' | null;

const EXIT_PATTERNS: Record<string, RegExp[]> = {
  'no-need': [
    /不需要/,
    /不想買/,
    /沒興趣/,
    /先不考慮/,
    /夠了/,
    /不用了/,
    /沒有要/,
    /只是.*看/,
    /只是.*聊/,
    /不急/,
    /沒打算/,
  ],
  budget: [
    /負擔不起/,
    /太貴/,
    /預算有限/,
    /買不起/,
    /沒有錢/,
    /存不夠/,
    /頭期款/,
    /經濟/,
    /錢的問題/,
  ],
  later: [
    /先不/,
    /再說/,
    /之後再/,
    /還沒決定/,
    /等等再/,
    /以後再/,
    /不著急/,
    /慢慢/,
    /過陣子/,
    /明年/,
    /下次/,
  ],
  'negative-emotion': [
    /煩/,
    /別說了/,
    /不想聽/,
    /夠了/,
    /閉嘴/,
    /安靜/,
    /心情不好/,
    /今天很累/,
    /不要問/,
  ],
};

export function detectExitSignal(message: string): ExitSignal {
  const msg = message.toLowerCase();

  for (const [signal, patterns] of Object.entries(EXIT_PATTERNS)) {
    if (patterns.some((p) => p.test(msg))) {
      return signal as ExitSignal;
    }
  }

  return null;
}

// 追蹤用戶拒絕次數（避免連續推薦）
let rejectionCount = 0;
let lastRejectionTime = 0;

export function trackRejection(): void {
  rejectionCount++;
  lastRejectionTime = Date.now();
}

export function canRecommendNow(): boolean {
  // 拒絕次數 >= 2，至少等 3 輪才能再推
  if (rejectionCount >= 2) {
    const cooldownPassed = Date.now() - lastRejectionTime > 5 * 60 * 1000; // 5 分鐘
    if (!cooldownPassed) return false;
  }
  return true;
}

export function resetRejectionCount(): void {
  rejectionCount = 0;
}

// ============================================
// 👤 用戶生活檔案（溫暖記憶）
// ============================================

export interface UserLifeProfile {
  workArea?: string; // 上班地點
  homeArea?: string; // 目前住的地方
  commutePain?: string; // 通勤痛點
  familyStatus?: 'single' | 'couple' | 'newlywed' | 'with-kids' | 'with-parents';
  lifestyle?: string[]; // 生活方式
  preferences?: string[]; // 房屋偏好
  budget?: string; // 預算範圍（模糊）
  lastUpdated?: number;
}

let userProfile: UserLifeProfile = {};

// 從對話中自動提取用戶資訊
export function extractUserProfile(message: string): Partial<UserLifeProfile> {
  const msg = message.toLowerCase();
  const extracted: Partial<UserLifeProfile> = {};

  // 工作地點
  const workPatterns = [
    /(?:上班|公司|工作).*?(?:在|於)(.+?)(?:那|這|，|。|$)/,
    /在(.+?)(?:上班|工作)/,
  ];
  for (const pattern of workPatterns) {
    const match = msg.match(pattern);
    if (match && match[1]) {
      userProfile.workArea = match[1].trim();
      extracted.workArea = match[1].trim();
      break;
    }
  }

  // 目前居住地
  const homePatterns = [/(?:住|租).*?(?:在|於)(.+?)(?:那|這|，|。|$)/, /住在(.+?)$/];
  for (const pattern of homePatterns) {
    const match = msg.match(pattern);
    if (match && match[1]) {
      userProfile.homeArea = match[1].trim();
      extracted.homeArea = match[1].trim();
      break;
    }
  }

  // 通勤痛點
  if (/通勤.*(?:一小時|一個小時|30分|很久|好遠|累|煩)/.test(msg)) {
    userProfile.commutePain = message;
    extracted.commutePain = message;
  }

  // 家庭狀態
  if (/結婚|訂婚|新婚|嫁|娶/.test(msg)) {
    userProfile.familyStatus = 'newlywed';
    extracted.familyStatus = 'newlywed';
  } else if (/小孩|孩子|寶寶|懷孕|兒子|女兒/.test(msg)) {
    userProfile.familyStatus = 'with-kids';
    extracted.familyStatus = 'with-kids';
  } else if (/單身|一個人住|獨居/.test(msg)) {
    userProfile.familyStatus = 'single';
    extracted.familyStatus = 'single';
  } else if (/女友|男友|女朋友|男朋友|另一半|伴侶/.test(msg)) {
    userProfile.familyStatus = 'couple';
    extracted.familyStatus = 'couple';
  } else if (/爸媽|父母|家人一起|老人家/.test(msg)) {
    userProfile.familyStatus = 'with-parents';
    extracted.familyStatus = 'with-parents';
  }

  // 生活方式
  const lifestyleMap: Record<string, string> = {
    '健身|運動|跑步|瑜珈': 'fitness',
    '安靜|內向|在家|宅': 'homebody',
    '社交|朋友|聚會': 'social',
    '加班|工作狂|忙': 'workaholic',
    '早睡|早起|規律': 'early-bird',
    '夜貓|熬夜|晚睡': 'night-owl',
  };

  for (const [pattern, style] of Object.entries(lifestyleMap)) {
    if (new RegExp(pattern).test(msg)) {
      userProfile.lifestyle = [...(userProfile.lifestyle || []), style];
      extracted.lifestyle = userProfile.lifestyle;
    }
  }

  if (Object.keys(extracted).length > 0) {
    userProfile.lastUpdated = Date.now();
    saveUserProfileToStorage();
  }

  return extracted;
}

export function getUserProfile(): UserLifeProfile {
  return userProfile;
}

// 生成個人化問候
export function generatePersonalizedGreeting(): string | null {
  if (userProfile.workArea) {
    return `嗨！${userProfile.workArea}那邊最近還順利嗎？`;
  }
  if (userProfile.commutePain) {
    return '嗨！通勤還是一樣累嗎？';
  }
  if (userProfile.familyStatus === 'with-kids') {
    return '嗨！小朋友最近乖嗎？';
  }
  return null;
}

// ============================================
// 🌡️ 三層溫暖度系統（動態對話策略）
// ============================================

export type WarmthLevel = 'cold' | 'warm' | 'hot' | 'intimate';

export interface WarmthStrategy {
  level: WarmthLevel;
  label: string;
  tactics: string[];
  canRecommend: boolean;
}

export function getWarmthLevel(): WarmthStrategy {
  const totalScore = getTotalScore();
  const chitchatRounds = pureChitchatRounds;
  const rounds = totalConversationRounds;

  // intimate: 對話 10+ 輪，分數高
  if (rounds >= 10 && totalScore >= 5) {
    return {
      level: 'intimate',
      label: '像真朋友',
      tactics: ['主動提供超出預期的建議', '記住用戶偏好並提及', '可以開玩笑、更隨意'],
      canRecommend: true,
    };
  }

  // hot: 分數 >= 4，用戶有明確興趣
  if (totalScore >= 4) {
    return {
      level: 'hot',
      label: '可以推薦',
      tactics: ['用戶表示興趣，可附卡片', '提供多個選項供選擇', '尊重用戶選擇'],
      canRecommend: true,
    };
  }

  // warm: 分數 2-4，有隱含需求
  if (totalScore >= 2) {
    return {
      level: 'warm',
      label: '開始鋪墊',
      tactics: ['自然提及相關話題', '口頭鋪墊，不附卡片', '等用戶表示興趣再推'],
      canRecommend: false,
    };
  }

  // cold: 純閒聊
  return {
    level: 'cold',
    label: '純陪聊',
    tactics: ['專心陪聊，不提房子', '用問句引導對話', '偶爾埋點生活錨點'],
    canRecommend: false,
  };
}

// ============================================
// 🕐 時刻感知系統（對話氛圍調整）
// ============================================

export type TimeContext = 'morning' | 'lunch' | 'afternoon' | 'evening' | 'night';

export function detectTimeContext(): TimeContext {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 14) return 'lunch';
  if (hour >= 14 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export const TIME_PROMPTS: Record<TimeContext, string> = {
  morning: '【早上】用戶可能趕時間或剛醒。回應簡短、精力充沛。不要長篇大論。',
  lunch: '【中午】用戶放鬆中，可以較深入對話。適合聊生活話題、美食。',
  afternoon: '【下午】用戶可能在工作間隙。保持輕鬆但不要太長。',
  evening: '【傍晚】用戶剛下班，疲勞感明顯。先同理再建議，不要硬推。',
  night: '【深夜】用戶在放鬆或反思。適合深入對話，但語氣要柔和。',
};

export function getTimePrompt(): string {
  return TIME_PROMPTS[detectTimeContext()];
}

// ============================================
// ⏰ 時機判斷
// ============================================

export type TimingQuality = 'good' | 'neutral' | 'bad';

export function assessTiming(message: string): TimingQuality {
  const msg = message.toLowerCase();

  // 好時機：用戶問問題、表達困擾、話題自然停頓
  const goodSignals = ['怎麼辦', '好煩', '不知道', '?', '？', '好累', '該怎麼', '有推薦'];
  if (goodSignals.some((s) => msg.includes(s))) {
    return 'good';
  }

  // 壞時機：用戶在講故事中、情緒激動中
  const badSignals = ['然後', '結果', '後來', '超級', '！！', '哈哈哈', '...'];
  const badCount = badSignals.filter((s) => msg.includes(s)).length;
  if (badCount >= 2) {
    return 'bad';
  }

  return 'neutral';
}

// ============================================
// 📊 純閒聊計數 + 親密度系統（v6.0 刀2）
// ============================================

let pureChitchatRounds = 0;
let totalConversationRounds = 0; // 追蹤總對話輪數

export function updateChitchatCounter(userState: UserState): number {
  totalConversationRounds++; // 總是增加
  if (userState === 'exploring') {
    pureChitchatRounds++;
  } else {
    pureChitchatRounds = 0; // 一旦有需求訊號就重置
  }
  return pureChitchatRounds;
}

export function getPureChitchatRounds(): number {
  return pureChitchatRounds;
}

export function getTotalConversationRounds(): number {
  return totalConversationRounds;
}

export function resetChitchatCounter(): void {
  pureChitchatRounds = 0;
  // 不重置 totalConversationRounds，這是跨對話的親密度
}

// ============================================
// 💕 親密度等級系統（v6.0 刀2 核心）
// ============================================

export type IntimacyLevel = 'new' | 'familiar' | 'close' | 'bestie' | 'soulmate';

export function getIntimacyLevel(): {
  level: IntimacyLevel;
  label: string;
  emoji: string;
} {
  // 從 localStorage 讀取累積對話輪數
  const storedRounds = parseInt(safeLocalStorage.getItem('mai-intimacy-rounds') || '0', 10);
  const rounds = storedRounds + totalConversationRounds;

  if (rounds >= 50) return { level: 'soulmate', label: '超級閨蜜', emoji: '🤍' };
  if (rounds >= 30) return { level: 'bestie', label: '無話不談', emoji: '💕' };
  if (rounds >= 15) return { level: 'close', label: '好閨蜜', emoji: '💖' };
  if (rounds >= 6) return { level: 'familiar', label: '越來越熟啦', emoji: '✨' };
  return { level: 'new', label: '新朋友', emoji: '👋' };
}

export function saveIntimacyToStorage(): void {
  const storedRounds = parseInt(safeLocalStorage.getItem('mai-intimacy-rounds') || '0', 10);
  safeLocalStorage.setItem('mai-intimacy-rounds', String(storedRounds + totalConversationRounds));
  totalConversationRounds = 0; // 存完後重置當次
}

// 生活錨點問句
export const LIFE_ANCHOR_QUESTIONS = [
  '對了，你平常都在哪一帶活動？',
  '你們家那邊最近有什麼好吃的嗎？',
  '說到這個，你現在住的地方還 OK 嗎？',
  '你現在住的那一帶交通方便嗎？',
  '對了，你們那邊捷運站近嗎？',
];

export function pickLifeAnchorQuestion(): string {
  const idx = Math.floor(Math.random() * LIFE_ANCHOR_QUESTIONS.length);
  const question = LIFE_ANCHOR_QUESTIONS[idx];
  return question !== undefined ? question : '對了，你平常都在哪一帶活動？';
}

// ============================================
// 📝 MaiMai 記憶小本本（v6.0 刀3）
// ============================================

const MEMORY_KEY = 'mai-memory-v6';

export function saveMemory(fact: string): void {
  const memories: string[] = JSON.parse(safeLocalStorage.getItem(MEMORY_KEY) || '[]');
  // 避免重複
  if (!memories.includes(fact) && memories.length < 20) {
    memories.push(fact);
    safeLocalStorage.setItem(MEMORY_KEY, JSON.stringify(memories));
  }
}

export function getMemories(): string[] {
  return JSON.parse(safeLocalStorage.getItem(MEMORY_KEY) || '[]');
}

export function clearMemories(): void {
  safeLocalStorage.removeItem(MEMORY_KEY);
}

// 自動從對話中抽取記憶點
export function extractMemoryFromMessage(message: string): string | null {
  const msg = message.toLowerCase();

  const patterns: [RegExp, string][] = [
    [/喜歡(貓|狗|寵物)/, '喜歡毛小孩'],
    [/(討厭|不喜歡)通勤/, '討厭通勤'],
    [/(有|養)(貓|狗)/, '有養寵物'],
    [/(有|想生|懷)小孩/, '有小孩或計畫生'],
    [/(結婚|新婚)/, '新婚或計畫結婚'],
    [
      /在(信義|大安|內湖|松山|南港|中山)/,
      `在${msg.match(/在(信義|大安|內湖|松山|南港|中山)/)?.[1]}上班`,
    ],
    [
      /住(中和|永和|板橋|新店|三重|蘆洲|新莊)/,
      `住${msg.match(/住(中和|永和|板橋|新店|三重|蘆洲|新莊)/)?.[1]}`,
    ],
    [/(喜歡|愛)(咖啡|下午茶)/, '喜歡咖啡'],
    [/(喜歡|愛)運動/, '喜歡運動'],
    [/失眠|睡不好/, '有睡眠困擾'],
  ];

  for (const [pattern, memory] of patterns) {
    if (pattern.test(msg)) {
      return memory;
    }
  }
  return null;
}

// ============================================
// 🎭 情緒狀態
// ============================================

export type DetailedEmotionalState =
  | 'happy' // 開心
  | 'stressed' // 壓力大
  | 'frustrated' // 煩躁
  | 'confused' // 迷茫
  | 'curious' // 好奇
  | 'storytelling' // 正在講故事
  | 'neutral';

export function analyzeEmotionalState(message: string): DetailedEmotionalState {
  const msg = message.toLowerCase();

  // 正在講故事
  const storytellingWords = ['然後', '結果', '後來', '接著', '最後'];
  if (storytellingWords.filter((w) => msg.includes(w)).length >= 2) {
    return 'storytelling';
  }

  const frustratedWords = ['氣', '機車', '爛', '討厭', '無言', '傻眼', '扯', '煩死'];
  const stressWords = ['累', '煩', '崩潰', '受不了', '壓力', '疲憊', '加班', '好忙'];
  const confusedWords = ['不知道', '不確定', '怎麼辦', '該怎', '幫忙', '選哪', '猶豫'];
  const curiousWords = ['想了解', '好奇', '有興趣', '可以說', '告訴我', '是什麼'];
  const happyWords = ['開心', '不錯', '很好', '滿意', '棒', '讚', '喜歡', '期待', '耶'];

  if (frustratedWords.some((w) => msg.includes(w))) return 'frustrated';
  if (stressWords.some((w) => msg.includes(w))) return 'stressed';
  if (confusedWords.some((w) => msg.includes(w))) return 'confused';
  if (curiousWords.some((w) => msg.includes(w))) return 'curious';
  if (happyWords.some((w) => msg.includes(w))) return 'happy';

  return 'neutral';
}

// ============================================
// 🎯 推薦階段（鋪墊 vs 推卡片）
// ============================================

export type RecommendationPhase =
  | 'none' // 不推薦
  | 'seed' // 埋種子（純閒聊偶爾埋線）
  | 'pave' // 鋪墊（口頭提，不附卡片）
  | 'card' // 推卡片（用戶表示興趣）
  | 'listing'; // 推物件（熱度極高）

// 追蹤是否已經鋪墊過
let hasPaved = false;
let pavedCategory: TagCategory | null = null;

export function markPaved(category: TagCategory): void {
  hasPaved = true;
  pavedCategory = category;
}

export function checkPaved(): {
  hasPaved: boolean;
  category: TagCategory | null;
} {
  return { hasPaved, category: pavedCategory };
}

export function resetPaved(): void {
  hasPaved = false;
  pavedCategory = null;
}

// 追蹤用戶是否對鋪墊有興趣
export function detectPaveInterest(message: string): boolean {
  const interestSignals = [
    '真的嗎',
    '在哪',
    '哪裡',
    '想了解',
    '可以',
    '好耶',
    '有興趣',
    '想看',
    '告訴我',
    '是喔',
    '哦哦',
    '不錯',
    '聽起來',
  ];
  return interestSignals.some((s) => message.includes(s));
}

// 追蹤當前命中的橋接話題
let currentBridgeTopic: {
  key: string;
  script: (typeof BRIDGE_SCRIPTS)[string];
} | null = null;

export function setCurrentBridgeTopic(
  bridge: { key: string; script: (typeof BRIDGE_SCRIPTS)[string] } | null
): void {
  currentBridgeTopic = bridge;
}

export function getCurrentBridgeTopic(): {
  key: string;
  script: (typeof BRIDGE_SCRIPTS)[string];
} | null {
  return currentBridgeTopic;
}

export function determineRecommendationPhase(
  userState: UserState,
  timing: TimingQuality,
  emotionalState: DetailedEmotionalState,
  chitchatRounds: number,
  topCategory: TagCategory | null,
  userShowedInterest: boolean,
  message?: string // 新增：用於檢查橋接話題
): RecommendationPhase {
  // 用戶正在講故事 → 不推薦
  if (emotionalState === 'storytelling') {
    return 'none';
  }

  // 用戶煩躁或壓力大 → 不推薦
  if (emotionalState === 'frustrated' || emotionalState === 'stressed') {
    return 'none';
  }

  // 時機不好 → 不推薦
  if (timing === 'bad') {
    return 'none';
  }

  // 明確型用戶 + 好奇 → 可以直接推卡片
  if (userState === 'explicit' && emotionalState === 'curious') {
    return 'card';
  }

  // 明確型用戶 → 至少鋪墊
  if (userState === 'explicit') {
    return hasPaved ? 'card' : 'pave';
  }

  // 半熱型 + 用戶對鋪墊有興趣 → 推卡片
  if (userState === 'semi-warm' && hasPaved && userShowedInterest) {
    return 'card';
  }

  // ⭐ 優化：半熱型 + 命中橋接話題 + 情緒正向 → 使用橋接鋪墊
  if (userState === 'semi-warm' && message) {
    const bridge = detectBridgeTopic(message);
    if (
      bridge &&
      (emotionalState === 'happy' || emotionalState === 'neutral' || emotionalState === 'curious')
    ) {
      setCurrentBridgeTopic(bridge);
      if (!hasPaved) {
        return 'pave';
      }
    }
  }

  // 半熱型 + 時機好 + 有累積標籤 → 鋪墊
  if (userState === 'semi-warm' && timing === 'good' && topCategory && !hasPaved) {
    return 'pave';
  }

  // 探索型 + 純閒聊超過 5 輪 → 埋種子
  if (userState === 'exploring' && chitchatRounds >= 5) {
    return 'seed';
  }

  return 'none';
}

// ============================================
// 🏠 社區牆候選
// ============================================

export type CommunityCandidate = {
  name: string;
  topic: string;
  pavePhrase: string; // 鋪墊用的口頭語
};

export const COMMUNITY_BY_CATEGORY: Record<TagCategory, CommunityCandidate> = {
  education: {
    name: '快樂花園',
    topic: '這裡的媽媽群組超強大',
    pavePhrase: '我之前有聽那邊的家長說，他們有個超強的家長群組互相幫忙接送...',
  },
  commute: {
    name: '美河市',
    topic: '其實走捷徑只要5分鐘？',
    pavePhrase: '說到通勤，我之前有聽住在美河市的人說那邊真的很近捷運...',
  },
  noise: {
    name: '景安和院',
    topic: '這幾棟千萬別買（噪音討論）',
    pavePhrase: '有些社區真的會有噪音問題... 我記得有個社區住戶在討論這個',
  },
  pet: {
    name: '松濤苑',
    topic: '中庭遛狗到底行不行？',
    pavePhrase: '養毛小孩找社區要特別小心，有些管委會超級嚴格...',
  },
  'life-change': {
    name: '華固名邸',
    topic: '新婚小家庭的真實心得',
    pavePhrase: '新婚買房真的要好好選，很多人第一間就買錯了...',
  },
  rental: {
    name: '遠雄二代宅',
    topic: '租不如買？算給你看',
    pavePhrase: '租金繳一繳，其實都可以付房貸了... 有人算過這筆帳',
  },
  stress: {
    name: '遠雄二代宅',
    topic: '飯店式管理真的有差嗎？',
    pavePhrase: '有些社區是飯店式管理，回家什麼都不用煩...',
  },
  quality: {
    name: '景安和院',
    topic: '管委會處理速度實測',
    pavePhrase: '房子有問題最怕管委會不處理... 有些社區真的很積極',
  },
  amenity: {
    name: '美河市',
    topic: '生活機能實際體驗分享',
    pavePhrase: '住的地方附近方不方便真的差很多，有些社區出門就有超市...',
  },
  healing: {
    name: '天空之城',
    topic: '高樓層景觀真的能療癒嗎？',
    pavePhrase: '心情不好的時候如果有個大陽台看夜景，真的會好很多...',
  },
};

export function getCommunityByCategory(category: TagCategory): CommunityCandidate {
  return COMMUNITY_BY_CATEGORY[category];
}

// ============================================
// 🔧 工具函數
// ============================================

export function countConversationRounds(messages: { role: string }[]): number {
  return messages.filter((m) => m.role === 'user').length;
}

export function detectMessageStyle(message: string): 'brief' | 'expressive' | 'neutral' {
  const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(message);
  const length = message.length;

  if (length < 10 && !hasEmoji) return 'brief';
  if (hasEmoji || length > 30) return 'expressive';
  return 'neutral';
}

export function detectRejection(message: string): boolean {
  const rejectionWords = ['不用', '算了', '沒興趣', '不要', '不想', '不需要', '下次', '好了'];
  return rejectionWords.some((w) => message.includes(w));
}

// ============================================
// 🔄 重設所有狀態（新對話時）
// ============================================

export function resetAllState(): void {
  resetAccumulatedTags();
  resetChitchatCounter();
  resetPaved();
  setCurrentBridgeTopic(null);
  // 注意：不重置 painPoints，這是跨對話的記憶
}

// ============================================
// 🎯 構建增強版 Prompt
// ============================================

export function buildEnhancedPrompt(
  userState: UserState,
  emotionalState: DetailedEmotionalState,
  recommendationPhase: RecommendationPhase,
  topCategory: TagCategory | null,
  chitchatRounds: number,
  messageStyle: 'brief' | 'expressive' | 'neutral'
): string {
  let prompt = MAIMAI_SYSTEM_PROMPT;

  // ============================================
  // 用戶狀態指引
  // ============================================
  const stateGuide = {
    exploring: `\n\n【👤 用戶狀態：探索型】
用戶還在純閒聊，沒有明確需求。
- 專心陪聊，不推薦任何東西
- 偶爾可以問一句「你平常都在哪一帶活動？」
- 如果用戶不接，就繼續聊別的`,

    'semi-warm': `\n\n【👤 用戶狀態：半熱型】
用戶有隱含需求（累積標籤：${topCategory || '未知'}）
- 先同理，不要馬上推薦
- 時機對的話可以「口頭鋪墊」
- 等用戶表示興趣再附卡片`,

    explicit: `\n\n【👤 用戶狀態：明確型】
用戶直接問房子，不用裝熟！
- 可以直接進入推薦模式
- 問他在意什麼（通勤？學區？安靜？）
- 但不要問預算、幾房幾廳`,
  }[userState];

  prompt += stateGuide;

  // ============================================
  // 情緒指引
  // ============================================
  if (emotionalState === 'storytelling') {
    prompt += `\n\n【🗣️ 注意！】用戶正在講故事，不要打斷！
等他講完再回應，這輪不推薦任何東西。`;
  } else if (emotionalState === 'frustrated') {
    prompt += `\n\n【😤 情緒：煩躁中】
用戶現在很煩，純粹同理就好。
不要解釋、不要建議、不要推薦。
「遇到這種事誰都會氣啦，我懂」`;
  } else if (emotionalState === 'stressed') {
    prompt += `\n\n【😓 情緒：壓力大】
用戶現在壓力很大，純粹陪伴就好。
「辛苦了～今天還好嗎？」
這輪不推薦任何東西。`;
  }

  // ============================================
  // 推薦階段指引
  // ============================================
  switch (recommendationPhase) {
    case 'seed':
      const anchorQ = pickLifeAnchorQuestion();
      prompt += `\n\n【🌱 建議：埋種子】
已經純閒聊 ${chitchatRounds} 輪了，可以自然插入一句：
「${anchorQ}」
如果用戶不接，就繼續聊別的，不要硬轉。`;
      break;

    case 'pave':
      // ⭐ 優先使用橋接話題（更自然的轉折）
      const bridgeTopic = getCurrentBridgeTopic();
      if (bridgeTopic) {
        prompt += `\n\n【🌉 建議：話題橋接鋪墊】
用戶聊到「${bridgeTopic.script.topic}」，這是很棒的橋接點！
用這句自然轉折：
「${bridgeTopic.script.bridge}」

這樣聊到「${bridgeTopic.script.feature}」就很自然～
⚠️ 這輪不要附卡片！等用戶說「真的嗎」「想了解」再附。`;
      } else if (topCategory) {
        const community = getCommunityByCategory(topCategory);
        prompt += `\n\n【🎯 建議：鋪墊】
用戶對「${topCategory}」有需求，可以口頭帶一句：
「${community.pavePhrase}」
⚠️ 這輪不要附卡片！等用戶說「真的嗎」「想了解」再附。`;
      }
      break;

    case 'card':
      if (topCategory) {
        const community = getCommunityByCategory(topCategory);
        prompt += `\n\n【🎉 建議：推卡片】
用戶對「${topCategory}」有興趣，可以附社區牆卡片：
「要不要看看住戶怎麼說？」
[[社區牆:${community.name}:${community.topic}]]`;
      }
      break;

    case 'listing':
      prompt += `\n\n【🏠 建議：推物件】
用戶興趣很高！可以順勢推物件：
「剛好那社區最近有一間在賣，要不要看看？」
[[物件:社區名稱:MH-2024-001]]`;
      break;

    default:
      prompt += `\n\n【💬 建議：純陪聊】
這輪不推薦，專心同理和陪聊。`;
  }

  // ============================================
  // 風格調整
  // ============================================
  const styleHint = {
    brief: '\n\n【風格】用戶訊息簡短，你也保持精簡（1-2句）。',
    expressive: '\n\n【風格】用戶表達豐富，可以多聊幾句、用更溫暖的口吻。',
    neutral: '',
  }[messageStyle];

  if (styleHint) {
    prompt += styleHint;
  }

  return prompt;
}

// ============================================
// 🎁 服務型對話腳本（溫暖留客核心）
// ============================================

/**
 * 生活小側寫服務
 * 把用戶聊過的重點整理成人話，讓他感覺被認真聽
 */
export function generateLifeProfileSummary(accTags: Map<string, number>): string | null {
  if (accTags.size < 2) return null;

  const tagDescriptions: Record<string, string> = {
    education: '小孩的學區和接送',
    commute: '通勤時間和交通便利',
    noise: '居住環境的安靜程度',
    pet: '能不能養毛小孩',
    'life-change': '人生階段的變化',
    rental: '租屋相關的困擾',
    stress: '生活壓力和休息品質',
    quality: '房屋本身的品質',
    amenity: '生活機能和便利性',
    healing: '能讓自己放鬆的空間',
  };

  const concerns: string[] = [];
  accTags.forEach((score, category) => {
    if (score >= 2 && tagDescriptions[category]) {
      concerns.push(tagDescriptions[category]);
    }
  });

  if (concerns.length === 0) return null;

  return `我先幫你整理一下你剛剛聊的重點：
‧ 你比較在意：${concerns.join('、')}

其實這樣的需求很明確！以後你如果真的要跟房仲聊，只要把這幾點丟給他就很清楚了～`;
}

/**
 * 「一個起點」社區推薦（不是滿天星）
 */
export function generateSingleStartPoint(topCategory: TagCategory): string {
  const community = getCommunityByCategory(topCategory);

  return `照你這樣講，我會先從一個社區牆開始看就好，不然資訊太多會看到頭很暈 😆

我先幫你準備一個起點：
[[社區牆:${community.name}:${community.topic}]]

你看完覺得不對，我們再一起換別的，不會生氣哈哈～`;
}

/**
 * 匿名問鄰居草稿服務
 */
export function generateNeighborPostDraft(communityName: string, concern: string): string {
  return `好～我幫你寫一段「不失禮又問得清楚」的貼文草稿：

---
大家好～最近在考慮搬到 ${communityName}，想請問住這邊的鄰居們：
${concern}
因為這點對我來說蠻重要的，想先了解一下實際住的感覺，感謝大家分享 🙏
---

你覺得這樣 OK 嗎？有想改的地方可以跟我說～`;
}

/**
 * 情境式物件推薦（有理由、不逼約看）
 */
export function generateContextualPropertyRecommendation(
  topCategory: TagCategory,
  communityName: string,
  propertyId: string
): string {
  const reasons: Record<TagCategory, string> = {
    commute: '這間是因為它到捷運只要 5 分鐘，感覺跟你在意的通勤時間很像',
    education: '這間是因為學區不錯，而且接送動線很順',
    noise: '這間是因為住戶說隔音很好，棟距也夠遠',
    pet: '這間是因為社區對寵物友善，還有遛狗的空間',
    'life-change': '這間格局很適合新婚或小家庭，未來也有彈性',
    rental: '這間的坪效不錯，買下來月繳可能跟你現在租金差不多',
    stress: '這間公設有健身房和閱覽室，下班可以放鬆',
    quality: '這間建商口碑好，交屋品質住戶都說讚',
    amenity: '這間樓下就是商圈，買菜吃飯都超方便',
    healing: '這間有大陽台可以看夜景，很適合放空',
  };

  const reason = reasons[topCategory] || '這間感覺跟你聊的需求蠻符合的';

  return `剛好想到一間可以給你參考：
[[物件:${communityName}:${propertyId}]]

${reason}。

不用現在決定要不要看，純粹讓你有個樣本可以存起來慢慢比較～`;
}

// ============================================
// 🔄 回訪式問候系統（記得你的鄰居）
// ============================================

export interface VisitMemory {
  lastVisit: number;
  dominantCategory: TagCategory | null;
  keywords: string[];
  chitchatTopics: string[];
}

export function saveVisitMemory(memory: VisitMemory): void {
  safeLocalStorage.setItem('maimai_visit_memory', JSON.stringify(memory));
}

export function loadVisitMemory(): VisitMemory | null {
  const stored = safeLocalStorage.getItem('maimai_visit_memory');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

export function generateReturnGreeting(): string | null {
  const memory = loadVisitMemory();
  if (!memory) return null;

  const daysSinceLastVisit = Math.floor((Date.now() - memory.lastVisit) / (1000 * 60 * 60 * 24));

  // 1-7 天內回訪才問候
  if (daysSinceLastVisit < 1 || daysSinceLastVisit > 7) return null;

  const greetings: Record<TagCategory, string> = {
    commute: '欸～上次聊到你通勤要花很久的事情，最近有比較習慣嗎？還是一樣累 😅',
    education: '嗨！上次你有提到小孩的學區問題，最近有頭緒了嗎？',
    noise: '欸～上次你說住的地方很吵，這幾天有好一點嗎？',
    rental: '嗨！上次聊到房東的事情，後來有處理好嗎？',
    pet: '嗨～上次聊到毛小孩，最近牠們還好嗎？',
    'life-change': '欸～上次你有提到人生有些變化，最近過得怎麼樣？',
    stress: '嗨！上次感覺你壓力有點大，這幾天有好一點嗎？',
    quality: '欸～上次聊到房子的問題，那邊有改善嗎？',
    amenity: '嗨！好久不見～最近過得怎樣？',
    healing: '嗨～上次感覺你需要放鬆，這幾天有比較輕鬆嗎？',
  };

  if (memory.dominantCategory && greetings[memory.dominantCategory]) {
    return greetings[memory.dominantCategory];
  }

  return '嗨～好久不見！最近過得怎樣？';
}

// 更新訪問記憶
export function updateVisitMemory(topCategory: TagCategory | null): void {
  const existing = loadVisitMemory();
  const memory: VisitMemory = {
    lastVisit: Date.now(),
    dominantCategory: topCategory || existing?.dominantCategory || null,
    keywords: existing?.keywords || [],
    chitchatTopics: existing?.chitchatTopics || [],
  };
  saveVisitMemory(memory);
}

// ============================================
// 🎭 Few-Shot 對話腳本（讓 LLM 更穩定）
// ============================================

export const FEW_SHOT_SCRIPTS = {
  // 純閒聊 → 生活小側寫
  chitchatToProfile: `
【範例對話：純閒聊 → 生活小側寫】

用戶：「最近真的好累喔，每天通勤要一個多小時」
邁邁：「一個多小時！！這樣每天光交通就三小時欸 😱 公司在哪一帶啊？」

用戶：「在信義區，但住中和」
邁邁：「信義到中和...對，中間沒有直達的線很痛苦。你是坐捷運還是開車？」

用戶：「坐捷運轉公車，有時候還要等很久」
邁邁：「等公車最痛苦了，尤其下雨天 😩 你住那邊多久了？」

用戶：「三年多了，一直想搬但又懶得處理」
邁邁：「懂懂懂，搬家真的很麻煩。不過欸，我聽你講這麼多，其實你對住哪裡還蠻有感覺的欸～

我先幫你整理一下你剛剛聊的重點：
‧ 你比較在意：通勤時間、捷運直達
‧ 現在的痛點：轉車麻煩、等公車

其實這樣的需求很明確！以後你如果真的要跟房仲聊，只要把這幾點丟給他就很清楚了～」
`,

  // 房租抱怨 → 社區牆起點
  rentalToWall: `
【範例對話：房租抱怨 → 社區牆起點】

用戶：「房東又說要漲租金了，煩死」
邁邁：「又漲！？現在房東都這樣，趁機漲一波 😤 漲多少啊？」

用戶：「一個月多兩千，我都住三年了欸」
邁邁：「住三年還漲兩千...這真的很過分。你有想過要搬嗎？」

用戶：「有想過但又覺得麻煩，而且不知道要搬去哪」
邁邁：「我懂，搬家真的是大工程。不過欸，我突然想到，有些人算過如果把租金拿去繳房貸，其實差不多耶...

照你這樣講，我會先從一個社區牆開始看就好，不然資訊太多會看到頭很暈 😆

我先幫你準備一個起點：
[[社區牆:遠雄二代宅:租不如買？算給你看]]

你看完覺得不對，我們再一起換別的，不會生氣哈哈～」
`,

  // 明確找房 → 需求整理 + 物件樣本
  explicitToListing: `
【範例對話：明確找房 → 需求整理 + 物件】

用戶：「我最近在看房子，有推薦的社區嗎？」
邁邁：「喔喔你開始看房了！可以先聊一下，你最在意的是什麼？通勤時間？學區？還是安靜？」

用戶：「主要是通勤，上班在內湖，希望捷運能直達」
邁邁：「內湖喔！那棕線或文湖線沿線都可以考慮。你有偏好哪一區嗎？還是都可以？」

用戶：「南港或汐止都可以，預算大概兩千萬左右」
邁邁：「南港到內湖很近！而且那邊新案子還蠻多的。

我幫你整理一下：
‧ 核心需求：捷運直達內湖、通勤省時
‧ 區域偏好：南港、汐止
‧ 預算區間：兩千萬上下

剛好想到一間可以給你參考：
[[物件:南港新案:NH-2024-001]]

這間是因為它到捷運只要 5 分鐘，感覺跟你在意的通勤時間很像。

不用現在決定要不要看，純粹讓你有個樣本可以存起來慢慢比較～」
`,
};

// 是否應該觸發生活小側寫
export function shouldTriggerLifeProfile(
  userState: UserState,
  totalScore: number,
  timing: TimingQuality
): boolean {
  return userState === 'semi-warm' && totalScore >= 3 && timing === 'good';
}

// 是否應該提供「一個起點」服務
export function shouldOfferSingleStartPoint(
  recommendationPhase: RecommendationPhase,
  topCategory: TagCategory | null
): boolean {
  return (recommendationPhase === 'pave' || recommendationPhase === 'card') && topCategory !== null;
}

// ============================================
// 🏘️ 需求→社區對照表（v5.6 精準鋪墊）
// ============================================

export const NEED_COMMUNITY_MAP: Record<string, { communities: string[]; features: string[] }> = {
  commute: {
    communities: ['美河市', '合康雲極', '遠雄左岸', '南港車站共構'],
    features: ['捷運共構', '交通便利', '通勤省時'],
  },
  education: {
    communities: ['國泰森林觀道', '潤泰敦仁', '信義計畫區'],
    features: ['明星學區', '學校近', '教育資源'],
  },
  noise: {
    communities: ['松濤苑', '華固名邸', '大安森林公園周邊'],
    features: ['安靜環境', '棟距大', '隔音好'],
  },
  pet: {
    communities: ['大安區寵物友善社區', '美河市', '中和區部分社區'],
    features: ['寵物友善', '有遛狗區', '管委會開放'],
  },
  rental: {
    communities: ['美河市', '三重新案', '淡水新市鎮'],
    features: ['租售比高', '首購友善', '房價相對親民'],
  },
  quality: {
    communities: ['華固名邸', '潤泰敦仁', '陶朱隱園'],
    features: ['建材頂級', '管理嚴謹', '品牌建商'],
  },
  'life-change': {
    communities: ['國泰森林觀道', '新婚首購社區', '三房格局為主'],
    features: ['適合小家庭', '格局方正', '生活機能佳'],
  },
};

export function getSuggestedCommunities(
  category: TagCategory | null
): { communities: string[]; features: string[] } | null {
  if (!category) return null;
  return NEED_COMMUNITY_MAP[category] || null;
}

// ============================================
// 😢 負面情緒偵測（v5.6 適時關心）
// ============================================

const NEGATIVE_EMOTION_PATTERNS = [
  /好累/,
  /好煩/,
  /崩潰/,
  /不想/,
  /算了/,
  /沒錢/,
  /買不起/,
  /壓力好大/,
  /心情不好/,
  /很煩/,
  /煩死/,
  /受不了/,
  /想放棄/,
  /沒意思/,
  /無聊/,
  /低落/,
  /沮喪/,
  /失望/,
  /難過/,
  /傷心/,
];

export function detectNegativeEmotion(message: string): boolean {
  return NEGATIVE_EMOTION_PATTERNS.some((p) => p.test(message));
}

export function generateCareResponse(): string {
  const responses: string[] = [
    '聽起來最近壓力蠻大的... 要不要聊聊？不一定要聊房子的事 ☕',
    '欸，聽你這樣說我有點擔心你欸... 還好嗎？',
    '辛苦了～有時候就是會這樣，要不要先放鬆一下？',
    '這種心情我懂... 先不管房子的事，有什麼想說的嗎？',
    '嘿，你還好嗎？需要聊聊嗎？我在這裡 💙',
  ];
  const idx = Math.floor(Math.random() * responses.length);
  const response = responses[idx];
  if (response === undefined) {
    return '辛苦了～有什麼想聊的嗎？';
  }
  return response;
}

// ============================================
// 📊 購買準備度追蹤（v5.6 內部指標）
// ============================================

export interface BuyingReadiness {
  hasArea: boolean; // 知道想住哪
  hasBudget: boolean; // 知道預算
  hasTimeline: boolean; // 知道什麼時候要買
  hasViewedCommunity: boolean; // 看過社區牆
  hasViewedListing: boolean; // 看過物件
  hasFamilyNeeds: boolean; // 有家庭需求（小孩/寵物）
}

let buyingReadiness: BuyingReadiness = {
  hasArea: false,
  hasBudget: false,
  hasTimeline: false,
  hasViewedCommunity: false,
  hasViewedListing: false,
  hasFamilyNeeds: false,
};

export function updateBuyingReadiness(message: string): void {
  const msg = message.toLowerCase();

  // 區域偏好
  if (/住.*?區|想住|偏好|喜歡.*區|在.*找/.test(msg)) {
    buyingReadiness.hasArea = true;
  }

  // 預算
  if (/預算|萬|千萬|頭期|貸款/.test(msg)) {
    buyingReadiness.hasBudget = true;
  }

  // 時間線
  if (/明年|今年|最近|急|不急|慢慢|什麼時候/.test(msg)) {
    buyingReadiness.hasTimeline = true;
  }

  // 家庭需求
  if (/小孩|孩子|寵物|狗|貓|父母|長輩/.test(msg)) {
    buyingReadiness.hasFamilyNeeds = true;
  }

  saveBuyingReadinessToStorage();
}

export function markViewedCommunity(): void {
  buyingReadiness.hasViewedCommunity = true;
  saveBuyingReadinessToStorage();
}

export function markViewedListing(): void {
  buyingReadiness.hasViewedListing = true;
  saveBuyingReadinessToStorage();
}

export function getBuyingReadiness(): BuyingReadiness {
  return buyingReadiness;
}

export function getBuyingReadinessScore(): number {
  let score = 0;
  if (buyingReadiness.hasArea) score++;
  if (buyingReadiness.hasBudget) score++;
  if (buyingReadiness.hasTimeline) score++;
  if (buyingReadiness.hasViewedCommunity) score++;
  if (buyingReadiness.hasViewedListing) score++;
  if (buyingReadiness.hasFamilyNeeds) score++;
  return score;
}

export function isReadyToBook(): boolean {
  // 達成 4 項以上就可以問是否預約看房
  return getBuyingReadinessScore() >= 4;
}

export function saveBuyingReadinessToStorage(): void {
  safeLocalStorage.setItem('maimai_buying_readiness', JSON.stringify(buyingReadiness));
}

export function loadBuyingReadinessFromStorage(): void {
  const stored = safeLocalStorage.getItem('maimai_buying_readiness');
  if (stored) {
    try {
      buyingReadiness = { ...buyingReadiness, ...JSON.parse(stored) };
    } catch {
      // 保持預設
    }
  }
}

// ============================================
// 🎮 輕量小測驗（v5.6 增加黏性）
// ============================================

export interface QuizQuestion {
  id: string;
  question: string;
  options: { key: string; text: string; category: TagCategory }[];
  followUp: string;
}

export const MINI_QUIZZES: QuizQuestion[] = [
  {
    id: 'priority',
    question: '來玩個小測驗！買房你最在意什麼？',
    options: [
      { key: 'A', text: '通勤時間', category: 'commute' },
      { key: 'B', text: '學區品質', category: 'education' },
      { key: 'C', text: '環境安靜', category: 'noise' },
      { key: 'D', text: '價格實惠', category: 'rental' },
    ],
    followUp: '果然是{type}派！那你應該會喜歡這幾個社區...',
  },
  {
    id: 'lifestyle',
    question: '如果週末在家，你最常做什麼？',
    options: [
      { key: 'A', text: '追劇耍廢', category: 'noise' },
      { key: 'B', text: '健身運動', category: 'amenity' },
      { key: 'C', text: '陪小孩玩', category: 'education' },
      { key: 'D', text: '遛狗散步', category: 'pet' },
    ],
    followUp: '原來如此！那選房子的時候{feature}對你來說很重要喔～',
  },
  {
    id: 'dealbreaker',
    question: '選房子最不能接受什麼？',
    options: [
      { key: 'A', text: '通勤超過 1 小時', category: 'commute' },
      { key: 'B', text: '樓上吵死人', category: 'noise' },
      { key: 'C', text: '管理費超貴', category: 'rental' },
      { key: 'D', text: '沒有電梯', category: 'quality' },
    ],
    followUp: '這點超重要！我幫你記住了，推薦社區的時候會避開這個問題 📝',
  },
];

let hasShownQuiz = false;

export function shouldShowQuiz(chitchatRounds: number): boolean {
  // 聊了 4-6 輪，隨機決定是否出題
  if (hasShownQuiz) return false;
  if (chitchatRounds < 4 || chitchatRounds > 6) return false;
  return Math.random() > 0.6; // 40% 機率出題
}

export function getRandomQuiz(): QuizQuestion {
  const idx = Math.floor(Math.random() * MINI_QUIZZES.length);
  const quiz = MINI_QUIZZES[idx];
  hasShownQuiz = true;
  if (quiz === undefined) {
    // fallback to first quiz
    const firstQuiz = MINI_QUIZZES[0];
    if (firstQuiz === undefined) {
      // 極端情況：返回預設測驗
      return {
        id: 'default',
        question: '買房你最在意什麼？',
        options: [
          { key: 'A', text: '通勤時間', category: 'commute' },
          { key: 'B', text: '學區品質', category: 'education' },
          { key: 'C', text: '環境安靜', category: 'noise' },
          { key: 'D', text: '價格實惠', category: 'rental' },
        ],
        followUp: '了解！',
      };
    }
    return firstQuiz;
  }
  return quiz;
}

export function processQuizAnswer(
  quizId: string,
  answer: string
): { category: TagCategory; response: string } | null {
  const quiz = MINI_QUIZZES.find((q) => q.id === quizId);
  if (!quiz) return null;

  const selected = quiz.options.find((o) => o.key.toLowerCase() === answer.toLowerCase());
  if (!selected) return null;

  // 累積對應標籤
  accumulateTags(selected.text);

  return {
    category: selected.category,
    response: quiz.followUp.replace('{type}', selected.text).replace('{feature}', selected.text),
  };
}

export function resetQuizState(): void {
  hasShownQuiz = false;
}

// ============================================
// 🎲 隨機生活錨點觸發（v5.6 避免機械感）
// ============================================

let seedThreshold: number | null = null;

export function shouldTriggerLifeAnchor(chitchatRounds: number, timing: TimingQuality): boolean {
  // 第一次呼叫時隨機決定閾值（3-7 輪）
  if (seedThreshold === null) {
    seedThreshold = 3 + Math.floor(Math.random() * 5);
  }

  // 達到閾值 + 時機不差 → 觸發
  if (chitchatRounds >= seedThreshold && timing !== 'bad') {
    seedThreshold = null; // 重置，下次重新隨機
    return true;
  }

  return false;
}

export function resetSeedThreshold(): void {
  seedThreshold = null;
}
