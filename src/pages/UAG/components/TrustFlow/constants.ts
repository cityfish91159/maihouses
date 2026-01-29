/**
 * TrustFlow Constants - 安心流程常數
 *
 * [code-simplifier] 抽取常數定義到獨立檔案
 */

import { Phone, Eye, DollarSign, FileText, Handshake, Key } from 'lucide-react';
import type { StepDefinition } from './types';

/** 六階段步驟定義 [NASA TypeScript Safety] */
export const STEPS: StepDefinition[] = [
  { key: 1, name: 'M1 接洽', icon: Phone },
  { key: 2, name: 'M2 帶看', icon: Eye },
  { key: 3, name: 'M3 出價', icon: DollarSign },
  { key: 4, name: 'M4 斡旋', icon: FileText },
  { key: 5, name: 'M5 成交', icon: Handshake },
  { key: 6, name: 'M6 交屋', icon: Key },
];
