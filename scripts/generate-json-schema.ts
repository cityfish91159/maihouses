/**
 * D4 修正：從 Zod Schema 自動生成 JSON Schema
 * 
 * 用途：
 * 1. 讓 VS Code 能驗證 seed-property-page.json
 * 2. 提供 IntelliSense 自動補全
 * 3. 確保 SSOT - Zod 是唯一源頭
 * 
 * 注意：
 * 此 Schema 需與 src/types/property-page.ts 的 Zod Schema 保持同步
 * 當 Zod Schema 變更時，需同步更新此處
 */
import { writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUTPUT_PATH = resolve(__dirname, '../public/data/seed-property-page.schema.json');

// ============================================
// JSON Schema 定義
// 與 src/types/property-page.ts 的 Zod Schema 保持同步
// ============================================

const jsonSchema = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "PropertyPageSeed",
  "description": "房源列表頁種子資料格式 - 需與 Zod Schema 保持同步",
  "type": "object",
  "properties": {
    "$schema": { "type": "string" },
    "default": { "$ref": "#/definitions/PropertyPageData" },
    "test": { "$ref": "#/definitions/PropertyPageData" }
  },
  "required": ["default"],
  "additionalProperties": false,
  "definitions": {
    "FeaturedReview": {
      "type": "object",
      "properties": {
        "stars": { "type": "string" },
        "author": { "type": "string" },
        "tags": { 
          "type": "array",
          "items": { "type": "string" }
        },
        "content": { "type": "string" }
      },
      "required": ["stars", "author", "content"],
      "additionalProperties": false
    },
    "FeaturedPropertyCard": {
      "type": "object",
      "properties": {
        "badge": { "type": "string" },
        "image": { "type": "string", "format": "uri" },
        "title": { "type": "string" },
        "location": { "type": "string" },
        "details": {
          "type": "array",
          "items": { "type": "string" },
          "minItems": 1
        },
        "highlights": { "type": "string" },
        "rating": { "type": "string" },
        "reviews": {
          "type": "array",
          "items": { "$ref": "#/definitions/FeaturedReview" },
          "minItems": 1
        },
        "lockCount": { "type": "integer", "minimum": 0 },
        "price": { "type": "string" },
        "size": { "type": "string" }
      },
      "required": ["badge", "image", "title", "location", "details", "rating", "reviews", "lockCount", "price", "size"],
      "additionalProperties": false
    },
    "FeaturedSection": {
      "type": "object",
      "properties": {
        "main": { "$ref": "#/definitions/FeaturedPropertyCard" },
        "sideTop": { "$ref": "#/definitions/FeaturedPropertyCard" },
        "sideBottom": { "$ref": "#/definitions/FeaturedPropertyCard" }
      },
      "required": ["main", "sideTop", "sideBottom"],
      "additionalProperties": false
    },
    "ListingReview": {
      "type": "object",
      "properties": {
        "badge": { "type": "string" },
        "content": { "type": "string" }
      },
      "required": ["badge", "content"],
      "additionalProperties": false
    },
    "ListingPropertyCard": {
      "type": "object",
      "properties": {
        "image": { "type": "string", "format": "uri" },
        "title": { "type": "string" },
        "tag": { "type": "string" },
        "price": { "type": "string" },
        "size": { "type": "string" },
        "rating": { "type": "string" },
        "reviews": {
          "type": "array",
          "items": { "$ref": "#/definitions/ListingReview" },
          "minItems": 1
        },
        "note": { "type": "string" },
        "lockLabel": { "type": "string" },
        "lockCount": { "type": "integer", "minimum": 0 }
      },
      "required": ["image", "title", "tag", "price", "size", "rating", "reviews", "note", "lockLabel", "lockCount"],
      "additionalProperties": false
    },
    "PropertyPageData": {
      "type": "object",
      "properties": {
        "featured": { "$ref": "#/definitions/FeaturedSection" },
        "listings": {
          "type": "array",
          "items": { "$ref": "#/definitions/ListingPropertyCard" },
          "minItems": 1
        }
      },
      "required": ["featured", "listings"],
      "additionalProperties": false
    }
  }
};

console.log('🔄 正在生成 JSON Schema...');

try {
  writeFileSync(OUTPUT_PATH, JSON.stringify(jsonSchema, null, 2));
  console.log(`✅ Schema 已生成至: ${OUTPUT_PATH}`);
} catch (error) {
  console.error('❌ 生成失敗:', error);
  process.exit(1);
}
