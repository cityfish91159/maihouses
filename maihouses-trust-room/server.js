require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const xss = require('xss');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
const SYSTEM_API_KEY = process.env.SYSTEM_API_KEY;

// === 1. 安全性配置 ===
app.use(helmet({ contentSecurityPolicy: false })); // 允許內嵌 Vue
app.use(cors());
app.use(bodyParser.json({ limit: '500kb' }));

// 限流器
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }); // 一般請求
const strictLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 }); // 付款請求

app.use('/api/', limiter);

// === 2. 資料庫初始化 (WAL Mode) ===
const db = new sqlite3.Database('./maihouses_v10.db');
db.serialize(() => {
  db.run('PRAGMA journal_mode = WAL');
  db.run(
    `CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, state TEXT, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`
  );
  db.run(
    `CREATE TABLE IF NOT EXISTS audit_logs (id INTEGER PRIMARY KEY, transaction_id TEXT, action TEXT, role TEXT, ip TEXT, user_agent TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`
  );
});

const TIMEOUTS = { 5: 12 * 3600 * 1000 }; // 12小時

// === 3. Auth Middleware ===
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token expired or invalid' });
    req.user = { ...user, ip: req.ip, agent: req.headers['user-agent'] };
    // 若 Token 指定了 caseId，則只能操作該 Case
    if (req.user.caseId && req.params.id && req.user.caseId !== req.params.id) {
      return res.status(403).json({ error: 'Access denied for this case' });
    }
    next();
  });
};

// === 4. Logic Helpers ===
const createInitialState = (id) => ({
  id,
  currentStep: 1,
  isPaid: false,
  steps: {
    1: {
      name: '已電聯',
      agentStatus: 'pending',
      buyerStatus: 'pending',
      data: {},
      locked: false,
    },
    2: {
      name: '已帶看',
      agentStatus: 'pending',
      buyerStatus: 'pending',
      locked: false,
      data: {
        risks: { water: false, wall: false, structure: false, other: false },
      },
    },
    3: {
      name: '已出價',
      agentStatus: 'pending',
      buyerStatus: 'pending',
      data: {},
      locked: false,
    },
    4: {
      name: '已斡旋',
      agentStatus: 'pending',
      buyerStatus: 'pending',
      data: {},
      locked: false,
    },
    5: {
      name: '已成交',
      agentStatus: 'pending',
      buyerStatus: 'pending',
      locked: false,
      paymentStatus: 'pending',
      paymentDeadline: null,
    },
    6: {
      name: '已交屋',
      agentStatus: 'pending',
      buyerStatus: 'pending',
      locked: false,
      checklist: [],
    },
  },
  supplements: [],
});

const getTx = (id) =>
  new Promise((resolve, reject) => {
    db.get('SELECT state FROM transactions WHERE id = ?', [id], (err, row) => {
      if (err) reject(err);
      if (!row) {
        const newState = createInitialState(id);
        saveTx(id, newState).then(() => resolve(newState));
      } else {
        resolve(JSON.parse(row.state));
      }
    });
  });

const saveTx = (id, state) =>
  new Promise((resolve, reject) => {
    db.run(
      'INSERT OR REPLACE INTO transactions (id, state, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      [id, JSON.stringify(state)],
      (err) => (err ? reject(err) : resolve())
    );
  });

const logAudit = (txId, action, req) => {
  db.run(
    'INSERT INTO audit_logs (transaction_id, action, role, ip, user_agent) VALUES (?, ?, ?, ?, ?)',
    [txId, action, req.user.role, req.user.ip, req.user.agent]
  );
};

// === 5. API Endpoints ===

// [System Bridge] 主網站呼叫此 API 產生 Token 給用戶跳轉用
app.post('/api/system/generate-token', (req, res) => {
  const { apiKey, caseId, role } = req.body;
  if (apiKey !== SYSTEM_API_KEY) return res.status(403).json({ error: 'Forbidden' });

  // 簽發 12 小時有效的 Token，並綁定 CaseID
  const token = jwt.sign({ role, caseId }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token });
});

// [Dev Only] 測試用登入
app.post('/api/auth/login', (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).end();
  const { role, caseId } = req.body;
  const token = jwt.sign({ role, caseId: caseId || 'demo' }, JWT_SECRET, {
    expiresIn: '24h',
  });
  res.json({ token });
});

