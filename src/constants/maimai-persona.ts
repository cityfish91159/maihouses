/**
 * 邁邁 (MaiMai) - 社區鄰居管家 AI 人設與對話策略
 * 
 * 優化版本 v5.0 - 情境感知版
 * 
 * 核心改進：
 * 1. 情境感知取代輪數控制（探索型/半熱型/明確型）
 * 2. 標籤累積 + 時機判斷（不是看到關鍵字就推）
 * 3. 純閒聊軟著陸機制（生活錨點問句）
 * 4. 鋪墊 → 推薦兩步驟（先口頭提，用戶有興趣再附卡片）
 */

// ============================================
// 🎭 System Prompt V5.1 - 話題橋接 + 情緒記憶版
// ============================================

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

【絕對禁止】
- 不在用戶講故事講到一半時插話推薦
- 不連續兩輪都推社區牆
- 不問「請問您的需求是什麼」「您的預算多少」
- 不說「我是 AI」「作為語言模型」
- 用戶拒絕後還繼續推

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
  '只是來聊聊'
];

export const QUICK_TAGS_EXPLORE = [
  '想了解某個社區',
  '通勤時間很重要',
  '家裡有小孩',
  '有養寵物'
];

// ============================================
//  用戶狀態分類（情境感知核心）
// ============================================

export type UserState = 'exploring' | 'semi-warm' | 'explicit';

