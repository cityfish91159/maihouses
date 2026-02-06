// 報告類型定義

export type ReportStyle = 'simple' | 'investment' | 'marketing';

export interface ReportHighlight {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
}

export interface ReportData {
  id: string;
  shortCode: string;
  propertyId: string;
  agentId: string;

  // 報告設定
  style: ReportStyle;
  highlights: string[]; // highlight ids
  photos: string[];
  customMessage?: string;

  // 追蹤
  viewCount: number;
  createdAt: string;
  expiresAt: string;
}

export interface PropertyReportData {
  // 基本資訊
  id: string;
  publicId: string;
  title: string;
  price: number;
  address: string;
  description: string;
  images: string[];

  // 規格
  size?: number;
  age?: number;
  rooms?: number;
  halls?: number;
  bathrooms?: number;
  floorCurrent?: string;
  floorTotal?: number;
  propertyType?: string;
  direction?: string;
  parking?: string;

  // 社區
  communityName?: string;
  communityYear?: number;
  communityUnits?: number;
  managementFee?: number;

  // 兩好一公道
  advantage1?: string;
  advantage2?: string;
  disadvantage?: string;

  // 亮點
  highlights?: ReportHighlight[];

  // 經紀人
  agent: {
    id: string;
    name: string;
    avatarUrl: string;
    company: string;
    phone?: string;
    lineId?: string;
    trustScore?: number;
    reviewCount?: number;
    experience?: number;
  };
}

// 亮點選項
export const HIGHLIGHT_OPTIONS: ReportHighlight[] = [
  {
    id: 'commute',
    icon: '🚇',
    title: '通勤便利',
    subtitle: '近捷運/公車站',
    description: '步行可達大眾運輸，通勤方便',
  },
  {
    id: 'school',
    icon: '🎓',
    title: '優質學區',
    subtitle: '明星學區內',
    description: '位於優質學區，子女就學方便',
  },
  {
    id: 'community',
    icon: '🏠',
    title: '社區單純',
    subtitle: '住戶素質佳',
    description: '社區管理良好，住戶組成單純',
  },
  {
    id: 'view',
    icon: '🌅',
    title: '景觀優美',
    subtitle: '高樓層視野',
    description: '樓層高，採光佳，景觀開闊',
  },
  {
    id: 'amenity',
    icon: '🛒',
    title: '生活機能',
    subtitle: '商圈近便',
    description: '周邊生活機能完善，購物方便',
  },
  {
    id: 'parking',
    icon: '🅿️',
    title: '車位充足',
    subtitle: '含車位',
    description: '附設車位，停車無煩惱',
  },
  {
    id: 'renovated',
    icon: '✨',
    title: '精裝入住',
    subtitle: '裝潢完善',
    description: '屋況良好，可直接入住',
  },
];

// 報告樣式定義
export const REPORT_STYLES = {
  simple: {
    id: 'simple',
    name: '簡潔說明書',
    description: '適合一般買家，清楚呈現基本資訊',
    icon: '📋',
  },
  investment: {
    id: 'investment',
    name: '投資分析版',
    description: '適合投資客，詳細呈現投報數據',
    icon: '📊',
  },
  marketing: {
    id: 'marketing',
    name: '行銷文案版',
    description: '適合首購族，故事感強的呈現',
    icon: '✨',
  },
} as const;
