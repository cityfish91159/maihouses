/**
 * Trust Room 隱私保護工具函數
 *
 * 根據檢視者角色決定顯示哪些資訊：
 * - 買方視角：可看到房仲姓名 + 公司
 * - 房仲視角：只看到買方代號（隱藏真實姓名）
 *
 * Skills Applied:
 * - [NASA TypeScript Safety] 完整類型定義，無 any
 * - [Agentic Architecture] 統一隱私邏輯，單一職責
 */

import type { LegacyTrustCase } from '../types/trust-flow.types';

type TrustCase = LegacyTrustCase;

/** 檢視者角色 */
export type ViewerRole = 'agent' | 'buyer' | 'system';

/** 房仲顯示資訊 */
export interface AgentDisplayInfo {
  /** 顯示名稱 */
  name: string;
  /** 公司名稱（可選） */
  company?: string | undefined;
  /** 完整顯示文字 */
  fullText: string;
}

/** 買方顯示資訊 */
export interface BuyerDisplayInfo {
  /** 顯示名稱（可能是代號） */
  name: string;
  /** 是否為匿名顯示 */
  isAnonymous: boolean;
  /** 完整顯示文字 */
  fullText: string;
}

/**
 * 取得買方顯示名稱
 *
 * @param trustCase - Trust Case 資料
 * @param viewerRole - 檢視者角色
 * @returns 買方顯示資訊
 *
 * 邏輯：
 * - buyer 視角：顯示 "您" 或真實姓名
 * - agent 視角：顯示買方代號 (買方-****, 前 4 碼 ID)
 * - system 視角：顯示完整資訊
 */
export function getBuyerDisplayName(
  trustCase: Pick<TrustCase, 'id' | 'buyerName' | 'buyerId'>,
  viewerRole: ViewerRole
): BuyerDisplayInfo {
  // [NASA TypeScript Safety] 確保資料完整性
  if (!trustCase.buyerName) {
    return {
      name: '買方資訊未提供',
      isAnonymous: true,
      fullText: '買方資訊未提供',
    };
  }

  switch (viewerRole) {
    case 'buyer':
      // 買方看到自己的真實姓名
      return {
        name: trustCase.buyerName,
        isAnonymous: false,
        fullText: trustCase.buyerName,
      };

    case 'agent':
      // 房仲只看到買方代號
      const tempCode = generateBuyerTempCode(trustCase);
      return {
        name: tempCode,
        isAnonymous: true,
        fullText: `買方: ${tempCode}`,
      };

    case 'system':
      // 系統視角顯示完整資訊
      return {
        name: trustCase.buyerName,
        isAnonymous: false,
        fullText: `買方: ${trustCase.buyerName} (ID: ${trustCase.buyerId})`,
      };
  }
}

/**
 * 取得房仲顯示資訊
 *
 * @param agentName - 房仲姓名（可選）
 * @param agentCompany - 房仲公司（可選）
 * @param viewerRole - 檢視者角色
 * @returns 房仲顯示資訊
 *
 * 邏輯：
 * - buyer 視角：顯示完整資訊（姓名 + 公司）
 * - agent 視角：顯示 "您" 或自己的姓名
 * - system 視角：顯示完整資訊
 */
export function getAgentDisplayInfo(
  agentName: string | null | undefined,
  agentCompany: string | null | undefined,
  viewerRole: ViewerRole
): AgentDisplayInfo {
  const name = agentName ?? '房仲';
  const company = agentCompany ?? undefined;

  switch (viewerRole) {
    case 'buyer': {
      // 買方看到完整房仲資訊
      const result: AgentDisplayInfo = {
        name,
        fullText: company ? `對接房仲: ${name} (${company})` : `對接房仲: ${name}`,
      };
      if (company) {
        result.company = company;
      }
      return result;
    }

    case 'agent': {
      // 房仲看到自己
      const result: AgentDisplayInfo = {
        name: '您',
        fullText: company ? `您 (${company})` : '您',
      };
      if (company) {
        result.company = company;
      }
      return result;
    }

    case 'system': {
      // 系統視角顯示完整資訊
      const result: AgentDisplayInfo = {
        name,
        fullText: company ? `房仲: ${name} (${company})` : `房仲: ${name}`,
      };
      if (company) {
        result.company = company;
      }
      return result;
    }
  }
}

/**
 * 生成買方臨時代號
 *
 * 格式: 買方-XXXX (buyerId 前 4 碼)
 *
 * @param trustCase - Trust Case 資料
 * @returns 買方臨時代號
 */
function generateBuyerTempCode(trustCase: Pick<TrustCase, 'id' | 'buyerId'>): string {
  // 優先使用 buyerId 前 4 碼
  const buyerId = String(trustCase.buyerId);
  if (buyerId && buyerId.length >= 4) {
    return `買方-${buyerId.slice(0, 4).toUpperCase()}`;
  }

  // Fallback: 使用案件 ID 前 4 碼
  const caseId = String(trustCase.id);
  if (caseId && caseId.length >= 4) {
    return `買方-${caseId.slice(0, 4).toUpperCase()}`;
  }

  // 最終 fallback
  return '買方-****';
}

/**
 * 檢查是否應該顯示敏感資訊
 *
 * @param viewerRole - 檢視者角色
 * @param targetRole - 目標資料所屬角色
 * @returns 是否應該顯示敏感資訊
 *
 * 規則:
 * - 檢視自己的資料：顯示
 * - system 角色：顯示所有
 * - 其他：不顯示
 */
export function shouldShowSensitiveInfo(
  viewerRole: ViewerRole,
  targetRole: 'agent' | 'buyer'
): boolean {
  if (viewerRole === 'system') return true;
  return viewerRole === targetRole;
}
