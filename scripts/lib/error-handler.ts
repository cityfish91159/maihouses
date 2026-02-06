/**
 * D13 修正：統一腳本錯誤處理
 * 所有腳本共用，確保錯誤訊息格式一致
 */

export function handleScriptError(scriptName: string, error: unknown): never {
  console.error('');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error(`❌ [${scriptName}] 執行失敗`);
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (error instanceof Error) {
    console.error(`錯誤: ${error.message}`);

    // Zod 驗證錯誤特殊處理
    if ('issues' in error && Array.isArray((error as { issues: unknown[] }).issues)) {
      console.error('\n詳細問題:');
      (error as { issues: { path: string[]; message: string }[] }).issues
        .slice(0, 10)
        .forEach((issue, i) => {
          console.error(`  ${i + 1}. ${issue.path.join('.')}: ${issue.message}`);
        });
    }

    // DEBUG 模式顯示完整 stack
    if (process.env.DEBUG) {
      console.error('\n[DEBUG] Stack trace:');
      console.error(error.stack);
    }
  } else {
    console.error(`錯誤: ${String(error)}`);
  }

  console.error('');
  process.exit(1);
}

export function handleScriptSuccess(scriptName: string, message?: string): void {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ [${scriptName}] ${message ?? '執行成功'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}
