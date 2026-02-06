import React, { useState, useRef } from 'react';
import { notify } from '../../../../lib/notify';
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
} from 'lucide-react';
import uagStyles from '../../UAG.module.css';
import styles from './ReportGenerator.module.css';
import type { Listing } from '../../types/uag.types';
import ReportPreview from '../../../../components/ReportPreview';

// 報告樣式類型
type ReportStyle = 'simple' | 'investment' | 'marketing';

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
  id: 'demo-001',
  title: '12F 高樓層｜3房2廳2衛｜平面車位',
  address: '台中市南屯區惠文路 168 號',
  district: '南屯區',
  price: 32880000,
  pricePerPing: 521000,
  size: 67.3,
  rooms: '3房2廳2衛',
  floor: '12',
  floorTotal: 15,
  age: 5,
  direction: '南',
  parking: '平面車位',
  managementFee: 3500,
  community: '惠宇上晴',
  communityYear: 2019,
  communityUnits: 280,
  propertyType: '電梯大樓',
  description:
    '高樓層景觀戶，採光通風極佳。格局方正實用，三面採光無暗房。社區管理完善，24小時警衛駐守。步行5分鐘至捷運市政府站，生活機能完善。屋況維護良好，可隨時交屋。',
  images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80'],
  highlights: [
    {
      id: 'commute',
      icon: '🚇',
      title: '通勤便利',
      description: '距捷運站步行 5 分鐘',
      selected: true,
    },
    {
      id: 'school',
      icon: '🎓',
      title: '優質學區',
      description: '惠文國小學區內',
      selected: true,
    },
    {
      id: 'community',
      icon: '🏠',
      title: '社區單純',
      description: '住戶多為家庭，管理良好',
      selected: true,
    },
    {
      id: 'view',
      icon: '🌅',
      title: '景觀優美',
      description: '高樓層無遮蔽，視野開闊',
      selected: false,
    },
    {
      id: 'amenity',
      icon: '🛒',
      title: '生活機能',
      description: '全聯、7-11 步行 3 分鐘',
      selected: false,
    },
    {
      id: 'parking',
      icon: '🅿️',
      title: '車位方便',
      description: '含平面車位一個',
      selected: false,
    },
    {
      id: 'renovated',
      icon: '✨',
      title: '精裝入住',
      description: '屋主精心裝潢，可直接入住',
      selected: false,
    },
  ],
};

