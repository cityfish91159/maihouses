/**
 * D4 真正自動生成：以 Zod Schema 為唯一來源自動產出 JSON Schema
 * 不依賴手寫常數；若 Zod 變動，輸出會隨之改變
 * D13 修正：使用統一錯誤處理
 */
import { writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { SeedFileSchema } from '../src/types/property-page';
import { handleScriptError, handleScriptSuccess } from './lib/error-handler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUTPUT_PATH = resolve(__dirname, '../public/data/seed-property-page.schema.json');

console.log('🔄 正在從 Zod 生成 JSON Schema...');

try {
  const jsonSchema = (SeedFileSchema as unknown as { toJSONSchema: () => Record<string, unknown> }).toJSONSchema();
  const withMeta = { ...jsonSchema, $schema: 'http://json-schema.org/draft-07/schema#' };
  writeFileSync(OUTPUT_PATH, JSON.stringify(withMeta, null, 2));
  handleScriptSuccess('generate-json-schema', `Schema 已生成至: ${OUTPUT_PATH}`);
} catch (error) {
  handleScriptError('generate-json-schema', error);
}
