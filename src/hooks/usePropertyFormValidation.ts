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
  advantage1: { valid: boolean; message: string; charCount: number; contentWarning?: string | undefined };
  advantage2: { valid: boolean; message: string; charCount: number; contentWarning?: string | undefined };
  disadvantage: { valid: boolean; message: string; charCount: number; contentWarning?: string | undefined };
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
 * 實作「標籤/文字」權重互補邏輯 (HP-2.1)
 */
export function usePropertyFormValidation(
  form: FormFields,
  imageCount: number
): ValidationState {
  
  const validation = useMemo(() => {
    const errors: ValidationError[] = [];
    const highlights = form.highlights || [];
    const highlightCount = highlights.length;

    // 動態計算字數門檻 (互補邏輯)
    const dynamicRules = {
      advMin: highlightCount >= 3 ? 2 : 5,
      adv2Optional: highlightCount >= 5,
      disMin: highlightCount >= 3 ? 5 : 10,
    };
    
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
    
    // 優點1 驗證 (受動態門檻影響)
    const adv1Length = form.advantage1.length;
    const adv1Valid = adv1Length >= dynamicRules.advMin;
    const adv1Message = adv1Valid 
      ? '' 
      : `還需 ${dynamicRules.advMin - adv1Length} 字`;
    if (!adv1Valid && adv1Length > 0) {
      errors.push({ field: 'advantage1', message: `優點1${adv1Message}` });
    }
    
    // 優點2 驗證 (受動態門檻影響)
    const adv2Length = form.advantage2.length;
    const adv2Valid = dynamicRules.adv2Optional || adv2Length >= dynamicRules.advMin;
    const adv2Message = adv2Valid 
      ? '' 
      : `還需 ${dynamicRules.advMin - adv2Length} 字`;
    if (!adv2Valid && adv2Length > 0) {
      errors.push({ field: 'advantage2', message: `優點2${adv2Message}` });
    }
    
    // 公道話 驗證 (受動態門檻影響)
    const disLength = form.disadvantage.length;
    const disValid = disLength >= dynamicRules.disMin;
    const disMessage = disValid 
      ? '' 
      : `還需 ${dynamicRules.disMin - disLength} 字`;
    if (!disValid && disLength > 0) {
      errors.push({ field: 'disadvantage', message: `公道話${disMessage}` });
    }

    // 重點膠囊驗證
    const highlightsValid = highlightCount >= 3;
    const highlightsMessage = highlightsValid ? '' : '請至少選擇 3 個重點膠囊';
    if (!highlightsValid && highlightCount > 0) {
      errors.push({ field: 'highlights', message: highlightsMessage });
    }
    
    // 圖片驗證
    const imagesValid = imageCount >= VALIDATION_RULES.images.minCount;
    const imagesMessage = imagesValid ? '' : '請至少上傳 1 張照片';
    if (!imagesValid) {
      errors.push({ field: 'images', message: imagesMessage });
    }
    
    // 內容審核 (遞迴檢查所有文字欄位)
    const checkFields = [
      { name: '標題', value: form.title },
      { name: '地址', value: form.address },
      { name: '社區', value: form.communityName },
      { name: '優點1', value: form.advantage1 },
      { name: '優點2', value: form.advantage2 },
      { name: '公道話', value: form.disadvantage },
      ...highlights.map((h, i) => ({ name: `標籤${i+1}`, value: h }))
    ];

    const contentWarnings: string[] = [];
    let blockSubmit = false;

    const fieldResults = checkFields.map(f => {
      const result = checkContent(f.value);
      if (!result.passed) {
        result.issues.forEach(issue => {
          contentWarnings.push(`${f.name}: ${issue.message}`);
          if (issue.type === 'sensitive') blockSubmit = true;
        });
      }
      return { name: f.name, result };
    });

    const basicValid = titleValid && priceValid && addressValid && communityValid;
    const twoGoodOneFairValid = adv1Valid && adv2Valid && disValid && highlightsValid;
    const allValid = basicValid && twoGoodOneFairValid && imagesValid && !blockSubmit;

    return {
      title: { valid: titleValid, message: titleMessage },
      price: { valid: priceValid, message: priceMessage },
      address: { valid: addressValid, message: addressMessage },
      communityName: { valid: communityValid, message: communityMessage },
      advantage1: { 
        valid: adv1Valid, 
        message: adv1Message, 
        charCount: adv1Length,
        contentWarning: fieldResults.find(r => r.name === '優點1')?.result.issues[0]?.message
      },
      advantage2: { 
        valid: adv2Valid, 
        message: adv2Message, 
        charCount: adv2Length,
        contentWarning: fieldResults.find(r => r.name === '優點2')?.result.issues[0]?.message
      },
      disadvantage: { 
        valid: disValid, 
        message: disMessage, 
        charCount: disLength,
        contentWarning: fieldResults.find(r => r.name === '公道話')?.result.issues[0]?.message
      },
      highlights: { 
        valid: highlightsValid, 
        message: highlightsMessage,
        warnings: fieldResults.filter(r => r.name.startsWith('標籤')).map(r => r.result.issues[0]?.message).filter(Boolean) as string[]
      },
      images: { valid: imagesValid, message: imagesMessage, count: imageCount },
      
      adv1Valid,
      adv2Valid,
      disValid,
      communityValid,
      highlightsValid,
      
      basicValid,
      twoGoodOneFairValid,
      allValid,
      canSubmit: allValid,
      
      contentCheck: {
        hasIssues: contentWarnings.length > 0,
        blockSubmit,
        warnings: contentWarnings,
      },
      
      errors,
    };
  }, [form, imageCount]);

  return validation;
}

export default usePropertyFormValidation;
