/**
 * usePropertyFormValidation
 * 
 * 表單驗證 Hook - 用於物件上傳頁的即時驗證
 * 包含：基本欄位、兩好一公道字數、圖片驗證、敏感詞檢測
 */

import { useState, useCallback, useMemo } from 'react';
import { checkContent, ContentCheckResult } from '../utils/contentCheck';

// 驗證規則配置
export const VALIDATION_RULES = {
  advantage: { minLength: 2, maxLength: 100 },
  disadvantage: { minLength: 10, maxLength: 200 },
  communityName: { minLength: 2 },
  title: { minLength: 1, maxLength: 100 },
  price: { minLength: 1 },
  address: { minLength: 5, maxLength: 200 },
  images: { minCount: 1, maxCount: 20, maxSizeMB: 10 },
} as const;

// 允許的圖片類型
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const;

export const MAX_IMAGE_SIZE_BYTES = VALIDATION_RULES.images.maxSizeMB * 1024 * 1024;

export interface FormFields {
  title: string;
  price: string;
  address: string;
  communityName: string;
  advantage1: string;
  advantage2: string;
  disadvantage: string;
  highlights?: string[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationState {
  // 個別欄位驗證
  title: { valid: boolean; message: string };
  price: { valid: boolean; message: string };
  address: { valid: boolean; message: string };
  communityName: { valid: boolean; message: string };
  advantage1: { valid: boolean; message: string; charCount: number; contentWarning?: string };
  advantage2: { valid: boolean; message: string; charCount: number; contentWarning?: string };
  disadvantage: { valid: boolean; message: string; charCount: number; contentWarning?: string };
  highlights: { valid: boolean; message: string; warnings: string[] };
  images: { valid: boolean; message: string; count: number };
  
  // 向後兼容別名（舊版命名）
  adv1Valid: boolean;
  adv2Valid: boolean;
  disValid: boolean;
  communityValid: boolean;
  highlightsValid: boolean;
  
  // 整體狀態
  basicValid: boolean;
  twoGoodOneFairValid: boolean;
  allValid: boolean;
  canSubmit: boolean;
  
  // 內容審核
  contentCheck: {
    hasIssues: boolean;
    blockSubmit: boolean;
    warnings: string[];
  };
  
  // 錯誤列表
  errors: ValidationError[];
}

export interface ImageValidationResult {
  valid: boolean;
  file: File;
  error?: string;
}

/**
 * 驗證單張圖片
 */
export function validateImage(file: File): ImageValidationResult {
  // 檢查檔案類型
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      file,
      error: `不支援的檔案格式：${file.type || '未知'}。請使用 JPG、PNG 或 WebP`,
    };
  }

  // 檢查檔案大小
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(1);
    return {
      valid: false,
      file,
      error: `檔案過大：${sizeMB}MB（上限 ${VALIDATION_RULES.images.maxSizeMB}MB）`,
    };
  }

  return { valid: true, file };
}

/**
 * 批次驗證圖片
 */
export function validateImages(files: File[]): {
  validFiles: File[];
  invalidFiles: ImageValidationResult[];
  allValid: boolean;
} {
  const results = files.map(validateImage);
  const validFiles = results.filter(r => r.valid).map(r => r.file);
  const invalidFiles = results.filter(r => !r.valid);
  
  return {
    validFiles,
    invalidFiles,
    allValid: invalidFiles.length === 0,
  };
}

/**
 * 主要 Hook
 */
