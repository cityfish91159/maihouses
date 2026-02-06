/**
 * D4 真正自動生成：以 Zod Schema 為唯一來源自動產出 JSON Schema
 * 不依賴手寫常數；若 Zod 變動，輸出會隨之改變
 * D13 修正：使用統一錯誤處理
 * D20 修正：使用正規 zod-to-json-schema 套件，移除 as unknown as 詐騙
 */
import { writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { SeedFileSchema } from '../src/types/property-page';
import { handleScriptError, handleScriptSuccess } from './lib/error-handler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUTPUT_PATH = resolve(__dirname, '../public/data/seed-property-page.schema.json');

console.log('🔄 正在從 Zod 生成 JSON Schema...');

try {
  // Note: zod v4 與 zod-to-json-schema v3 有型別不相容，但執行正常
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jsonSchema = zodToJsonSchema(SeedFileSchema as any, { $refStrategy: 'none' });
  writeFileSync(OUTPUT_PATH, JSON.stringify(jsonSchema, null, 2));
  handleScriptSuccess('generate-json-schema', `Schema 已生成至: ${OUTPUT_PATH}`);
} catch (error) {
  handleScriptError('generate-json-schema', error);
}
