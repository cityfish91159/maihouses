const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');
const QUALITY_GATE = path.join(__dirname, 'quality-gate.cjs');

// 顏色設定
const c = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(msg, color = 'reset') {
    console.log(`${c[color]}${msg}${c.reset}`);
}

function clearConsole() {
    process.stdout.write('\x1b[2J\x1b[3J\x1b[H');
}

// 防抖動 Timer
let debounceTimer = null;
let isRunning = false;

function runQualityCheck(changedFile) {
    if (isRunning) return;

    // 如果只是檔案變更，我們不一定要立刻清除畫面，保留上次的錯誤可能比較好？
    // 但為了「即時反饋感」，清除畫面重跑是比較像 "Watch Mode" 的體驗
    clearConsole();
    
    const time = new Date().toLocaleTimeString();
    log(`[${time}] 👮 偵測到檔案變更，全域監控啟動...`, 'cyan');
    if (changedFile) {
        log(`變更檔案: ${path.relative(ROOT, changedFile)}`, 'yellow');
    }

    isRunning = true;

    // 呼叫 quality-gate.cjs
    const child = spawn('node', [QUALITY_GATE], {
        cwd: ROOT,
        stdio: 'inherit', // 直接將輸出導向到當前終端
        shell: true
    });

    child.on('close', (code) => {
        isRunning = false;
        if (code === 0) {
            log('\n✨ 全域監控：PASS (等待下次變更...)', 'green');
        } else {
            log('\n🚨 全域監控：BLOCK (請修正以上錯誤)', 'red');
            // 可以加入聲音提示 process.stdout.write('\x07');
        }
    });
}

// 遞迴與 Watch
// Windows 下 fs.watch({ recursive: true }) 支援度在 Node 20+ 已經不錯
// 但為了保險，我們只監聽 src 目錄的 changes (包含 rename)
// 如果遇到子目錄不觸發 update 的情況，可能需要 chokidar，但我們先試試 native

log(`🔍 啟動全域監控終端 (Universal Supervision Terminal)`, 'cyan');
log(`📂 監控目錄: ${SRC_DIR}`, 'cyan');
log(`👮 執行標準: ${path.relative(ROOT, QUALITY_GATE)}`, 'cyan');
log(`Waiting for changes...`, 'yellow');

try {
    const watcher = fs.watch(SRC_DIR, { recursive: true }, (eventType, filename) => {
        if (!filename) return;
        
        // 忽略某些檔案
        if (filename.includes('node_modules') || filename.includes('.git')) return;
        if (!filename.match(/\.(ts|tsx|js|jsx)$/)) return; // 只監控代碼

        // Debounce 500ms
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            runQualityCheck(path.join(SRC_DIR, filename));
        }, 500);
    });

    watcher.on('error', (err) => {
        log(`Watcher Error: ${err.message}`, 'red');
    });

} catch (err) {
    log(`無法啟動 Watcher: ${err.message}`, 'red');
    log(`提示: Windows 使用 fs.watch 需要 Windows 10/11 且 Node 版本較新`, 'yellow');
}
