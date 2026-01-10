import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Phone,
  MessageCircle,
  MapPin,
  Home,
  Share2,
} from "lucide-react";
import { notify } from "../../lib/notify";
import { logger } from "../../lib/logger";
import styles from "./ReportPage.module.css";

// 報告資料類型
interface ReportPropertyData {
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
  highlights: {
    id: string;
    icon: string;
    title: string;
    description: string;
  }[];
}

interface ReportAgentData {
  name: string;
  phone?: string;
  company: string;
}

// 預設物件資料（當無法解析 URL 參數時使用）
const DEFAULT_PROPERTY: ReportPropertyData = {
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
    },
    {
      id: "school",
      icon: "🎓",
      title: "優質學區",
      description: "惠文國小學區內",
    },
    {
      id: "community",
      icon: "🏠",
      title: "社區單純",
      description: "住戶多為家庭，管理良好",
    },
  ],
};

const DEFAULT_AGENT: ReportAgentData = {
  name: "專屬顧問",
  company: "MaiHouses 邁房子",
};

// 價格格式化
function formatPrice(price: number): string {
  if (price >= 100000000) {
    return `${(price / 100000000).toFixed(2)} 億`;
  }
  return `${(price / 10000).toFixed(0)} 萬`;
}

// 計算月付
function calculateMonthlyPayment(
  price: number,
  downPaymentRatio = 0.2,
  years = 30,
  rate = 0.021
): number {
  const principal = price * (1 - downPaymentRatio);
  const monthlyRate = rate / 12;
  const months = years * 12;
  const payment =
    (principal * (monthlyRate * Math.pow(1 + monthlyRate, months))) /
    (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(payment);
}

// 解碼 URL 參數中的報告資料
function decodeReportData(searchParams: URLSearchParams): {
  property: ReportPropertyData;
  agent: ReportAgentData;
} {
  try {
    const dataParam = searchParams.get("d");
    if (dataParam) {
      // 解碼：先 decodeURIComponent，再 atob，再處理 UTF-8
      const decoded = JSON.parse(
        decodeURIComponent(escape(atob(decodeURIComponent(dataParam))))
      ) as {
        property: ReportPropertyData;
        agent: ReportAgentData;
      };
      return decoded;
    }
  } catch (e) {
    logger.debug("[ReportPage] Failed to decode report data", { error: e });
  }
  return { property: DEFAULT_PROPERTY, agent: DEFAULT_AGENT };
}

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [property, setProperty] = useState<ReportPropertyData>(DEFAULT_PROPERTY);
  const [agent, setAgent] = useState<ReportAgentData>(DEFAULT_AGENT);

  useEffect(() => {
    // 載入報告資料
    const loadReport = async () => {
      setIsLoading(true);
      try {
        // 嘗試從 URL 解碼資料
        const { property: decodedProperty, agent: decodedAgent } =
          decodeReportData(searchParams);
        setProperty(decodedProperty);
        setAgent(decodedAgent);

        // 記錄報告瀏覽
        try {
          await fetch("/api/report/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              reportId: id,
              userAgent: navigator.userAgent,
            }),
          });
        } catch {
          // 忽略追蹤錯誤
        }
      } catch (e) {
        logger.error("[ReportPage] Load report failed", { error: e });
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, [id, searchParams]);

  // 分享功能
  const handleShare = async () => {
    const url = window.location.href;
    const text = `${property.title} - ${formatPrice(property.price)}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: text, url });
      } catch {
        // 用戶取消分享
      }
    } else {
      await navigator.clipboard.writeText(url);
      notify.success("連結已複製！");
    }
  };

  // LINE 分享
  const handleLineShare = () => {
    const message = encodeURIComponent(
      `【${property.title}】\n\n${formatPrice(property.price)}\n\n${window.location.href}`
    );
    window.open(`https://line.me/R/msg/text/?${message}`, "_blank");
  };

  // 撥打電話
  const handleCall = () => {
    if (agent.phone) {
      window.location.href = `tel:${agent.phone}`;
    }
  };

  // 月付金額
  const monthlyPayment = calculateMonthlyPayment(property.price);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <p>載入報告中...</p>
      </div>
    );
  }

  return (
    <div className={styles.reportPage}>
      {/* Hero 圖片區 */}
      <div className={styles.hero}>
        <div className={styles.heroTag}>精選推薦</div>
        {property.images[0] ? (
          <img
            src={property.images[0]}
            alt={property.title}
            className={styles.heroImg}
          />
        ) : (
          <div className={styles.heroPlaceholder}>
            <Home size={48} />
          </div>
        )}
        <div className={styles.heroOverlay}>
          <div className={styles.heroCommunity}>{property.community}社區</div>
          <div className={styles.heroTitle}>{property.title}</div>
        </div>
      </div>

      {/* 價格區塊 */}
      <div className={styles.priceSection}>
        <div className={styles.priceMain}>
          <div className={styles.priceLabel}>開價總價</div>
          <div className={styles.priceTotal}>
            {formatPrice(property.price).replace(/萬|億/, "")}
            <small>{property.price >= 100000000 ? "億" : "萬"}</small>
          </div>
        </div>
        <div className={styles.priceUnit}>
          <div className={styles.priceUnitLabel}>單價</div>
          <div className={styles.priceUnitValue}>
            {(property.pricePerPing / 10000).toFixed(1)}
            <small>萬/坪</small>
          </div>
        </div>
      </div>

      {/* 核心規格 */}
      <div className={styles.specsGrid}>
        <div className={styles.specItem}>
          <div className={styles.specValue}>
            {property.size}
            <small>坪</small>
          </div>
          <div className={styles.specLabel}>權狀坪數</div>
        </div>
        <div className={styles.specItem}>
          <div className={styles.specValue}>
            {property.floor}
            <small>/{property.floorTotal}F</small>
          </div>
          <div className={styles.specLabel}>樓層</div>
        </div>
        <div className={styles.specItem}>
          <div className={styles.specValue}>
            {property.age}
            <small>年</small>
          </div>
          <div className={styles.specLabel}>屋齡</div>
        </div>
        <div className={styles.specItem}>
          <div className={styles.specValue}>{property.direction}</div>
          <div className={styles.specLabel}>座向</div>
        </div>
      </div>

      {/* 月付試算 */}
      <div className={styles.monthlySection}>
        <div className={styles.sectionTitle}>月付試算</div>
        <div className={styles.monthlyCard}>
          <div className={styles.monthlyInfo}>
            <span>貸款 8 成・30 年期・利率 2.1%</span>
          </div>
          <div className={styles.monthlyAmount}>
            月付約 NT$ {monthlyPayment.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 物件資訊 */}
      <div className={styles.detailsSection}>
        <div className={styles.sectionTitle}>物件資訊</div>
        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>格局</span>
            <span className={styles.detailValue}>{property.rooms}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>車位</span>
            <span className={styles.detailValue}>{property.parking}</span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>管理費</span>
            <span className={styles.detailValue}>
              {property.managementFee.toLocaleString()}/月
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>型態</span>
            <span className={styles.detailValue}>{property.propertyType}</span>
          </div>
        </div>
      </div>

      {/* 精選亮點 */}
      {property.highlights.length > 0 && (
        <div className={styles.highlightsSection}>
          <div className={styles.sectionTitle}>為您精選的亮點</div>
          <div className={styles.highlightsList}>
            {property.highlights.map((h) => (
              <div key={h.id} className={styles.highlightItem}>
                <span className={styles.highlightIcon}>{h.icon}</span>
                <div className={styles.highlightContent}>
                  <div className={styles.highlightTitle}>{h.title}</div>
                  <div className={styles.highlightDesc}>{h.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 社區資訊 */}
      <div className={styles.communitySection}>
        <div className={styles.sectionTitle}>社區資訊</div>
        <div className={styles.communityStats}>
          <div className={styles.communityStat}>
            <div className={styles.communityStatValue}>
              {property.communityYear}
            </div>
            <div className={styles.communityStatLabel}>建成年份</div>
          </div>
          <div className={styles.communityStat}>
            <div className={styles.communityStatValue}>
              {property.communityUnits}
            </div>
            <div className={styles.communityStatLabel}>總戶數</div>
          </div>
          <div className={styles.communityStat}>
            <div className={styles.communityStatValue}>
              {property.floorTotal}
            </div>
            <div className={styles.communityStatLabel}>總樓層</div>
          </div>
        </div>
      </div>

      {/* 物件說明 */}
      <div className={styles.descriptionSection}>
        <div className={styles.sectionTitle}>物件說明</div>
        <div className={styles.descriptionText}>{property.description}</div>
      </div>

      {/* 地址位置 */}
      <div className={styles.locationSection}>
        <div className={styles.locationIcon}>
          <MapPin size={18} />
        </div>
        <div className={styles.locationText}>
          {property.address}
          <small>{property.district}</small>
        </div>
      </div>

      {/* 業務資訊 */}
      <div className={styles.agentSection}>
        <div className={styles.agentAvatar} />
        <div className={styles.agentInfo}>
          <strong>{agent.name}</strong>
          <span>{agent.company}</span>
        </div>
        <div className={styles.agentCta}>
          <button
            className={`${styles.agentBtn} ${styles.secondary}`}
            onClick={handleLineShare}
          >
            <MessageCircle size={18} />
          </button>
          {agent.phone && (
            <button
              className={`${styles.agentBtn} ${styles.primary}`}
              onClick={handleCall}
            >
              <Phone size={18} />
            </button>
          )}
        </div>
      </div>

      {/* CTA 按鈕區 */}
      <div className={styles.ctaSection}>
        {agent.phone && (
          <button className={styles.ctaPrimary} onClick={handleCall}>
            <Phone size={20} />
            立即撥打諮詢
          </button>
        )}
        <button className={styles.ctaLine} onClick={handleLineShare}>
          <MessageCircle size={20} />
          LINE 分享給朋友
        </button>
        <button className={styles.ctaShare} onClick={handleShare}>
          <Share2 size={18} />
          分享此報告
        </button>
      </div>

      {/* 品牌浮水印 */}
      <div className={styles.watermark}>
        由 <strong>MaiHouses 邁房子</strong> 提供
        <div className={styles.watermarkDate}>
          報告生成：{new Date().toLocaleDateString("zh-TW")}
        </div>
      </div>
    </div>
  );
}