export function usePropertyFormValidation(
  form: FormFields,
  imageCount: number
): ValidationState {
  
  const validation = useMemo(() => {
    const errors: ValidationError[] = [];
    
    // 標題驗證
    const titleValid = form.title.length >= VALIDATION_RULES.title.minLength;
    const titleMessage = titleValid ? '' : '請輸入物件標題';
    if (!titleValid && form.title.length > 0) {
      errors.push({ field: 'title', message: titleMessage });
    }
    
    // 價格驗證
    const priceValid = form.price.length >= VALIDATION_RULES.price.minLength && /^\d+$/.test(form.price);
    const priceMessage = !form.price ? '請輸入價格' : (!priceValid ? '價格必須為數字' : '');
    if (!priceValid && form.price.length > 0) {
      errors.push({ field: 'price', message: priceMessage });
    }
    
    // 地址驗證
    const addressValid = form.address.length >= VALIDATION_RULES.address.minLength;
    const addressMessage = form.address.length === 0 
      ? '請輸入地址' 
      : (addressValid ? '' : `地址至少 ${VALIDATION_RULES.address.minLength} 字`);
    if (!addressValid && form.address.length > 0) {
      errors.push({ field: 'address', message: addressMessage });
    }
    
    // 社區名稱驗證（「無」為特殊值，允許）
    const communityValid = form.communityName === '無' || 
      form.communityName.length >= VALIDATION_RULES.communityName.minLength;
    const communityMessage = communityValid ? '' : '請選擇或輸入社區名稱';
    if (!communityValid && form.communityName.length > 0) {
      errors.push({ field: 'communityName', message: communityMessage });
    }
    
    // 優點1 驗證
    const adv1Length = form.advantage1.length;
    const adv1Valid = adv1Length >= VALIDATION_RULES.advantage.minLength;
    const adv1Message = adv1Valid 
      ? '' 
      : `還需 ${VALIDATION_RULES.advantage.minLength - adv1Length} 字`;
    if (!adv1Valid && adv1Length > 0) {
      errors.push({ field: 'advantage1', message: `優點1${adv1Message}` });
    }
    
    // 優點2 驗證
    const adv2Length = form.advantage2.length;
    const adv2Valid = adv2Length >= VALIDATION_RULES.advantage.minLength;
    const adv2Message = adv2Valid 
      ? '' 
      : `還需 ${VALIDATION_RULES.advantage.minLength - adv2Length} 字`;
    if (!adv2Valid && adv2Length > 0) {
      errors.push({ field: 'advantage2', message: `優點2${adv2Message}` });
    }
    
    // 公道話 驗證
    const disLength = form.disadvantage.length;
    const disValid = disLength >= VALIDATION_RULES.disadvantage.minLength;
    const disMessage = disValid 
      ? '' 
      : `還需 ${VALIDATION_RULES.disadvantage.minLength - disLength} 字`;
    if (!disValid && disLength > 0) {
      errors.push({ field: 'disadvantage', message: `公道話${disMessage}` });
    }
    
    // 敏感詞檢測 - 檢查三個文字欄位
    const contentWarnings: string[] = [];
    let blockByContent = false;
    
    const adv1ContentCheck = form.advantage1.length > 0 ? checkContent(form.advantage1) : null;
    const adv2ContentCheck = form.advantage2.length > 0 ? checkContent(form.advantage2) : null;
    const disContentCheck = form.disadvantage.length > 0 ? checkContent(form.disadvantage) : null;
    
    // 重點膠囊內容檢查
    const highlightsContentChecks = (form.highlights || []).map(tag => checkContent(tag));
    const highlightsHasSensitive = highlightsContentChecks.some(res => !res.passed && res.issues.some(i => i.type === 'sensitive'));
    const highlightsWarnings = highlightsContentChecks
      .filter(res => !res.passed)
      .flatMap(res => res.issues.map(i => i.message));

    // 計算各欄位的內容警告訊息
    const adv1ContentWarning = (!adv1ContentCheck || adv1ContentCheck.passed) 
      ? undefined 
      : adv1ContentCheck.issues.map(i => i.message).join('、');
    
    const adv2ContentWarning = (!adv2ContentCheck || adv2ContentCheck.passed) 
      ? undefined 
      : adv2ContentCheck.issues.map(i => i.message).join('、');
    
    const disContentWarning = (!disContentCheck || disContentCheck.passed) 
      ? undefined 
      : disContentCheck.issues.map(i => i.message).join('、');
    
    // 輔助函數：判斷是否為嚴重問題（敏感詞阻擋送出）
    const hasSensitiveIssue = (result: ContentCheckResult | null): boolean => {
      if (!result) return false;
      return result.issues.some(i => i.type === 'sensitive');
    };
    
    // 收集警告
    if (adv1ContentCheck && !adv1ContentCheck.passed) {
      const warning = `優點1：${adv1ContentWarning}`;
      contentWarnings.push(warning);
      if (hasSensitiveIssue(adv1ContentCheck)) {
        blockByContent = true;
        errors.push({ field: 'advantage1', message: adv1ContentWarning! });
      }
    }
    
    if (adv2ContentCheck && !adv2ContentCheck.passed) {
      const warning = `優點2：${adv2ContentWarning}`;
      contentWarnings.push(warning);
      if (hasSensitiveIssue(adv2ContentCheck)) {
        blockByContent = true;
        errors.push({ field: 'advantage2', message: adv2ContentWarning! });
      }
    }
    
    if (disContentCheck && !disContentCheck.passed) {
      const warning = `公道話：${disContentWarning}`;
      contentWarnings.push(warning);
      if (hasSensitiveIssue(disContentCheck)) {
        blockByContent = true;
        errors.push({ field: 'disadvantage', message: disContentWarning! });
      }
    }

    if (highlightsWarnings.length > 0) {
      contentWarnings.push(...highlightsWarnings.map(w => `重點膠囊：${w}`));
      if (highlightsHasSensitive) {
        blockByContent = true;
        errors.push({ field: 'highlights', message: '重點膠囊包含敏感詞' });
      }
    }
    
    // 圖片驗證
    const imagesValid = imageCount >= VALIDATION_RULES.images.minCount;
    const imagesMessage = imagesValid ? '' : '請至少上傳一張照片';
    if (!imagesValid) {
      errors.push({ field: 'images', message: imagesMessage });
    }
    
    // 重點膠囊驗證 (如果有的話)
    const highlightsValid = form.highlights ? form.highlights.length >= 3 : true;

    // 整體狀態
    const basicValid = titleValid && priceValid && addressValid && communityValid;
    const twoGoodOneFairValid = (form.highlights ? highlightsValid : (adv1Valid && adv2Valid)) && disValid;
    const allValid = basicValid && twoGoodOneFairValid && imagesValid;
    
    // 考慮敏感詞：block 等級會阻止送出
    const canSubmit = allValid && !blockByContent;
    
    return {
      title: { valid: titleValid, message: titleMessage },
      price: { valid: priceValid, message: priceMessage },
      address: { valid: addressValid, message: addressMessage },
      communityName: { valid: communityValid, message: communityMessage },
      advantage1: { 
        valid: adv1Valid, 
        message: adv1Message, 
        charCount: adv1Length,
        ...(adv1ContentWarning && { contentWarning: adv1ContentWarning }),
      },
      advantage2: { 
        valid: adv2Valid, 
        message: adv2Message, 
        charCount: adv2Length,
        ...(adv2ContentWarning && { contentWarning: adv2ContentWarning }),
      },
      disadvantage: { 
        valid: disValid, 
        message: disMessage, 
        charCount: disLength,
        ...(disContentWarning && { contentWarning: disContentWarning }),
      },
      highlights: {
        valid: highlightsValid,
        message: highlightsValid ? '' : '請至少選擇 3 個重點膠囊',
        warnings: highlightsWarnings
      },
      images: { valid: imagesValid, message: imagesMessage, count: imageCount },
      // 向後兼容別名
      adv1Valid,
      adv2Valid,
      disValid,
      communityValid,
      highlightsValid,
      // 整體狀態
      basicValid,
      twoGoodOneFairValid,
      allValid,
      canSubmit,
      contentCheck: {
        hasIssues: contentWarnings.length > 0,
        blockSubmit: blockByContent,
        warnings: contentWarnings,
      },
      errors,
    } as ValidationState;
  }, [form, imageCount]);
  
  return validation;
}

export default usePropertyFormValidation;
