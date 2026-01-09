import React, { useState, useRef } from "react";
import { notify } from "../../../../lib/notify";
import {
  Upload,
  Copy,
  ChevronRight,
  ChevronLeft,
  Home,
  MapPin,
  Ruler,
  Calendar,
  Building,
  Compass,
  DollarSign,
  MessageCircle,
  CheckCircle,
  Sparkles,
  X,
  ExternalLink,
  Phone,
} from "lucide-react";
import uagStyles from "../../UAG.module.css";
import styles from "./ReportGenerator.module.css";
import type { Listing } from "../../types/uag.types";

// 報告樣式類型
type ReportStyle = "simple" | "investment" | "marketing";

// Props 介面
interface ReportGeneratorProps {
  listings?: Listing[];
  agentName?: string;
  agentPhone?: string;
}

// 亮點類型
interface Highlight {
  id: string;
  icon: string;
  title: string;
  description: string;
  selected: boolean;
}

// 物件資料類型
interface PropertyData {
  id: string;
  title: string;
  address: string;
  district: string;
  price: number;
  pricePerPing: number;
  size: number;
  rooms: string;
  floor: string;
  floorTotal: number;
  age: number;
  direction: string;
  parking: string;
  managementFee: number;
  community: string;
  communityYear: number;
  communityUnits: number;
  propertyType: string;
  description: string;
  images: string[];
  highlights: Highlight[];
}

// 預設物件資料
const DEFAULT_PROPERTY: PropertyData = {
  id: "demo-001",
  title: "12F 高樓層｜3房2廳2衛｜平面車位",
  address: "台中市南屯區惠文路 168 號",
  district: "南屯區",
  price: 32880000,
  pricePerPing: 521000,
  size: 67.3,
  rooms: "3房2廳2衛",
  floor: "12",
  floorTotal: 15,
  age: 5,
  direction: "南",
  parking: "平面車位",
  managementFee: 3500,
  community: "惠宇上晴",
  communityYear: 2019,
  communityUnits: 280,
  propertyType: "電梯大樓",
  description:
    "高樓層景觀戶，採光通風極佳。格局方正實用，三面採光無暗房。社區管理完善，24小時警衛駐守。步行5分鐘至捷運市政府站，生活機能完善。屋況維護良好，可隨時交屋。",
  images: [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
  ],
  highlights: [
    {
      id: "commute",
      icon: "🚇",
      title: "通勤便利",
      description: "距捷運站步行 5 分鐘",
      selected: true,
    },
    {
      id: "school",
      icon: "🎓",
      title: "優質學區",
      description: "惠文國小學區內",
      selected: true,
    },
    {
      id: "community",
      icon: "🏠",
      title: "社區單純",
      description: "住戶多為家庭，管理良好",
      selected: true,
    },
    {
      id: "view",
      icon: "🌅",
      title: "景觀優美",
      description: "高樓層無遮蔽，視野開闊",
      selected: false,
    },
    {
      id: "amenity",
      icon: "🛒",
      title: "生活機能",
      description: "全聯、7-11 步行 3 分鐘",
      selected: false,
    },
    {
      id: "parking",
      icon: "🅿️",
      title: "車位方便",
      description: "含平面車位一個",
      selected: false,
    },
    {
      id: "renovated",
      icon: "✨",
      title: "精裝入住",
      description: "屋主精心裝潢，可直接入住",
      selected: false,
    },
  ],
};

