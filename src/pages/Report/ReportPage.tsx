import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { logger } from "../../lib/logger";
import { decodeReportDataFromURL } from "./utils/dataAdapter";
import ReportPreview from "../../components/ReportPreview";
import styles from "../UAG/components/ReportGenerator/ReportGenerator.module.css";

// 型別定義
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
  highlights: never[];
}

interface AgentData {
  name: string;
  phone?: string;
  company: string;
}

// 預設物件資料 (與 Generator 格式一致)
const DEFAULT_PROPERTY: PropertyData = {
  id: "demo",
  title: "12F 高樓層｜3房2廳2衛｜平面車位",
  address: "台中市西屯區中港路三段120號",
  district: "西屯區",
  price: 32880000,
  pricePerPing: 488000,
  size: 67.3,
  rooms: "3房2廳2衛",
  floor: "12",
  floorTotal: 15,
  age: 8,
  direction: "朝南",
  parking: "平面車位",
  managementFee: 3500,
  community: "惠宇上晴",
  communityYear: 2016,
  communityUnits: 420,
  propertyType: "電梯大樓",
  description: "稀有釋出！絕佳地段，近捷運站，生活機能完善，採光通風佳。",
  images: [
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800",
  ],
  highlights: [],
};

const DEFAULT_AGENT: AgentData = {
  name: "王小明",
  phone: "0912-345-678",
  company: "MaiHouses 邁房子",
};

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [property, setProperty] = useState(DEFAULT_PROPERTY);
  const [agent, setAgent] = useState(DEFAULT_AGENT);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      setIsLoading(true);
      try {
        // 從 URL 解碼資料
        const decodedData = decodeReportDataFromURL(searchParams);

        if (decodedData) {
          // 移除 highlights 欄位 (不需要顯示亮點)
          const { highlights: _, ...propertyWithoutHighlights } =
            decodedData.property;
          setProperty({ ...propertyWithoutHighlights, highlights: [] });
          setAgent(decodedData.agent);
          logger.debug("[ReportPage] Loaded report from URL", {
            reportId: id,
          });
        } else {
          // 降級使用預設資料
          setProperty(DEFAULT_PROPERTY);
          setAgent(DEFAULT_AGENT);
          logger.debug("[ReportPage] Using default data");
        }

        // 追蹤報告瀏覽
        await fetch("/api/report/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportId: id,
            agentId: searchParams.get("aid"),
            source: searchParams.get("src") || "direct",
            userAgent: navigator.userAgent,
          }),
        }).catch(() => {});
      } catch (e) {
        logger.error("[ReportPage] Load report failed", { error: e });
        setProperty(DEFAULT_PROPERTY);
        setAgent(DEFAULT_AGENT);
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, [id, searchParams]);

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--bg-page)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              margin: "0 auto 16px",
              border: "4px solid var(--uag-brand-light)",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <p style={{ color: "var(--ink-300)" }}>載入報告中...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-page)",
      }}
    >
      <div
        style={{
          maxWidth: "480px",
          margin: "0 auto",
          backgroundColor: "#fff",
        }}
      >
        <ReportPreview property={property} agent={agent} />
      </div>
    </div>
  );
}