// 我的房源列表（模擬）
const MY_LISTINGS: PropertyData[] = [
  DEFAULT_PROPERTY,
  {
    id: 'demo-002',
    title: '18F 高樓層｜4房2廳3衛｜機械車位',
    address: '台北市中山區北安路 256 號',
    district: '中山區',
    price: 88000000,
    pricePerPing: 1120000,
    size: 78.5,
    rooms: '4房2廳3衛',
    floor: '18',
    floorTotal: 22,
    age: 3,
    direction: '東',
    parking: '機械車位',
    managementFee: 6800,
    community: '冠德美麗大直',
    communityYear: 2021,
    communityUnits: 156,
    propertyType: '電梯大樓',
    description:
      '大直水岸第一排，高樓層遠眺 101 與基隆河景觀。飯店式管理，公設完善包含游泳池、健身房。屋況全新，全室大理石地板，可直接入住。',
    images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80'],
    highlights: [
      {
        id: 'commute',
        icon: '🚇',
        title: '通勤便利',
        description: '距捷運劍南路站步行 3 分鐘',
        selected: true,
      },
      {
        id: 'view',
        icon: '🌅',
        title: '景觀優美',
        description: '高樓層遠眺 101',
        selected: true,
      },
      {
        id: 'community',
        icon: '🏠',
        title: '頂級社區',
        description: '飯店式管理，公設完善',
        selected: true,
      },
      {
        id: 'school',
        icon: '🎓',
        title: '明星學區',
        description: '大直國小學區內',
        selected: false,
      },
      {
        id: 'amenity',
        icon: '🛒',
        title: '生活機能',
        description: '美麗華商圈步行 5 分鐘',
        selected: false,
      },
      {
        id: 'parking',
        icon: '🅿️',
        title: '雙車位',
        description: '含機械車位兩個',
        selected: false,
      },
      {
        id: 'renovated',
        icon: '✨',
        title: '豪宅規格',
        description: '全室大理石地板',
        selected: false,
      },
    ],
  },
  {
    id: 'demo-003',
    title: '5F 中樓層｜2房1廳1衛｜無車位',
    address: '台北市士林區天母西路 88 號',
    district: '士林區',
    price: 24500000,
    pricePerPing: 680000,
    size: 36.0,
    rooms: '2房1廳1衛',
    floor: '5',
    floorTotal: 12,
    age: 15,
    direction: '西',
    parking: '無',
    managementFee: 2200,
    community: '國泰天母',
    communityYear: 2009,
    communityUnits: 88,
    propertyType: '電梯大樓',
    description:
      '天母商圈核心地段，SOGO、新光三越步行可達。天母國小明星學區，環境清幽適合家庭。北歐風格溫馨裝潢，採光佳，即可入住。',
    images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80'],
    highlights: [
      {
        id: 'amenity',
        icon: '🛒',
        title: '天母商圈',
        description: 'SOGO、新光三越步行可達',
        selected: true,
      },
      {
        id: 'school',
        icon: '🎓',
        title: '天母學區',
        description: '天母國小、天母國中學區',
        selected: true,
      },
      {
        id: 'community',
        icon: '🏠',
        title: '純住宅區',
        description: '環境清幽，適合家庭',
        selected: true,
      },
      {
        id: 'commute',
        icon: '🚇',
        title: '公車便利',
        description: '多線公車直達市區',
        selected: false,
      },
      {
        id: 'view',
        icon: '🌅',
        title: '山景視野',
        description: '可遠眺陽明山',
        selected: false,
      },
      {
        id: 'renovated',
        icon: '✨',
        title: '溫馨裝潢',
        description: '北歐風格，採光佳',
        selected: false,
      },
      {
        id: 'parking',
        icon: '🅿️',
        title: '路邊好停',
        description: '社區周邊停車方便',
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
  { id: 'simple', icon: '📋', title: '簡潔說明書', desc: '清晰的基本資訊' },
  {
    id: 'investment',
    icon: '📊',
    title: '投資分析版',
    desc: '數據導向，適合投資客',
  },
  {
    id: 'marketing',
    icon: '✨',
    title: '行銷文案版',
    desc: '故事感強，適合首購族',
  },
];

export default function ReportGenerator({
  listings = [],
  agentName = '專屬顧問',
  agentPhone,
}: ReportGeneratorProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedProperty, setSelectedProperty] = useState<PropertyData | null>(null);
  const [reportUrl, setReportUrl] = useState<string>('');
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
    rate = 0.021
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
    setStep(2); // 直接跳到預覽
  };

  const generateReport = async () => {
    if (!selectedProperty) return;

    setIsGenerating(true);
    const toastId = notify.loading('正在生成精美報告...');

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 準備報告資料（不包含亮點）
      const reportData = {
        property: selectedProperty,
        agent: {
          name: agentName,
          phone: agentPhone,
          company: 'MaiHouses 邁房子',
        },
      };

      // 編碼資料到 URL（使用 encodeURIComponent 確保中文正確編碼）
      const encodedData = encodeURIComponent(
        btoa(unescape(encodeURIComponent(JSON.stringify(reportData))))
      );
      const reportId = `R-${Date.now().toString(36).toUpperCase()}`;

      // 根據當前路徑判斷 basename
      const basename = window.location.pathname.startsWith('/maihouses') ? '/maihouses' : '';
      const url = `${window.location.origin}${basename}/r/${reportId}?d=${encodedData}`;

      setReportUrl(url);
      setStep(3); // 改為 step 3 (完成)
      notify.success('報告生成成功！', undefined, { id: toastId });
    } catch {
      notify.error('生成失敗，請重試', undefined, { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(reportUrl);
      notify.success('連結已複製！可直接貼到 LINE');
    } catch {
      notify.error('複製失敗');
    }
  };

  const shareToLine = () => {
    const message = encodeURIComponent(
      `【${selectedProperty?.title}】\n\n這是我幫您整理的物件報告，有空可以看看 🙂\n\n${reportUrl}`
    );
    window.open(`https://line.me/R/msg/text/?${message}`, '_blank');
  };

  const reset = () => {
    setStep(1);
    setSelectedProperty(null);
    setReportUrl('');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = notify.loading('AI 正在分析房仲頁面...');

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const detectedProperty: PropertyData = {
        id: 'detected-001',
        title: '18F 高樓層｜4房3廳4衛｜坡道平面',
        address: '台北市大安區仁愛路三段',
        district: '大安區',
        price: 188000000,
        pricePerPing: 1560000,
        size: 120.5,
        rooms: '4房3廳4衛',
        floor: '18',
        floorTotal: 24,
        age: 10,
        direction: '南',
        parking: '坡道平面',
        managementFee: 15000,
        community: '帝寶',
        communityYear: 2014,
        communityUnits: 52,
        propertyType: '豪宅大樓',
        description:
          '帝寶頂級豪宅，俯瞰仁愛路林蔭大道。全棟僅 52 戶，飯店式管理，隱私安全兼具。名人聚集，資產保值性高。',
        images: ['https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80'],
        highlights: [
          {
            id: 'view',
            icon: '🌅',
            title: '頂級景觀',
            description: '俯瞰仁愛路林蔭大道',
            selected: true,
          },
          {
            id: 'community',
            icon: '🏠',
            title: '頂級豪宅',
            description: '政商名流指定社區',
            selected: true,
          },
          {
            id: 'renovated',
            icon: '✨',
            title: '奢華裝潢',
            description: '義大利進口建材',
            selected: true,
          },
          {
            id: 'parking',
            icon: '🅿️',
            title: '雙車位',
            description: '坡道平面車位兩個',
            selected: false,
          },
          {
            id: 'amenity',
            icon: '🛒',
            title: '精品商圈',
            description: '信義計畫區步行可達',
            selected: false,
          },
          {
            id: 'commute',
            icon: '🚇',
            title: '捷運便利',
            description: '距大安站步行 8 分鐘',
            selected: false,
          },
          {
            id: 'school',
            icon: '🎓',
            title: '明星學區',
            description: '仁愛國小學區',
            selected: false,
          },
        ],
      };

      setSelectedProperty(detectedProperty);
      setStep(2); // 直接跳到預覽
      notify.success('AI 分析完成！已自動帶入物件資訊', undefined, {
        id: toastId,
      });
    } catch {
      notify.error('分析失敗', undefined, { id: toastId });
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
          style={{ display: 'none' }}
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

  const renderStep4 = () => {
    if (!selectedProperty) return null;

    return (
      <div className={styles.reportStep}>
        <div className={styles.reportStepHeader}>
          <button className={styles.reportBackBtn} onClick={() => setStep(1)}>
            <ChevronLeft size={20} />
          </button>
          <span className={styles.reportStepBadge}>2/2</span>
          <h3>預覽報告</h3>
        </div>

        <div className={styles.reportPhoneFrame}>
          <div className={styles.reportPhoneNotch} />
          <div className={styles.reportPhoneContent}>
            <ReportPreview
              property={selectedProperty}
              agent={{
                name: agentName,
                ...(agentPhone ? { phone: agentPhone } : {}),
                company: 'MaiHouses 邁房子',
              }}
            />
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
        <input type="text" value={reportUrl} readOnly className={styles.reportUrlInput} />
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

      <button className={styles.reportPreviewLink} onClick={() => window.open(reportUrl, '_blank')}>
        <ExternalLink size={16} />
        在新視窗預覽報告
      </button>

      <button className={styles.reportResetBtn} onClick={reset}>
        生成另一份報告
      </button>
    </div>
  );

  return (
    <section className={`${uagStyles['uag-card']} ${uagStyles['k-span-3']}`}>
      <div className={uagStyles['uag-card-header']}>
        <div>
          <div className={uagStyles['uag-card-title']}>📱 手機報告生成器</div>
          <div className={uagStyles['uag-card-sub']}>取代 Word 說明書・一鍵分享給客戶</div>
        </div>
        {step > 1 && step < 5 && (
          <button className={`${uagStyles['uag-btn']} ${uagStyles['secondary']}`} onClick={reset}>
            <X size={14} /> 取消
          </button>
        )}
      </div>

      <div className={styles.reportContainer}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep4()} {/* 直接用預覽,改編號為step2 */}
        {step === 3 && renderStep5()} {/* 完成頁面,改編號為step3 */}
      </div>
    </section>
  );
}