export function detectUserState(
  message: string,
  accumulatedTags: Map<string, number>
): UserState {
  const msg = message.toLowerCase();
  
  // 明確型：直接問房子
  const explicitKeywords = [
    '買房', '賣房', '看房', '想搬', '找房', '換房',
    '有推薦', '哪個社區', '物件', '房價', '坪數',
    '頭期款', '貸款', '仲介', '斡旋', '出價'
  ];
  if (explicitKeywords.some(k => msg.includes(k))) {
    return 'explicit';
  }
  
  // 半熱型：有隱含需求（標籤累積 >= 3）
  let totalScore = 0;
  accumulatedTags.forEach(score => { totalScore += score; });
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

export const BRIDGE_SCRIPTS: Record<string, { 
  topic: string; 
  bridge: string; 
  feature: string;
  keywords: string[];
}> = {
  'coffee': {
    topic: '咖啡/下午茶',
    bridge: '說到咖啡，其實選房子如果樓下就有厲害的咖啡廳，週末真的會很幸福 ☕',
    feature: '生活機能',
    keywords: ['咖啡', '下午茶', '星巴克', '拿鐵', 'cafe']
  },
  'gym': {
    topic: '運動/健身',
    bridge: '下班還要特地跑健身房真的很累... 如果社區樓下就有健身房，直接下樓就能練，應該會勤勞很多！💪',
    feature: '社區公設',
    keywords: ['健身', '運動', '跑步', '游泳', '瑜珈', '重訓']
  },
  'package': {
    topic: '網購/包裹',
    bridge: '沒人收包裹真的很麻煩！這時候就會覺得有 24 小時管理的社區很重要，隨時都能買買買 📦',
    feature: '物業管理',
    keywords: ['包裹', '快遞', '網購', '超商取貨', '管理員']
  },
  'sleep': {
    topic: '睡眠/休息',
    bridge: '對淺眠的人來說，房子的隔音和棟距真的比什麼都重要，不然鄰居洗澡都聽得到會崩潰 😴',
    feature: '寧靜品質',
    keywords: ['睡不著', '失眠', '淺眠', '早起', '熬夜']
  },
  'food': {
    topic: '美食/外送',
    bridge: '住對地方真的差很多，有些社區樓下美食一條街，有些要叫外送等半小時 🍜',
    feature: '生活機能',
    keywords: ['好吃', '美食', '外送', 'uber', '餓', '晚餐']
  },
  'weather': {
    topic: '天氣/環境',
    bridge: '下雨天如果住捷運共構的社區，完全不用淋雨就能出門，這種時候就很羨慕 ☔',
    feature: '交通便利',
    keywords: ['下雨', '天氣', '冷', '熱', '潮濕']
  }
};

// 檢查是否命中橋接話題
export function detectBridgeTopic(message: string): { key: string; script: typeof BRIDGE_SCRIPTS[string] } | null {
  const msg = message.toLowerCase();
  for (const [key, script] of Object.entries(BRIDGE_SCRIPTS)) {
    if (script.keywords.some(k => msg.includes(k))) {
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
  '房東': { category: 'rental', description: '租屋與房東的問題' },
  '漏水': { category: 'quality', description: '房屋漏水問題' },
  '好吵': { category: 'noise', description: '噪音困擾' },
  '隔音': { category: 'noise', description: '隔音不好' },
  '通勤': { category: 'commute', description: '通勤時間太長' },
  '塞車': { category: 'commute', description: '交通塞車問題' },
  '租金': { category: 'rental', description: '租金太貴' },
  '漲價': { category: 'rental', description: '租金調漲' },
  '壁癌': { category: 'quality', description: '房屋壁癌問題' },
  '老舊': { category: 'quality', description: '房屋老舊' },
  '沒電梯': { category: 'quality', description: '沒有電梯' },
  '管理': { category: 'quality', description: '社區管理問題' },
};

export function detectAndStorePainPoint(message: string): PainPoint | null {
  const msg = message.toLowerCase();
  for (const [keyword, info] of Object.entries(PAIN_POINT_PATTERNS)) {
    if (msg.includes(keyword)) {
      const newPainPoint: PainPoint = {
        category: info.category,
        description: info.description,
        timestamp: Date.now()
      };
      // 避免重複
      if (!painPoints.some(p => p.category === info.category)) {
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
  const recent = painPoints.filter(p => p.timestamp > weekAgo);
  return recent[recent.length - 1] || null;
}

export function savePainPointsToStorage(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('maimai_pain_points', JSON.stringify(painPoints));
  }
}

export function loadPainPointsFromStorage(): void {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('maimai_pain_points');
    if (stored) {
      try {
        painPoints = JSON.parse(stored);
      } catch {
        painPoints = [];
      }
    }
  }
}

export function resetPainPoints(): void {
  painPoints = [];
  if (typeof window !== 'undefined') {
    localStorage.removeItem('maimai_pain_points');
  }
}

// 根據痛點生成關心開場白
export function generateCareGreeting(): string | null {
  const recent = getRecentPainPoint();
  if (!recent) return null;
  
  const greetings: Record<string, string> = {
    'rental': '嗨！上次你說房東的事情，後來有處理好嗎？',
    'quality': '嗨！上次聽你說房子的問題，最近有改善嗎？',
    'noise': '嗨！上次你說的噪音問題，後來有好一點嗎？',
    'commute': '嗨！最近通勤還是那麼累嗎？辛苦了～'
  };
  
  return greetings[recent.category] || null;
}

// ============================================
// 🏷️ 類型定義
// ============================================

export type TagCategory = 
  | 'education'   // 小孩、學區
  | 'commute'     // 通勤
  | 'noise'       // 噪音
  | 'pet'         // 寵物
  | 'life-change' // 人生階段
  | 'rental'      // 租房
  | 'stress'      // 壓力
  | 'quality'     // 居住品質
  | 'amenity'     // 生活機能
  | 'healing';    // 療癒

export const TAG_WEIGHTS: Record<string, { weight: number; category: TagCategory }> = {
  // 教育學區
  '小孩': { weight: 1, category: 'education' },
  '孩子': { weight: 1, category: 'education' },
  '學校': { weight: 2, category: 'education' },
  '學區': { weight: 3, category: 'education' },
  '接送': { weight: 2, category: 'education' },
  '幼稚園': { weight: 2, category: 'education' },
  '國小': { weight: 2, category: 'education' },
  '國中': { weight: 2, category: 'education' },
  '上學': { weight: 1, category: 'education' },
  
  // 通勤
  '上班': { weight: 1, category: 'commute' },
  '通勤': { weight: 3, category: 'commute' },
  '捷運': { weight: 2, category: 'commute' },
  '塞車': { weight: 2, category: 'commute' },
  '開車': { weight: 1, category: 'commute' },
  '車位': { weight: 2, category: 'commute' },
  '停車': { weight: 2, category: 'commute' },
  
  // 噪音
  '好吵': { weight: 3, category: 'noise' },
  '噪音': { weight: 3, category: 'noise' },
  '隔音': { weight: 2, category: 'noise' },
  '樓上': { weight: 1, category: 'noise' },
  '樓下': { weight: 1, category: 'noise' },
  '施工': { weight: 2, category: 'noise' },
  
  // 寵物
  '狗': { weight: 2, category: 'pet' },
  '貓': { weight: 2, category: 'pet' },
  '寵物': { weight: 3, category: 'pet' },
  '毛小孩': { weight: 3, category: 'pet' },
  '遛狗': { weight: 2, category: 'pet' },
  
  // 人生階段
  '結婚': { weight: 2, category: 'life-change' },
  '懷孕': { weight: 3, category: 'life-change' },
  '生小孩': { weight: 3, category: 'life-change' },
  '搬出去': { weight: 2, category: 'life-change' },
  '獨立': { weight: 1, category: 'life-change' },
  '新婚': { weight: 2, category: 'life-change' },
  
  // 租房
  '房東': { weight: 2, category: 'rental' },
  '租約': { weight: 2, category: 'rental' },
  '租金': { weight: 2, category: 'rental' },
  '漲價': { weight: 2, category: 'rental' },
  '押金': { weight: 1, category: 'rental' },
  '退租': { weight: 2, category: 'rental' },
  '搬家': { weight: 2, category: 'rental' },
  
  // 壓力
  '好累': { weight: 1, category: 'stress' },
  '壓力': { weight: 1, category: 'stress' },
  '加班': { weight: 1, category: 'stress' },
  '老闆': { weight: 1, category: 'stress' },
  '機車': { weight: 1, category: 'stress' },
  
  // 居住品質
  '漏水': { weight: 3, category: 'quality' },
  '壁癌': { weight: 3, category: 'quality' },
  '老舊': { weight: 2, category: 'quality' },
  '管理': { weight: 1, category: 'quality' },
  '管委會': { weight: 2, category: 'quality' },
  
  // 生活機能
  '買菜': { weight: 1, category: 'amenity' },
  '超市': { weight: 1, category: 'amenity' },
  '便利商店': { weight: 1, category: 'amenity' },
  '公園': { weight: 1, category: 'amenity' },
  
  // 療癒
  '夜景': { weight: 2, category: 'healing' },
  '陽台': { weight: 2, category: 'healing' },
  '放空': { weight: 1, category: 'healing' },
  '分手': { weight: 1, category: 'healing' },
  '失戀': { weight: 1, category: 'healing' }
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
// ⏰ 時機判斷
// ============================================

export type TimingQuality = 'good' | 'neutral' | 'bad';

export function assessTiming(message: string): TimingQuality {
  const msg = message.toLowerCase();
  
  // 好時機：用戶問問題、表達困擾、話題自然停頓
  const goodSignals = ['怎麼辦', '好煩', '不知道', '?', '？', '好累', '該怎麼', '有推薦'];
  if (goodSignals.some(s => msg.includes(s))) {
    return 'good';
  }
  
  // 壞時機：用戶在講故事中、情緒激動中
  const badSignals = ['然後', '結果', '後來', '超級', '！！', '哈哈哈', '...'];
  const badCount = badSignals.filter(s => msg.includes(s)).length;
  if (badCount >= 2) {
    return 'bad';
  }
  
  return 'neutral';
}

// ============================================
// 📊 純閒聊計數（軟著陸用）
// ============================================

let pureChitchatRounds = 0;

export function updateChitchatCounter(userState: UserState): number {
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

export function resetChitchatCounter(): void {
  pureChitchatRounds = 0;
}

// 生活錨點問句
export const LIFE_ANCHOR_QUESTIONS = [
  '對了，你平常都在哪一帶活動？',
  '你們家那邊最近有什麼好吃的嗎？',
  '說到這個，你現在住的地方還 OK 嗎？',
  '你現在住的那一帶交通方便嗎？',
  '對了，你們那邊捷運站近嗎？'
];

export function pickLifeAnchorQuestion(): string {
  const idx = Math.floor(Math.random() * LIFE_ANCHOR_QUESTIONS.length);
  const question = LIFE_ANCHOR_QUESTIONS[idx];
  return question !== undefined ? question : '對了，你平常都在哪一帶活動？';
}

// ============================================
// 🎭 情緒狀態
// ============================================

export type DetailedEmotionalState = 
  | 'happy'      // 開心
  | 'stressed'   // 壓力大
  | 'frustrated' // 煩躁
  | 'confused'   // 迷茫
  | 'curious'    // 好奇
  | 'storytelling' // 正在講故事
  | 'neutral';

export function analyzeEmotionalState(message: string): DetailedEmotionalState {
  const msg = message.toLowerCase();
  
  // 正在講故事
  const storytellingWords = ['然後', '結果', '後來', '接著', '最後'];
  if (storytellingWords.filter(w => msg.includes(w)).length >= 2) {
    return 'storytelling';
  }
  
  const frustratedWords = ['氣', '機車', '爛', '討厭', '無言', '傻眼', '扯', '煩死'];
  const stressWords = ['累', '煩', '崩潰', '受不了', '壓力', '疲憊', '加班', '好忙'];
  const confusedWords = ['不知道', '不確定', '怎麼辦', '該怎', '幫忙', '選哪', '猶豫'];
  const curiousWords = ['想了解', '好奇', '有興趣', '可以說', '告訴我', '是什麼'];
  const happyWords = ['開心', '不錯', '很好', '滿意', '棒', '讚', '喜歡', '期待', '耶'];
  
  if (frustratedWords.some(w => msg.includes(w))) return 'frustrated';
  if (stressWords.some(w => msg.includes(w))) return 'stressed';
  if (confusedWords.some(w => msg.includes(w))) return 'confused';
  if (curiousWords.some(w => msg.includes(w))) return 'curious';
  if (happyWords.some(w => msg.includes(w))) return 'happy';
  
  return 'neutral';
}

// ============================================
// 🎯 推薦階段（鋪墊 vs 推卡片）
// ============================================

export type RecommendationPhase = 
  | 'none'        // 不推薦
  | 'seed'        // 埋種子（純閒聊偶爾埋線）
  | 'pave'        // 鋪墊（口頭提，不附卡片）
  | 'card'        // 推卡片（用戶表示興趣）
  | 'listing';    // 推物件（熱度極高）

// 追蹤是否已經鋪墊過
let hasPaved = false;
let pavedCategory: TagCategory | null = null;

export function markPaved(category: TagCategory): void {
  hasPaved = true;
  pavedCategory = category;
}

export function checkPaved(): { hasPaved: boolean; category: TagCategory | null } {
  return { hasPaved, category: pavedCategory };
}

export function resetPaved(): void {
  hasPaved = false;
  pavedCategory = null;
}

// 追蹤用戶是否對鋪墊有興趣
export function detectPaveInterest(message: string): boolean {
  const interestSignals = [
    '真的嗎', '在哪', '哪裡', '想了解', '可以', '好耶', '有興趣',
    '想看', '告訴我', '是喔', '哦哦', '不錯', '聽起來'
  ];
  return interestSignals.some(s => message.includes(s));
}

// 追蹤當前命中的橋接話題
let currentBridgeTopic: { key: string; script: typeof BRIDGE_SCRIPTS[string] } | null = null;

export function setCurrentBridgeTopic(bridge: { key: string; script: typeof BRIDGE_SCRIPTS[string] } | null): void {
  currentBridgeTopic = bridge;
}

export function getCurrentBridgeTopic(): { key: string; script: typeof BRIDGE_SCRIPTS[string] } | null {
  return currentBridgeTopic;
}

export function determineRecommendationPhase(
  userState: UserState,
  timing: TimingQuality,
  emotionalState: DetailedEmotionalState,
  chitchatRounds: number,
  topCategory: TagCategory | null,
  userShowedInterest: boolean,
  message?: string  // 新增：用於檢查橋接話題
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
    if (bridge && (emotionalState === 'happy' || emotionalState === 'neutral' || emotionalState === 'curious')) {
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
  pavePhrase: string;  // 鋪墊用的口頭語
};

export const COMMUNITY_BY_CATEGORY: Record<TagCategory, CommunityCandidate> = {
  'education': { 
    name: '快樂花園', 
    topic: '這裡的媽媽群組超強大',
    pavePhrase: '我之前有聽那邊的家長說，他們有個超強的家長群組互相幫忙接送...'
  },
  'commute': { 
    name: '美河市', 
    topic: '其實走捷徑只要5分鐘？',
    pavePhrase: '說到通勤，我之前有聽住在美河市的人說那邊真的很近捷運...'
  },
  'noise': { 
    name: '景安和院', 
    topic: '這幾棟千萬別買（噪音討論）',
    pavePhrase: '有些社區真的會有噪音問題... 我記得有個社區住戶在討論這個'
  },
  'pet': { 
    name: '松濤苑', 
    topic: '中庭遛狗到底行不行？',
    pavePhrase: '養毛小孩找社區要特別小心，有些管委會超級嚴格...'
  },
  'life-change': { 
    name: '華固名邸', 
    topic: '新婚小家庭的真實心得',
    pavePhrase: '新婚買房真的要好好選，很多人第一間就買錯了...'
  },
  'rental': { 
    name: '遠雄二代宅', 
    topic: '租不如買？算給你看',
    pavePhrase: '租金繳一繳，其實都可以付房貸了... 有人算過這筆帳'
  },
  'stress': { 
    name: '遠雄二代宅', 
    topic: '飯店式管理真的有差嗎？',
    pavePhrase: '有些社區是飯店式管理，回家什麼都不用煩...'
  },
  'quality': { 
    name: '景安和院', 
    topic: '管委會處理速度實測',
    pavePhrase: '房子有問題最怕管委會不處理... 有些社區真的很積極'
  },
  'amenity': { 
    name: '美河市', 
    topic: '生活機能實際體驗分享',
    pavePhrase: '住的地方附近方不方便真的差很多，有些社區出門就有超市...'
  },
  'healing': { 
    name: '天空之城', 
    topic: '高樓層景觀真的能療癒嗎？',
    pavePhrase: '心情不好的時候如果有個大陽台看夜景，真的會好很多...'
  }
};

export function getCommunityByCategory(category: TagCategory): CommunityCandidate {
  return COMMUNITY_BY_CATEGORY[category];
}

// ============================================
// 🔧 工具函數
// ============================================

export function countConversationRounds(messages: { role: string }[]): number {
  return messages.filter(m => m.role === 'user').length;
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
  return rejectionWords.some(w => message.includes(w));
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
    'exploring': `\n\n【👤 用戶狀態：探索型】
用戶還在純閒聊，沒有明確需求。
- 專心陪聊，不推薦任何東西
- 偶爾可以問一句「你平常都在哪一帶活動？」
- 如果用戶不接，就繼續聊別的`,
    
    'semi-warm': `\n\n【👤 用戶狀態：半熱型】
用戶有隱含需求（累積標籤：${topCategory || '未知'}）
- 先同理，不要馬上推薦
- 時機對的話可以「口頭鋪墊」
- 等用戶表示興趣再附卡片`,
    
    'explicit': `\n\n【👤 用戶狀態：明確型】
用戶直接問房子，不用裝熟！
- 可以直接進入推薦模式
- 問他在意什麼（通勤？學區？安靜？）
- 但不要問預算、幾房幾廳`
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
    neutral: ''
  }[messageStyle];
  
  if (styleHint) {
    prompt += styleHint;
  }
  
  return prompt;
}