// 獲取狀態
app.get('/api/status/:id', authenticate, async (req, res) => {
  try {
    const tx = await getTx(req.params.id);
    // 自動檢查逾期
    if (
      tx.steps[5].paymentDeadline &&
      Date.now() > tx.steps[5].paymentDeadline &&
      tx.steps[5].paymentStatus === 'initiated'
    ) {
      tx.steps[5].paymentStatus = 'expired';
      await saveTx(req.params.id, tx);
    }
    res.json(tx);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 房仲提交
app.post('/api/agent/submit/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'agent') return res.status(403).json({ error: 'Forbidden' });
    const { step, data } = req.body;
    const tx = await getTx(req.params.id);
    const stepNum = parseInt(step);

    if (stepNum !== tx.currentStep) return res.status(400).json({ error: 'Invalid Step' });
    if (tx.steps[stepNum].locked) return res.status(400).json({ error: 'Locked' });

    if (data.note) data.note = xss(data.note); // 防 XSS

    tx.steps[stepNum].data = { ...tx.steps[stepNum].data, ...data };
    tx.steps[stepNum].agentStatus = 'submitted';

    await saveTx(req.params.id, tx);
    logAudit(req.params.id, `AGENT_SUBMIT_${step}`, req);
    res.json({ success: true, state: tx });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 買方確認
app.post('/api/buyer/confirm/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'buyer') return res.status(403).json({ error: 'Forbidden' });
    const { step } = req.body;
    const stepNum = parseInt(step);
    const tx = await getTx(req.params.id);

    if (stepNum !== tx.currentStep) return res.status(400).json({ error: 'Invalid Step' });
    if (tx.steps[stepNum].agentStatus !== 'submitted')
      return res.status(400).json({ error: 'Agent not submitted' });
    if (stepNum === 6 && (!tx.isPaid || tx.steps[5].paymentStatus !== 'completed'))
      return res.status(400).json({ error: 'Unpaid' });

    tx.steps[stepNum].buyerStatus = 'confirmed';

    if (stepNum === 5) {
      if (tx.steps[5].paymentStatus === 'pending') {
        tx.steps[5].paymentStatus = 'initiated';
        tx.steps[5].paymentDeadline = Date.now() + TIMEOUTS[5];
      }
    } else if (stepNum === 6) {
      const allChecked = tx.steps[6].checklist.every((i) => i.checked);
      if (!allChecked) return res.status(400).json({ error: 'Checklist incomplete' });
      tx.steps[6].locked = true;
    } else {
      tx.steps[stepNum].locked = true;
      tx.currentStep += 1;
    }

    await saveTx(req.params.id, tx);
    logAudit(req.params.id, `BUYER_CONFIRM_${step}`, req);
    res.json({ success: true, state: tx });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// 付款
app.use('/api/payment', strictLimiter);
app.post('/api/payment/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'buyer') return res.status(403).json({ error: 'Forbidden' });
    const tx = await getTx(req.params.id);
    const s5 = tx.steps[5];

    if (s5.buyerStatus !== 'confirmed')
      return res.status(400).json({ error: 'Contract not confirmed' });
    if (s5.paymentStatus !== 'initiated') return res.status(400).json({ error: 'Invalid status' });
    if (Date.now() > s5.paymentDeadline) return res.status(400).json({ error: 'Expired' });

    tx.isPaid = true;
    s5.paymentStatus = 'completed';
    s5.locked = true;
    tx.currentStep = 6;

    const risks = tx.steps[2].data.risks || {};
    tx.steps[6].checklist = [
      { label: '🚰 水電瓦斯功能正常', checked: false },
      { label: '🪟 門窗鎖具開關正常', checked: false },
      { label: '🔑 鑰匙門禁卡點交', checked: false },
      {
        label: `🧱 驗證房仲承諾：${risks.water ? '有' : '無'}漏水`,
        checked: false,
      },
      {
        label: `🧱 驗證房仲承諾：${risks.wall ? '有' : '無'}壁癌`,
        checked: false,
      },
    ];

    await saveTx(req.params.id, tx);
    logAudit(req.params.id, `PAYMENT_COMPLETED`, req);
    res.json({ success: true, state: tx });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Checklist Update
app.post('/api/checklist/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'buyer') return res.status(403).json({ error: 'Forbidden' });
    const { index, checked } = req.body;
    const tx = await getTx(req.params.id);
    if (tx.currentStep !== 6) return res.status(400).json({ error: 'Invalid step' });
    tx.steps[6].checklist[index].checked = checked;
    await saveTx(req.params.id, tx);
    res.json({ success: true, state: tx });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Supplement
app.post('/api/supplement/:id', authenticate, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400);
    const tx = await getTx(req.params.id);
    tx.supplements.push({
      role: req.user.role,
      content: xss(content),
      timestamp: Date.now(),
    });
    await saveTx(req.params.id, tx);
    logAudit(req.params.id, 'ADD_SUPPLEMENT', req);
    res.json({ success: true, state: tx });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Reset (Dev only)
app.post('/api/reset/:id', authenticate, async (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(403).end();
  await saveTx(req.params.id, createInitialState(req.params.id));
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`V10 Server running on port ${PORT}`));