// 我的房源列表（模擬）
const MY_LISTINGS: PropertyData[] = [
  DEFAULT_PROPERTY,
  {
    id: "demo-002",
    title: "18F 高樓層｜4房2廳3衛｜機械車位",
    address: "台北市中山區北安路 256 號",
    district: "中山區",
    price: 88000000,
    pricePerPing: 1120000,
    size: 78.5,
    rooms: "4房2廳3衛",
    floor: "18",
    floorTotal: 22,
    age: 3,
    direction: "東",
    parking: "機械車位",
    managementFee: 6800,
    community: "冠德美麗大直",
    communityYear: 2021,
    communityUnits: 156,
    propertyType: "電梯大樓",
    description:
      "大直水岸第一排，高樓層遠眺 101 與基隆河景觀。飯店式管理，公設完善包含游泳池、健身房。屋況全新，全室大理石地板，可直接入住。",
    images: [
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80",
    ],
    highlights: [
      {
        id: "commute",
        icon: "🚇",
        title: "通勤便利",
        description: "距捷運劍南路站步行 3 分鐘",
        selected: true,
      },
      {
        id: "view",
        icon: "🌅",
        title: "景觀優美",
        description: "高樓層遠眺 101",
        selected: true,
      },
      {
        id: "community",
        icon: "🏠",
        title: "頂級社區",
        description: "飯店式管理，公設完善",
        selected: true,
      },
      {
        id: "school",
        icon: "🎓",
        title: "明星學區",
        description: "大直國小學區內",
        selected: false,
      },
      {
        id: "amenity",
        icon: "🛒",
        title: "生活機能",
        description: "美麗華商圈步行 5 分鐘",
        selected: false,
      },
      {
        id: "parking",
        icon: "🅿️",
        title: "雙車位",
        description: "含機械車位兩個",
        selected: false,
      },
      {
        id: "renovated",
        icon: "✨",
        title: "豪宅規格",
        description: "全室大理石地板",
        selected: false,
      },
    ],
  },
  {
    id: "demo-003",
    title: "5F 中樓層｜2房1廳1衛｜無車位",
    address: "台北市士林區天母西路 88 號",
    district: "士林區",
    price: 24500000,
    pricePerPing: 680000,
    size: 36.0,
    rooms: "2房1廳1衛",
    floor: "5",
    floorTotal: 12,
    age: 15,
    direction: "西",
    parking: "無",
    managementFee: 2200,
    community: "國泰天母",
    communityYear: 2009,
    communityUnits: 88,
    propertyType: "電梯大樓",
    description:
      "天母商圈核心地段，SOGO、新光三越步行可達。天母國小明星學區，環境清幽適合家庭。北歐風格溫馨裝潢，採光佳，即可入住。",
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80",
    ],
    highlights: [
      {
        id: "amenity",
        icon: "🛒",
        title: "天母商圈",
        description: "SOGO、新光三越步行可達",
        selected: true,
      },
      {
        id: "school",
        icon: "🎓",
        title: "天母學區",
        description: "天母國小、天母國中學區",
        selected: true,
      },
      {
        id: "community",
        icon: "🏠",
        title: "純住宅區",
        description: "環境清幽，適合家庭",
        selected: true,
      },
      {
        id: "commute",
        icon: "🚇",
        title: "公車便利",
        description: "多線公車直達市區",
        selected: false,
      },
      {
        id: "view",
        icon: "🌅",
        title: "山景視野",
        description: "可遠眺陽明山",
        selected: false,
      },
      {
        id: "renovated",
        icon: "✨",
        title: "溫馨裝潢",
        description: "北歐風格，採光佳",
        selected: false,
      },
      {
        id: "parking",
        icon: "🅿️",
        title: "路邊好停",
        description: "社區周邊停車方便",
        selected: false,
      },
    ],
  },
];

// 報告樣式選項
const REPORT_STYLES: {
  id: ReportStyle;
  icon: string;
  title: string;
  desc: string;
}[] = [
  { id: "simple", icon: "📋", title: "簡潔說明書", desc: "清晰的基本資訊" },
  {
    id: "investment",
    icon: "📊",
    title: "投資分析版",
    desc: "數據導向，適合投資客",
  },
  {
    id: "marketing",
    icon: "✨",
    title: "行銷文案版",
    desc: "故事感強，適合首購族",
  },
];

