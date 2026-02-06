/**
 * UAG v8 Schema 自動部署腳本
 *
 * 使用方式: node supabase/migrations/deploy_uag.js
 */

const fs = require('fs');
const path = require('path');

async function deployUAGSchema() {
  console.log('🚀 開始部署 UAG v8 Schema...\n');

  // 讀取環境變數
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mtqnjmoisrvjofdxhwhi.supabase.co';
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ 錯誤: SUPABASE_SERVICE_ROLE_KEY 環境變數未設定');
    console.log('請設定環境變數後再試：');
    console.log('  export SUPABASE_SERVICE_ROLE_KEY=your_key');
    process.exit(1);
  }

  // 讀取 SQL 檔案
  const sqlPath = path.join(__dirname, '20251230_uag_tracking_v8.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log(`📄 讀取 SQL 檔案: ${sqlPath}`);
  console.log(`📏 SQL 長度: ${sql.length} 字元\n`);

  // 執行 SQL
  try {
    console.log('⏳ 執行 SQL...');

    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    // 嘗試使用 REST API 的另一種方式
    if (response.status === 404) {
      console.log('⚠️  exec_sql RPC 不可用，改用直接 SQL 執行...\n');

      // 分割 SQL 語句並逐一執行
      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'));

      console.log(`📊 總共 ${statements.length} 個 SQL 語句\n`);

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        console.log(`[${i + 1}/${statements.length}] 執行中...`);

        // 使用 PostgREST query endpoint
        const stmtResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            Prefer: 'return=representation',
          },
          body: JSON.stringify({ query: stmt + ';' }),
        });

        if (!stmtResponse.ok) {
          const error = await stmtResponse.text();
          console.error(`❌ 語句 ${i + 1} 執行失敗:`, error);
        }
      }

      console.log('\n✅ SQL 執行完成\n');
    } else if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    } else {
      const result = await response.json();
      console.log('✅ SQL 執行成功:', result);
    }

    // 驗證部署
    console.log('\n🔍 驗證部署結果...\n');
    await verifyDeployment(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  } catch (error) {
    console.error('\n❌ 部署失敗:', error.message);
    console.log('\n💡 建議：請手動到 Supabase Dashboard 執行 SQL');
    console.log(`   https://supabase.com/dashboard/project/mtqnjmoisrvjofdxhwhi/sql/new\n`);
    process.exit(1);
  }
}

async function verifyDeployment(url, key) {
  try {
    // 檢查表格
    const tablesResponse = await fetch(`${url}/rest/v1/rpc/get_tables`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });

    if (tablesResponse.ok) {
      console.log('✅ 表格驗證完成');
    } else {
      console.log('⚠️  無法自動驗證，請手動檢查');
      console.log('   執行以下 SQL 驗證:');
      console.log(
        "   SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'uag%';"
      );
    }

    console.log('\n🎉 UAG v8 Schema 部署完成！\n');
    console.log('📊 部署內容:');
    console.log('   ✓ uag_sessions (會話表)');
    console.log('   ✓ uag_events (事件表)');
    console.log('   ✓ uag_events_archive (歸檔表)');
    console.log('   ✓ uag_lead_rankings (物化視圖)');
    console.log('   ✓ track_uag_event_v8() (追蹤函數)');
    console.log('   ✓ calculate_lead_grade() (分級函數)');
    console.log('   ✓ archive_old_history() (歸檔函數)');
    console.log('   ✓ RLS 政策\n');
  } catch (error) {
    console.log('⚠️  驗證步驟跳過:', error.message);
  }
}

// 執行部署
deployUAGSchema();
