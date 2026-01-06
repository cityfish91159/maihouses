/**
 * 驗證 seed-property-page.json 是否符合 Zod Schema
 * 
 * 執行: npx tsx scripts/validate-property-types.ts
 * 或: npm run validate:property
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { SeedFileSchema } from '../src/types/property-page';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔍 驗證 seed-property-page.json...\n');

try {
  // 1. 讀取 JSON
  const jsonPath = resolve(__dirname, '../public/data/seed-property-page.json');
  const rawData = JSON.parse(readFileSync(jsonPath, 'utf8'));

  // 2. Zod 驗證 (一行搞定)
  const result = SeedFileSchema.safeParse(rawData);

  if (result.success) {
    console.log('✅ default 資料集驗證通過');
    console.log('✅ test 資料集驗證通過');
    console.log('\n🎉 所有驗證通過！資料結構完美匹配 Zod Schema。');
    process.exit(0);
  } else {
    // Zod 的錯誤訊息超詳細，會告訴你哪個欄位、什麼問題
    console.error('❌ 驗證失敗:\n');
    result.error.issues.forEach((issue, idx) => {
      console.error(`${idx + 1}. 路徑: ${issue.path.join('.')}`);
      console.error(`   問題: ${issue.message}`);
      console.error('');
    });
    process.exit(1);
  }
} catch (error) {
  console.error('❌ 執行失敗:', error instanceof Error ? error.message : error);
  process.exit(1);
}