export default function ReportGenerator({
  listings = [],
  agentName = "專屬顧問",
  agentPhone,
}: ReportGeneratorProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedProperty, setSelectedProperty] = useState<PropertyData | null>(
    null,
  );
  const [selectedStyle, setSelectedStyle] = useState<ReportStyle>("simple");
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [reportUrl, setReportUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatPrice = (price: number) => {
    if (price >= 100000000) {
      return `${(price / 100000000).toFixed(2)} 億`;
    }
    return `${(price / 10000).toFixed(0)} 萬`;
  };

  const calculateMonthlyPayment = (
    price: number,
    downPaymentRatio = 0.2,
    years = 30,
    rate = 0.021,
  ) => {
    const principal = price * (1 - downPaymentRatio);
    const monthlyRate = rate / 12;
    const months = years * 12;
    const payment =
      (principal * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
      (Math.pow(1 + monthlyRate, months) - 1);
    return Math.round(payment);
  };

  const handleSelectProperty = (property: PropertyData) => {
    setSelectedProperty(property);
    setHighlights(property.highlights);
    setStep(2);
  };

  const handleSelectStyle = (style: ReportStyle) => {
    setSelectedStyle(style);
    setStep(3);
  };

  const toggleHighlight = (id: string) => {
    const selectedCount = highlights.filter((h) => h.selected).length;
    setHighlights((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          if (!h.selected && selectedCount >= 3) {
            notify.error("最多只能選擇 3 個亮點");
            return h;
          }
          return { ...h, selected: !h.selected };
        }
        return h;
      }),
    );
  };

  const confirmHighlights = () => {
    const selectedCount = highlights.filter((h) => h.selected).length;
    if (selectedCount < 1) {
      notify.error("請至少選擇 1 個亮點");
      return;
    }
    setStep(4);
  };

  const generateReport = async () => {
    if (!selectedProperty) return;

    setIsGenerating(true);
    const toastId = notify.loading("正在生成精美報告...");

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const reportId = `R-${Date.now().toString(36).toUpperCase()}`;
      const url = `${window.location.origin}/r/${reportId}`;

      setReportUrl(url);
      setStep(5);
      notify.success("報告生成成功！", undefined, { id: toastId });
    } catch {
      notify.error("生成失敗，請重試", undefined, { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(reportUrl);
      notify.success("連結已複製！可直接貼到 LINE");
    } catch {
      notify.error("複製失敗");
    }
  };

  const shareToLine = () => {
    const message = encodeURIComponent(
      `【${selectedProperty?.title}】\n\n這是我幫您整理的物件報告，有空可以看看 🙂\n\n${reportUrl}`,
    );
    window.open(`https://line.me/R/msg/text/?${message}`, "_blank");
  };

  const reset = () => {
    setStep(1);
    setSelectedProperty(null);
    setSelectedStyle("simple");
    setHighlights([]);
    setReportUrl("");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = notify.loading("AI 正在分析房仲頁面...");

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const detectedProperty: PropertyData = {
        id: "detected-001",
        title: "18F 高樓層｜4房3廳4衛｜坡道平面",
        address: "台北市大安區仁愛路三段",
        district: "大安區",
        price: 188000000,
        pricePerPing: 1560000,
        size: 120.5,
        rooms: "4房3廳4衛",
        floor: "18",
        floorTotal: 24,
        age: 10,
        direction: "南",
        parking: "坡道平面",
        managementFee: 15000,
        community: "帝寶",
        communityYear: 2014,
        communityUnits: 52,
        propertyType: "豪宅大樓",
        description:
          "帝寶頂級豪宅，俯瞰仁愛路林蔭大道。全棟僅 52 戶，飯店式管理，隱私安全兼具。名人聚集，資產保值性高。",
        images: [
          "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80",
        ],
        highlights: [
          {
            id: "view",
            icon: "🌅",
            title: "頂級景觀",
            description: "俯瞰仁愛路林蔭大道",
            selected: true,
          },
          {
            id: "community",
            icon: "🏠",
            title: "頂級豪宅",
            description: "政商名流指定社區",
            selected: true,
          },
          {
            id: "renovated",
            icon: "✨",
            title: "奢華裝潢",
            description: "義大利進口建材",
            selected: true,
          },
          {
            id: "parking",
            icon: "🅿️",
            title: "雙車位",
            description: "坡道平面車位兩個",
            selected: false,
          },
          {
            id: "amenity",
            icon: "🛒",
            title: "精品商圈",
            description: "信義計畫區步行可達",
            selected: false,
          },
          {
            id: "commute",
            icon: "🚇",
            title: "捷運便利",
            description: "距大安站步行 8 分鐘",
            selected: false,
          },
          {
            id: "school",
            icon: "🎓",
            title: "明星學區",
            description: "仁愛國小學區",
            selected: false,
          },
        ],
      };

      setSelectedProperty(detectedProperty);
      setHighlights(detectedProperty.highlights);
      setStep(2);
      notify.success("AI 分析完成！已自動帶入物件資訊", undefined, {
        id: toastId,
      });
    } catch {
      notify.error("分析失敗", undefined, { id: toastId });
    }
  };

  const renderStep1 = () => (
    <div className={styles.reportStep}>
      <div className={styles.reportStepHeader}>
        <span className={styles.reportStepBadge}>1/4</span>
        <h3>選擇物件</h3>
      </div>

      <div className={styles.reportImportSection}>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          accept="image/*"
          onChange={handleFileChange}
        />
        <button className={styles.reportImportBtn} onClick={handleImportClick}>
          <Upload size={20} />
          <span>匯入房仲頁面截圖</span>
          <small>AI 自動識別物件資訊</small>
        </button>
      </div>

      <div className={styles.reportDivider}>
        <span>或從我的房源選擇</span>
      </div>

      <div className={styles.reportListings}>
        {MY_LISTINGS.map((property) => (
          <button
            key={property.id}
            className={styles.reportListingItem}
            onClick={() => handleSelectProperty(property)}
          >
            <div className={styles.reportListingThumb}>
              <Home size={24} />
            </div>
            <div className={styles.reportListingInfo}>
              <div className={styles.reportListingTitle}>{property.title}</div>
              <div className={styles.reportListingMeta}>
                <span>
                  <MapPin size={12} /> {property.district}
                </span>
                <span>
                  <DollarSign size={12} /> {formatPrice(property.price)}
                </span>
              </div>
            </div>
            <ChevronRight size={20} className={styles.reportListingArrow} />
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className={styles.reportStep}>
      <div className={styles.reportStepHeader}>
        <button className={styles.reportBackBtn} onClick={() => setStep(1)}>
          <ChevronLeft size={20} />
        </button>
        <span className={styles.reportStepBadge}>2/4</span>
        <h3>選擇報告樣式</h3>
      </div>

      <div className={styles.reportSelectedProperty}>
        <Home size={18} />
        <span>{selectedProperty?.title}</span>
      </div>

      <div className={styles.reportStyles}>
        {REPORT_STYLES.map((style) => (
          <button
            key={style.id}
            className={`${styles.reportStyleItem} ${selectedStyle === style.id ? styles.selected : ""}`}
            onClick={() => handleSelectStyle(style.id)}
          >
            <span className={styles.reportStyleIcon}>{style.icon}</span>
            <div className={styles.reportStyleInfo}>
              <div className={styles.reportStyleTitle}>{style.title}</div>
              <div className={styles.reportStyleDesc}>{style.desc}</div>
            </div>
            {selectedStyle === style.id && (
              <CheckCircle size={20} className={styles.reportStyleCheck} />
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className={styles.reportStep}>
      <div className={styles.reportStepHeader}>
        <button className={styles.reportBackBtn} onClick={() => setStep(2)}>
          <ChevronLeft size={20} />
        </button>
        <span className={styles.reportStepBadge}>3/4</span>
        <h3>選擇 3 個亮點</h3>
      </div>

      <p className={styles.reportStepHint}>
        系統已為您分析此物件，請選擇最適合客戶的賣點
      </p>

      <div className={styles.reportHighlights}>
        {highlights.map((highlight) => (
          <button
            key={highlight.id}
            className={`${styles.reportHighlightItem} ${highlight.selected ? styles.selected : ""}`}
            onClick={() => toggleHighlight(highlight.id)}
          >
            <span className={styles.reportHighlightIcon}>{highlight.icon}</span>
            <div className={styles.reportHighlightInfo}>
              <div className={styles.reportHighlightTitle}>
                {highlight.title}
              </div>
              <div className={styles.reportHighlightDesc}>
                {highlight.description}
              </div>
            </div>
            <div className={styles.reportHighlightCheck}>
              {highlight.selected ? (
                <CheckCircle size={20} />
              ) : (
                <div className={styles.reportHighlightUnchecked} />
              )}
            </div>
          </button>
        ))}
      </div>

      <div className={styles.reportStepFooter}>
        <span>已選 {highlights.filter((h) => h.selected).length}/3</span>
        <button className={styles.reportNextBtn} onClick={confirmHighlights}>
          下一步 <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => {
    if (!selectedProperty) return null;

    return (
      <div className={styles.reportStep}>
        <div className={styles.reportStepHeader}>
          <button className={styles.reportBackBtn} onClick={() => setStep(3)}>
            <ChevronLeft size={20} />
          </button>
          <span className={styles.reportStepBadge}>4/4</span>
          <h3>預覽報告</h3>
        </div>

        <div className={styles.reportPhoneFrame}>
          <div className={styles.reportPhoneNotch} />
          <div className={styles.reportPhoneContent}>
            {/* Hero 圖片 */}
            <div className={styles.reportPreviewHero}>
              <div className={styles.reportPreviewHeroTag}>精選推薦</div>
              {selectedProperty.images?.[0] ? (
                <img
                  src={selectedProperty.images[0]}
                  alt={selectedProperty.title}
                  className={styles.reportPreviewHeroImg}
                />
              ) : (
                <div className={styles.reportPreviewHeroPlaceholder}>
                  <Home size={36} />
                </div>
              )}
              <div className={styles.reportPreviewHeroOverlay}>
                <div className={styles.reportPreviewCommunity}>
                  {selectedProperty.community}社區
                </div>
                <div className={styles.reportPreviewTitle}>
                  {selectedProperty.title}
                </div>
              </div>
            </div>

            {/* 價格區塊 */}
            <div className={styles.reportPreviewPriceSection}>
              <div className={styles.reportPreviewPriceMain}>
                <div className={styles.reportPreviewPriceLabel}>開價總價</div>
                <div className={styles.reportPreviewPriceTotal}>
                  {formatPrice(selectedProperty.price)}
                  <small>萬</small>
                </div>
              </div>
              <div className={styles.reportPreviewPriceUnit}>
                <div className={styles.reportPreviewPriceUnitLabel}>單價</div>
                <div className={styles.reportPreviewPriceUnitValue}>
                  {(selectedProperty.pricePerPing / 10000).toFixed(1)}
                  <small>萬/坪</small>
                </div>
              </div>
            </div>

            {/* 核心規格 */}
            <div className={styles.reportPreviewSpecsGrid}>
              <div className={styles.reportPreviewSpecItem}>
                <div className={styles.reportPreviewSpecValue}>
                  {selectedProperty.size}
                  <small>坪</small>
                </div>
                <div className={styles.reportPreviewSpecLabel}>權狀坪數</div>
              </div>
              <div className={styles.reportPreviewSpecItem}>
                <div className={styles.reportPreviewSpecValue}>
                  {selectedProperty.floor}
                  <small>/{selectedProperty.floorTotal}F</small>
                </div>
                <div className={styles.reportPreviewSpecLabel}>樓層</div>
              </div>
              <div className={styles.reportPreviewSpecItem}>
                <div className={styles.reportPreviewSpecValue}>
                  {selectedProperty.age}
                  <small>年</small>
                </div>
                <div className={styles.reportPreviewSpecLabel}>屋齡</div>
              </div>
              <div className={styles.reportPreviewSpecItem}>
                <div className={styles.reportPreviewSpecValue}>
                  {selectedProperty.direction}
                </div>
                <div className={styles.reportPreviewSpecLabel}>座向</div>
              </div>
            </div>

            {/* 物件資訊 */}
            <div className={styles.reportPreviewDetails}>
              <div className={styles.reportPreviewSectionTitle}>物件資訊</div>
              <div className={styles.reportPreviewDetailsGrid}>
                <div className={styles.reportPreviewDetailItem}>
                  <span className={styles.reportPreviewDetailLabel}>格局</span>
                  <span className={styles.reportPreviewDetailValue}>
                    {selectedProperty.rooms}
                  </span>
                </div>
                <div className={styles.reportPreviewDetailItem}>
                  <span className={styles.reportPreviewDetailLabel}>車位</span>
                  <span className={styles.reportPreviewDetailValue}>
                    {selectedProperty.parking}
                  </span>
                </div>
                <div className={styles.reportPreviewDetailItem}>
                  <span className={styles.reportPreviewDetailLabel}>
                    管理費
                  </span>
                  <span className={styles.reportPreviewDetailValue}>
                    {selectedProperty.managementFee.toLocaleString()}/月
                  </span>
                </div>
                <div className={styles.reportPreviewDetailItem}>
                  <span className={styles.reportPreviewDetailLabel}>型態</span>
                  <span className={styles.reportPreviewDetailValue}>
                    {selectedProperty.propertyType}
                  </span>
                </div>
              </div>
            </div>

            {/* 社區資訊 */}
            <div className={styles.reportPreviewCommunitySection}>
              <div className={styles.reportPreviewSectionTitle}>社區資訊</div>
              <div className={styles.reportPreviewCommunityInfo}>
                <div className={styles.reportPreviewCommunityStat}>
                  <div className={styles.reportPreviewCommunityStatValue}>
                    {selectedProperty.communityYear}
                  </div>
                  <div className={styles.reportPreviewCommunityStatLabel}>
                    建成年份
                  </div>
                </div>
                <div className={styles.reportPreviewCommunityStat}>
                  <div className={styles.reportPreviewCommunityStatValue}>
                    {selectedProperty.communityUnits}
                  </div>
                  <div className={styles.reportPreviewCommunityStatLabel}>
                    總戶數
                  </div>
                </div>
                <div className={styles.reportPreviewCommunityStat}>
                  <div className={styles.reportPreviewCommunityStatValue}>
                    {selectedProperty.floorTotal}
                  </div>
                  <div className={styles.reportPreviewCommunityStatLabel}>
                    總樓層
                  </div>
                </div>
              </div>
            </div>

            {/* 物件說明 */}
            <div className={styles.reportPreviewDescription}>
              <div className={styles.reportPreviewSectionTitle}>物件說明</div>
              <div className={styles.reportPreviewDescriptionText}>
                {selectedProperty.description}
              </div>
            </div>

            {/* 地址位置 */}
            <div className={styles.reportPreviewLocation}>
              <div className={styles.reportPreviewLocationIcon}>
                <MapPin size={16} />
              </div>
              <div className={styles.reportPreviewLocationText}>
                {selectedProperty.address}
                <small>{selectedProperty.district}</small>
              </div>
            </div>

            {/* 業務資訊 */}
            <div className={styles.reportPreviewAgent}>
              <div className={styles.reportPreviewAgentAvatar} />
              <div className={styles.reportPreviewAgentInfo}>
                <strong>{agentName}</strong>
                <span>MaiHouses 邁房子</span>
              </div>
              <div className={styles.reportPreviewAgentCta}>
                <button
                  className={`${styles.reportPreviewAgentBtn} ${styles.secondary}`}
                >
                  <MessageCircle size={16} />
                </button>
                {agentPhone && (
                  <button
                    className={`${styles.reportPreviewAgentBtn} ${styles.primary}`}
                  >
                    <Phone size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* 品牌浮水印 */}
            <div className={styles.reportPreviewWatermark}>
              由 <strong>MaiHouses 邁房子</strong> 提供
            </div>
          </div>
        </div>

        <button
          className={styles.reportGenerateBtn}
          onClick={generateReport}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>⏳ 生成中...</>
          ) : (
            <>
              <Sparkles size={18} /> 生成報告
            </>
          )}
        </button>
      </div>
    );
  };

  const renderStep5 = () => (
    <div className={styles.reportStep}>
      <div className={styles.reportStepHeader}>
        <span className={styles.reportStepBadge}>✓</span>
        <h3>報告已生成！</h3>
      </div>

      <div className={styles.reportSuccess}>
        <div className={styles.reportSuccessIcon}>🎉</div>
        <p>精美報告已準備好，快分享給客戶吧！</p>
      </div>

      <div className={styles.reportUrlBox}>
        <input
          type="text"
          value={reportUrl}
          readOnly
          className={styles.reportUrlInput}
        />
        <button className={styles.reportUrlCopy} onClick={copyLink}>
          <Copy size={18} />
        </button>
      </div>

      <div className={styles.reportShareButtons}>
        <button className={styles.reportShareBtnPrimary} onClick={copyLink}>
          <Copy size={18} />
          複製連結
        </button>
        <button className={styles.reportShareBtnLine} onClick={shareToLine}>
          <MessageCircle size={18} />
          LINE 分享
        </button>
      </div>

      <button
        className={styles.reportPreviewLink}
        onClick={() => window.open(reportUrl, "_blank")}
      >
        <ExternalLink size={16} />
        在新視窗預覽報告
      </button>

      <button className={styles.reportResetBtn} onClick={reset}>
        生成另一份報告
      </button>
    </div>
  );

  return (
    <section className={`${uagStyles["uag-card"]} ${uagStyles["k-span-3"]}`}>
      <div className={uagStyles["uag-card-header"]}>
        <div>
          <div className={uagStyles["uag-card-title"]}>📱 手機報告生成器</div>
          <div className={uagStyles["uag-card-sub"]}>
            取代 Word 說明書・一鍵分享給客戶
          </div>
        </div>
        {step > 1 && step < 5 && (
          <button
            className={`${uagStyles["uag-btn"]} ${uagStyles["secondary"]}`}
            onClick={reset}
          >
            <X size={14} /> 取消
          </button>
        )}
      </div>

      <div className={styles.reportContainer}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </div>
    </section>
  );
}
