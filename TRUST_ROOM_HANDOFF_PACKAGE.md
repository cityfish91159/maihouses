# 安心留痕 (Trust Room) 完整開發手冊

> **版本**: V11 (Mock + Real Hybrid)  
> **最後更新**: 2025-11-26  
> **專案**: MaiHouses (邁房子)

---

## 📋 目錄

1. [功能概述](#功能概述)
2. [快速上手](#快速上手)
3. [系統架構](#系統架構)
4. [前端代碼 (React)](#前端代碼-react)
5. [後端 API (Vercel)](#後端-api-vercel)
6. [資料庫 (Supabase)](#資料庫-supabase)
7. [環境變數](#環境變數)

---

## 功能概述

**安心留痕 (Trust Room)** 是一個房地產交易流程管理系統，特色：

### 核心功能
- **六階段交易流程**: 已電聯 → 已帶看 → 已出價 → 已斡旋 → 已成交 → 已交屋
- **雙方確認機制**: 房仲發起 (Submit) → 買方確認 (Confirm)
- **不可修改性 (Immutability)**: 所有紀錄送出後無法編輯，僅能透過「補充紀錄」勘誤
- **買方留言功能**: 買方確認時可選填留言
- **付款倒數**: 成交階段有付款期限倒數
- **交屋檢查清單**: 最後階段提供檢查項目

### 雙模並行 (Hybrid Mode)
1. **演示模式 (Mock Mode)**: 
   - 預設模式，無需後端、無需資料庫。
   - 資料暫存於瀏覽器 `localStorage`，重整頁面不丟失。
   - 適合展示與 UI 測試。
2. **正式模式 (Real Mode)**:
   - 需透過 Token 登入。
   - 資料儲存於 Supabase 資料庫。
   - 完整稽核紀錄 (Audit Logs)。

---

## 快速上手

### 1. 啟動演示模式
直接訪問 `/assure` 頁面，點擊「啟動演示模式」即可。

### 2. 啟動正式模式
1. 確保 Supabase 資料庫已建立 (見下方 SQL)。
2. 確保 Vercel 環境變數已設定。
3. 取得 Token (可透過 `/api/trust/login` 產生)。
4. 訪問帶 Token 的網址：`/assure#token=YOUR_JWT_TOKEN`。

---

## 系統架構

- **前端**: React + TypeScript + Tailwind CSS
- **狀態管理**: Custom Hook (`useTrustRoom`)
- **後端**: Vercel Serverless Functions (`/api/trust/*`)
- **資料庫**: Supabase (PostgreSQL)

---

## 前端代碼 (React)

### 1. 核心邏輯 Hook (`src/hooks/useTrustRoom.ts`)

此 Hook 封裝了所有的狀態管理、Mock 邏輯與 API 呼叫。

```typescript
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

// --- TYPES ---
export interface Step {
  name: string;
  agentStatus: 'pending' | 'submitted';
  buyerStatus: 'pending' | 'confirmed';
  locked: boolean;
  data: any;
  paymentStatus?: 'pending' | 'initiated' | 'completed' | 'expired';
  paymentDeadline?: number | null;
  checklist?: { id: string; label: string; checked: boolean }[];
}

export interface Transaction {
  id: string;
  currentStep: number;
  isPaid: boolean;
  steps: Record<string, Step>;
  supplements: { role: string; content: string; timestamp: number }[];
}

// --- MOCK DATA & UTILS ---
const MOCK_TIMEOUTS: Record<number, number> = { 5: 30 * 1000 }; // Demo模式下縮短為30秒方便測試

const createMockState = (id: string): Transaction => ({
  id,
  currentStep: 1,
  isPaid: false,
  steps: {
    1: { name: "已電聯", agentStatus: 'pending', buyerStatus: 'pending', data: {}, locked: false },
    2: { name: "已帶看", agentStatus: 'pending', buyerStatus: 'pending', locked: false, data: {} },
    3: { name: "已出價", agentStatus: 'pending', buyerStatus: 'pending', data: {}, locked: false },
    4: { name: "已斡旋", agentStatus: 'pending', buyerStatus: 'pending', data: {}, locked: false },
    5: { name: "已成交", agentStatus: 'pending', buyerStatus: 'pending', locked: false, paymentStatus: 'pending', paymentDeadline: null, data: {} },
    6: { name: "已交屋", agentStatus: 'pending', buyerStatus: 'pending', locked: false, checklist: [], data: {} }
  },
  supplements: []
});

export function useTrustRoom() {
  // States
  const [isMock, setIsMock] = useState(false);
  const [caseId, setCaseId] = useState('');
  const [role, setRole] = useState<'agent' | 'buyer'>('agent');
  const [token, setToken] = useState('');
  const [tx, setTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [timeLeft, setTimeLeft] = useState('--:--:--');

  // Helper to save mock state
  const saveMockState = (newState: Transaction) => {
    setTx(newState);
    localStorage.setItem(`mock_tx_${newState.id}`, JSON.stringify(newState));
  };

  // Helper to load mock state
  const loadMockState = (id: string) => {
    const saved = localStorage.getItem(`mock_tx_${id}`);
    return saved ? JSON.parse(saved) : createMockState(id);
  };

  // Mock Mode Toggle
  const startMockMode = useCallback(() => {
    setIsMock(true);
    const mockId = 'MOCK-DEMO-01';
    setCaseId(mockId);
    setRole('agent');
    setTx(loadMockState(mockId));
    toast.success('已進入演示模式 (資料僅暫存於瀏覽器)');
  }, []);

  // Fetch Data (Real API)
  const fetchData = useCallback(async () => {
    if (isMock) return; // Mock mode uses local state
    if (!token || !caseId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/trust/status?id=${caseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTx(data);
      } else {
        if (res.status === 401 || res.status === 403) toast.error('憑證失效，請重新登入');
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [isMock, token, caseId]);

  // Polling
  useEffect(() => {
    if (!isMock && token && caseId) {
      fetchData();
      const interval = setInterval(fetchData, 5000);
      return () => clearInterval(interval);
    }
  }, [token, caseId, isMock, fetchData]);

  // Payment Timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (tx?.steps?.[5]?.paymentStatus === 'initiated' && tx.steps[5].paymentDeadline) {
        const diff = tx.steps[5].paymentDeadline - Date.now();
        if (diff <= 0) {
          setTimeLeft("已逾期");
          // Mock Mode Auto Expiration
          if (isMock) {
            setTx(prev => {
              if (!prev) return null;
              const next = { ...prev };
              if (next.steps[5]) {
                next.steps[5].paymentStatus = 'expired';
              }
              saveMockState(next); // Persist
              return next;
            });
          } else {
             // Real Mode: Trigger status check to update backend state (Lazy Expiration)
             fetchData();
          }
        } else {
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          setTimeLeft(`${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [tx, isMock, fetchData]);

  // Unified Action Handler
  const dispatchAction = useCallback(async (endpoint: string, body: any = {}) => {
    if (isBusy) return;
    setIsBusy(true);

    // --- MOCK MODE LOGIC ---
    if (isMock) {
      await new Promise(r => setTimeout(r, 600)); // Simulate delay

      if (!tx) {
          setIsBusy(false);
          return;
      }
      
      const newTx = JSON.parse(JSON.stringify(tx)) as Transaction; // Deep Clone
      const stepNum = parseInt(body.step || tx.currentStep);

      try {
        switch (endpoint) {
          case 'submit':
            if (role !== 'agent') throw new Error("權限不足");
            if (newTx.steps[stepNum]) {
              newTx.steps[stepNum].data = { ...newTx.steps[stepNum].data, ...body.data };
              newTx.steps[stepNum].agentStatus = 'submitted';
            }
            break;

          case 'confirm':
            if (role !== 'buyer') throw new Error("權限不足");
            if (newTx.steps[stepNum]) {
              newTx.steps[stepNum].buyerStatus = 'confirmed';
              if (body.note) {
                newTx.steps[stepNum].data = { ...newTx.steps[stepNum].data, buyerNote: body.note };
              }
            }

            if (stepNum === 5) {
              if (newTx.steps[5]) {
                newTx.steps[5].paymentStatus = 'initiated';
                newTx.steps[5].paymentDeadline = Date.now() + (MOCK_TIMEOUTS[5] || 30000);
              }
            } else if (stepNum === 6) {
              const allChecked = newTx.steps[6]?.checklist?.every(i => i.checked);
              if (!allChecked) throw new Error("檢查項目未完成");
              if (newTx.steps[6]) newTx.steps[6].locked = true;
            } else {
              if (newTx.steps[stepNum]) newTx.steps[stepNum].locked = true;
              newTx.currentStep += 1;
            }
            break;

          case 'payment':
            if (newTx.steps[5]?.paymentStatus !== 'initiated') throw new Error("非付款狀態");
            newTx.isPaid = true;
            if (newTx.steps[5]) {
              newTx.steps[5].paymentStatus = 'completed';
              newTx.steps[5].locked = true;
            }
            newTx.currentStep = 6;
            if (newTx.steps[6]) {
              newTx.steps[6].checklist = [
                { id: 'utilities', label: "🚰 水電瓦斯功能正常", checked: false },
                { id: 'security', label: "🪟 門窗鎖具開關正常", checked: false },
                { id: 'keys', label: "🔑 鑰匙門禁卡點交", checked: false },
                { id: 'condition', label: "🧱 房屋現況確認 (漏水/壁癌等)", checked: false }
              ];
            }
            break;

          case 'checklist':
            const step6 = newTx.steps[6];
            if (step6 && step6.checklist) {
              const item = step6.checklist.find(i => i.id === body.itemId);
              if (item) {
                item.checked = body.checked;
              }
            }
            break;

          case 'supplement':
            newTx.supplements.push({
              role,
              content: body.content,
              timestamp: Date.now()
            });
            break;

          case 'reset':
            const resetState = createMockState(caseId);
            saveMockState(resetState);
            toast.success('已重置 (Mock)');
            setIsBusy(false);
            return;
        }
        saveMockState(newTx);
        toast.success('操作成功 (Mock)');
        setIsBusy(false);
        return true;
      } catch (e: any) {
        toast.error(e.message);
        setIsBusy(false);
        return false;
      }
    }

    // --- REAL API LOGIC ---
    try {
      const res = await fetch(`/api/trust/${endpoint}?id=${caseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const d = await res.json();
      if (d.error) {
        toast.error(d.error);
        setIsBusy(false);
        return false;
      } else {
        await fetchData();
        toast.success('成功');
        setIsBusy(false);
        return true;
      }
    } catch (e: any) {
      toast.error(e.message);
      setIsBusy(false);
      return false;
    }
  }, [isMock, tx, role, caseId, token, fetchData]);

  return {
    isMock,
    caseId,
    setCaseId,
    role,
    setRole,
    token,
    setToken,
    tx,
    setTx,
    loading,
    isBusy,
    timeLeft,
    startMockMode,
    dispatchAction,
    fetchData
  };
}
```

### 2. UI 組件 (`src/pages/Assure/Detail.tsx`)

```tsx
import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTrustRoom } from '../../hooks/useTrustRoom'
import { Phone, ClipboardCheck, HandCoins, MessageSquare, FileSignature, Home, Lock, Check, RotateCcw, Info, User, Briefcase, Zap } from 'lucide-react'
import { Toaster } from 'react-hot-toast'

export default function AssureDetail() {
  const location = useLocation()
  
  const {
    isMock,
    caseId,
    setCaseId,
    role,
    setRole,
    setToken,
    tx,
    loading,
    isBusy,
    timeLeft,
    startMockMode,
    dispatchAction
  } = useTrustRoom()
  
  // Inputs
  const [inputBuffer, setInputBuffer] = useState('')
  const [supplementInput, setSupplementInput] = useState('')
  
  // Dev Helper
  const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')

  // 初始化：檢查 Token 或 啟動 Mock
  useEffect(() => {
    const hash = location.hash
    let t = ''
    
    if (hash.includes('token=')) {
      t = hash.split('token=')[1] ?? ''
      localStorage.setItem('mh_token', t)
      window.location.hash = ''
    } else {
      t = localStorage.getItem('mh_token') || ''
    }

    if (t) {
      setToken(t)
      try {
        const part = t.split('.')[1]
        if (!part) throw new Error('Invalid token')
        const payload = JSON.parse(atob(part))
        setRole(payload.role)
        setCaseId(payload.caseId)
      } catch (e) {
        console.error('Token invalid', e)
        localStorage.removeItem('mh_token')
      }
    } 
    else if (isDev) {
        setCaseId('demo-v10')
    }
  }, [location, isDev, setToken, setRole, setCaseId])

  const handleAction = async (endpoint: string, body: any = {}) => {
      const success = await dispatchAction(endpoint, body);
      if (success) {
          setInputBuffer('');
          setSupplementInput('');
      }
  }

  const submitAgent = (step: string) => handleAction('submit', { step, data: { note: inputBuffer } })
  const confirmStep = (step: string) => handleAction('confirm', { step, note: inputBuffer })
  const pay = () => { if (confirm('確認模擬付款？')) handleAction('payment') }
  const toggleCheck = (itemId: string, checked: boolean) => { if (role === 'buyer') handleAction('checklist', { itemId, checked }) }
  const addSupplement = () => handleAction('supplement', { content: supplementInput })
  const reset = () => { if (confirm('重置所有進度？')) handleAction('reset') }
  
  const toggleRole = () => {
      const newRole = role === 'agent' ? 'buyer' : 'agent'
      setRole(newRole)
  }

  // --- RENDERING ---

  if (!tx && !loading) {
      return (
          <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4 font-sans">
              <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap size={32} />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">安心留痕 Trust Room</h2>
                <p className="text-sm text-gray-500 mb-6">目前未檢測到有效的登入憑證 (Token)。您可以進入演示模式來測試功能。</p>
                
                <button 
                    onClick={startMockMode}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-lg flex items-center justify-center gap-2"
                >
                    <Zap size={18} />
                    啟動演示模式 (Demo Mode)
                </button>
                <p className="text-xs text-gray-400 mt-4">此模式下資料不會保存到資料庫。</p>
              </div>
          </div>
      )
  }

  if (!tx) return <div className="p-8 text-center">載入中...</div>

  const getStepIcon = (k: string) => {
    switch (k) {
      case '1': return <Phone size={14} />
      case '2': return <ClipboardCheck size={14} />
      case '3': return <HandCoins size={14} />
      case '4': return <MessageSquare size={14} />
      case '5': return <FileSignature size={14} />
      case '6': return <Home size={14} />
      default: return <Info size={14} />
    }
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white shadow-2xl relative pb-24 font-sans text-gray-800">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className={`${isMock ? 'bg-indigo-900' : 'bg-slate-900'} text-white p-4 sticky top-0 z-50 flex justify-between items-center shadow-lg transition-colors`}>
        <div>
          <h1 className="font-bold text-lg tracking-wide flex items-center gap-2">
            MaiHouses <span className={`text-xs px-1 rounded ${isMock ? 'bg-yellow-500 text-black' : 'bg-blue-600'}`}>{isMock ? 'DEMO' : 'V10'}</span>
          </h1>
          <div className="flex items-center text-[10px] text-gray-400 gap-2">
            <span>案號: {caseId}</span>
            {loading && <span className="animate-pulse">●</span>}
          </div>
        </div>
        <div className="flex gap-2">
            <button onClick={reset} className="bg-white/10 hover:bg-white/20 w-8 h-8 rounded flex items-center justify-center transition">
                <RotateCcw size={14} />
            </button>
            <button 
                onClick={toggleRole} 
                className={`px-3 py-1 rounded-md text-xs font-bold border border-white/20 flex items-center gap-1 transition ${role === 'agent' ? 'bg-blue-600' : 'bg-green-600'}`}
            >
                {role === 'agent' ? <Briefcase size={12} /> : <User size={12} />}
                {role === 'agent' ? '房仲' : '買方'}
            </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="p-4 bg-slate-50 border-b sticky top-[60px] z-40">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-700">進度 {tx.currentStep}/6</span>
          {tx.isPaid && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">已履約</span>}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div className="bg-blue-600 h-2 rounded-full transition-all duration-700" style={{ width: `${(tx.currentStep / 6) * 100}%` }}></div>
        </div>
      </div>

      {/* Steps */}
      <div className="p-4 space-y-0">
        {Object.entries(tx.steps).map(([key, step]) => {
          const stepNum = parseInt(key)
          const isCurrent = stepNum === tx.currentStep
          const isPast = stepNum < tx.currentStep
          const isFuture = stepNum > tx.currentStep
          
          let iconBg = 'bg-gray-300 border-gray-300'
          if (isPast || step.locked) iconBg = 'bg-green-500 border-green-500'
          else if (isCurrent) iconBg = 'bg-blue-600 border-blue-600'

          return (
            <div key={key} className={`relative pl-14 py-3 ${isFuture ? 'opacity-50 grayscale' : ''}`}>
              {/* Icon */}
              <div className={`absolute left-0 top-3 z-10 w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-colors text-white ${iconBg}`}>
                {getStepIcon(key)}
              </div>
              {/* Line */}
              {key !== '6' && <div className="absolute left-[24px] top-[50px] bottom-[-20px] w-[2px] bg-gray-200 z-0"></div>}
              
              {/* Card */}
              <div className={`bg-white border rounded-xl p-4 shadow-sm transition-all ${isCurrent ? 'border-blue-500 ring-2 ring-blue-50' : 'border-gray-200'}`}>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    {step.name}
                    {key === '5' && step.paymentStatus === 'initiated' && !step.locked && (
                      <span className="text-[10px] text-orange-500 bg-orange-50 px-2 rounded animate-pulse">付款中</span>
                    )}
                    {key === '5' && step.paymentStatus === 'expired' && (
                      <span className="text-[10px] text-red-500 bg-red-50 px-2 rounded">逾期</span>
                    )}
                  </h3>
                  {step.locked && <Lock size={14} className="text-green-600" />}
                </div>

                {/* Step 2: Viewing */}
                {key === '2' && step.data.note && (
                  <div className="mb-3 p-3 bg-gray-50 rounded border border-gray-100">
                    <p className="text-xs font-bold text-gray-500 mb-2 border-b pb-1">📢 房仲帶看紀錄</p>
                    <div className="text-sm whitespace-pre-wrap">{step.data.note}</div>
                  </div>
                )}

                {/* Step 5: Payment Timer */}
                {key === '5' && step.paymentStatus === 'initiated' && !step.locked && (
                  <div className="mb-4 text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="text-2xl font-mono text-orange-600 font-bold mb-1">{timeLeft}</div>
                    <div className="text-xs text-orange-400 mb-3">付款截止</div>
                    {role === 'buyer' ? (
                      <button 
                        onClick={pay} 
                        disabled={isBusy || timeLeft === '已逾期'} 
                        className={`w-full text-white font-bold py-2 rounded shadow ${timeLeft === '已逾期' ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-orange-500 to-red-500 hover:shadow-lg'}`}
                      >
                        {timeLeft === '已逾期' ? '付款已截止' : (isBusy ? '處理中...' : '立即支付 NT$ 2,000')}
                      </button>
                    ) : (
                      <div className="text-xs text-gray-400">等待買方付款...</div>
                    )}
                  </div>
                )}

                {/* Step 6: Checklist */}
                {key === '6' && !step.locked && tx.isPaid && (
                  <div className="space-y-2 mt-2">
                    {step.checklist?.map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => toggleCheck(item.id, !item.checked)} 
                        className={`flex items-center p-4 border rounded transition cursor-pointer ${item.checked ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-gray-50'}`}
                      >
                        <div className={`w-5 h-5 border rounded flex items-center justify-center bg-white ${item.checked ? 'bg-indigo-600 border-indigo-600' : ''}`}>
                          {item.checked && <Check size={12} className="text-white" />}
                        </div>
                        <span className={`ml-3 text-sm ${item.checked ? 'text-indigo-800 font-bold' : ''}`}>{item.label}</span>
                      </div>
                    ))}
                    <button onClick={() => confirmStep('6')} className="w-full bg-indigo-600 text-white py-2 rounded font-bold mt-2">完成交屋</button>
                  </div>
                )}

                {/* Actions */}
                {!step.locked && isCurrent && key !== '5' && key !== '6' && (
                  <div>
                    {role === 'agent' && (
                      step.agentStatus === 'pending' ? (
                        <div>
                          <textarea 
                            value={inputBuffer}
                            onChange={(e) => setInputBuffer(e.target.value)}
                            className="w-full border p-2 rounded text-sm mb-2 focus:ring-2 ring-blue-200 outline-none" 
                            placeholder="輸入紀錄..."
                          />
                          <button onClick={() => submitAgent(key)} disabled={isBusy} className="w-full bg-slate-800 text-white py-2 rounded text-sm">
                            {isBusy ? '...' : '送出'}
                          </button>
                        </div>
                      ) : (
                        <div className="text-center text-xs text-gray-400 py-2 bg-gray-50 rounded">等待買方確認...</div>
                      )
                    )}
                    {role === 'buyer' && (
                      step.agentStatus === 'submitted' ? (
                        <div>
                          <p className="text-xs text-gray-500 mb-2">房仲已提交，請核對：</p>
                          <div className="p-2 bg-gray-50 rounded border text-sm mb-2 whitespace-pre-wrap">{step.data.note || '（已提交表單）'}</div>
                          
                          {/* Buyer Note Input */}
                          <textarea 
                              value={inputBuffer}
                              onChange={(e) => setInputBuffer(e.target.value)}
                              className="w-full border p-2 rounded text-sm mb-2 focus:ring-2 ring-green-200 outline-none" 
                              placeholder="留言給房仲 (選填)..."
                          />
                          
                          <button onClick={() => confirmStep(key)} disabled={isBusy} className="w-full bg-green-600 text-white py-2 rounded text-sm">
                            {isBusy ? '...' : '確認無誤並送出'}
                          </button>
                        </div>
                      ) : (
                        <div className="text-center text-xs text-gray-400 py-2">等待房仲提交...</div>
                      )
                    )}
                  </div>
                )}

                {/* Display Buyer Note if exists (for history) */}
                {step.data.buyerNote && (
                    <div className="mt-2 p-2 bg-green-50 rounded border border-green-100 text-xs">
                        <span className="font-bold text-green-700">買方留言：</span> {step.data.buyerNote}
                    </div>
                )}

                {/* Step 5 Actions */}
                {key === '5' && !step.locked && step.paymentStatus === 'pending' && (
                  <div>
                    {role === 'agent' && step.agentStatus === 'pending' && (
                      <button onClick={() => submitAgent('5')} className="w-full bg-slate-800 text-white py-2 rounded">上傳合約並送出</button>
                    )}
                    {role === 'buyer' && step.agentStatus === 'submitted' && (
                      <button onClick={() => confirmStep('5')} className="w-full bg-green-600 text-white py-2 rounded">確認合約 (將啟動付款)</button>
                    )}
                  </div>
                )}

                {/* Supplements */}
                {tx.supplements.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-dashed">
                    {tx.supplements.map((s, i) => (
                      <div key={i} className="text-xs mb-1 p-2 bg-gray-50 rounded border border-gray-100 flex gap-2">
                        <span className="font-bold">{s.role === 'agent' ? '👨‍💼' : '👤'}</span> 
                        <span className="flex-1">{s.content}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Add Supplement */}
        <div className="mt-8 bg-white p-4 rounded-xl shadow-sm border">
          <h4 className="text-xs font-bold text-gray-500 mb-2">📝 新增補充紀錄 (修正/勘誤)</h4>
          <p className="text-[10px] text-gray-400 mb-2">若之前的留言有誤，請在此新增補充說明。已送出的內容無法修改。</p>
          <div className="flex gap-2">
            <input 
              value={supplementInput}
              onChange={(e) => setSupplementInput(e.target.value)}
              className="flex-1 border rounded px-3 py-2 text-sm" 
              placeholder="輸入備註..." 
            />
            <button onClick={addSupplement} disabled={!supplementInput} className="bg-gray-800 text-white px-4 rounded text-sm">送出</button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## 後端 API (Vercel)

### 1. 共用工具 (`api/trust/_utils.ts`)

```typescript
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
}

export const supabase = createClient(supabaseUrl!, supabaseKey!);

export const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) throw new Error("Missing JWT_SECRET env var");

export const SYSTEM_API_KEY = process.env.SYSTEM_API_KEY!;
if (!SYSTEM_API_KEY) throw new Error("Missing SYSTEM_API_KEY env var");

export const TIMEOUTS: Record<number, number> = { 5: 12 * 3600 * 1000 }; // 12 hours

export const createInitialState = (id: string) => ({
    id, currentStep: 1, isPaid: false,
    steps: {
        1: { name: "已電聯", agentStatus: 'pending', buyerStatus: 'pending', data: {}, locked: false },
        2: { name: "已帶看", agentStatus: 'pending', buyerStatus: 'pending', locked: false, data: { risks: { water: false, wall: false, structure: false, other: false } } },
        3: { name: "已出價", agentStatus: 'pending', buyerStatus: 'pending', data: {}, locked: false },
        4: { name: "已斡旋", agentStatus: 'pending', buyerStatus: 'pending', data: {}, locked: false },
        5: { name: "已成交", agentStatus: 'pending', buyerStatus: 'pending', locked: false, paymentStatus: 'pending', paymentDeadline: null },
        6: { name: "已交屋", agentStatus: 'pending', buyerStatus: 'pending', locked: false, checklist: [] }
    },
    supplements: []
});

export async function getTx(id: string) {
    const { data, error } = await supabase
        .from('transactions')
        .select('state')
        .eq('id', id)
        .single();

    if (error || !data) {
        const newState = createInitialState(id);
        await saveTx(id, newState);
        return newState;
    }
    return data.state;
}

export async function saveTx(id: string, state: any) {
    const { error } = await supabase
        .from('transactions')
        .upsert({ id, state, updated_at: new Date().toISOString() });
    if (error) throw error;
}

export async function logAudit(txId: string, action: string, user: any) {
    await supabase.from('audit_logs').insert({
        transaction_id: txId,
        action,
        role: user.role,
        ip: user.ip || 'unknown',
        user_agent: user.agent || 'unknown'
    });
}

export function verifyToken(req: any) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) throw new Error("Unauthorized");

    try {
        const user = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as any;
        return { ...user, ip: req.headers['x-forwarded-for'] || 'unknown', agent: req.headers['user-agent'] };
    } catch (e) {
        throw new Error("Token expired or invalid");
    }
}

export function cors(res: any) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
```

### 2. 狀態查詢 (`api/trust/status.ts`)

```typescript
import { getTx, saveTx, verifyToken, cors } from './_utils';

export default async function handler(req: any, res: any) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    try {
        const user = verifyToken(req);
        const { id } = req.query;
        
        if (user.caseId && user.caseId !== id) {
            return res.status(403).json({ error: "Access denied for this case" });
        }

        const tx = await getTx(id);
        
        // Auto check expiration
        if (tx.steps[5].paymentDeadline && Date.now() > tx.steps[5].paymentDeadline && tx.steps[5].paymentStatus === 'initiated') {
            tx.steps[5].paymentStatus = 'expired';
            await saveTx(id, tx);
        }
        
        res.json(tx);
    } catch (e: any) {
        res.status(e.message === 'Unauthorized' ? 401 : 500).json({ error: e.message });
    }
}
```

### 3. 房仲提交 (`api/trust/submit.ts`)

```typescript
import { getTx, saveTx, logAudit, verifyToken, cors } from './_utils';

export default async function handler(req: any, res: any) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const user = verifyToken(req);
        const { id } = req.query;
        
        if (user.role !== 'agent') return res.status(403).json({ error: "Forbidden" });
        if (user.caseId && user.caseId !== id) return res.status(403).json({ error: "Access denied" });

        const { step, data } = req.body;
        const tx = await getTx(id);
        const stepNum = parseInt(step);
        
        if (stepNum !== tx.currentStep) return res.status(400).json({ error: "Invalid Step" });
        if (tx.steps[stepNum].locked) return res.status(400).json({ error: "Locked" });

        tx.steps[stepNum].data = { ...tx.steps[stepNum].data, ...data };
        tx.steps[stepNum].agentStatus = 'submitted';

        await saveTx(id, tx);
        await logAudit(id, `AGENT_SUBMIT_${step}`, user);
        res.json({ success: true, state: tx });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
}
```

### 4. 買方確認 (`api/trust/confirm.ts`)

```typescript
import { getTx, saveTx, logAudit, verifyToken, cors, TIMEOUTS } from './_utils';

export default async function handler(req: any, res: any) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const user = verifyToken(req);
        const { id } = req.query;

        if (user.role !== 'buyer') return res.status(403).json({ error: "Forbidden" });
        if (user.caseId && user.caseId !== id) return res.status(403).json({ error: "Access denied" });

        const { step } = req.body;
        const stepNum = parseInt(step);
        const tx = await getTx(id);

        if (stepNum !== tx.currentStep) return res.status(400).json({ error: "Invalid Step" });
        if (tx.steps[stepNum].agentStatus !== 'submitted') return res.status(400).json({ error: "Agent not submitted" });
        if (stepNum === 6 && (!tx.isPaid || tx.steps[5].paymentStatus !== 'completed')) return res.status(400).json({ error: "Unpaid" });

        tx.steps[stepNum].buyerStatus = 'confirmed';

        if (stepNum === 5) {
            if (tx.steps[5].paymentStatus === 'pending') {
                tx.steps[5].paymentStatus = 'initiated';
                tx.steps[5].paymentDeadline = Date.now() + TIMEOUTS[5];
            }
        } else if (stepNum === 6) {
             const allChecked = tx.steps[6].checklist.every((i: any) => i.checked);
             if(!allChecked) return res.status(400).json({error: "Checklist incomplete"});
             tx.steps[6].locked = true;
        } else {
            tx.steps[stepNum].locked = true;
            tx.currentStep += 1;
        }

        await saveTx(id, tx);
        await logAudit(id, `BUYER_CONFIRM_${step}`, user);
        res.json({ success: true, state: tx });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
}
```

### 5. 付款處理 (`api/trust/payment.ts`)

```typescript
import { getTx, saveTx, logAudit, verifyToken, cors } from './_utils';

export default async function handler(req: any, res: any) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const user = verifyToken(req);
        const { id } = req.query;

        if (user.role !== 'buyer') return res.status(403).json({ error: "Forbidden" });
        if (user.caseId && user.caseId !== id) return res.status(403).json({ error: "Access denied" });

        const tx = await getTx(id);
        const s5 = tx.steps[5];

        if (s5.buyerStatus !== 'confirmed') return res.status(400).json({ error: "Contract not confirmed" });
        if (s5.paymentStatus !== 'initiated') return res.status(400).json({ error: "Invalid status" });
        if (s5.paymentStatus === 'expired') return res.status(400).json({ error: "Expired" });
        if (Date.now() > s5.paymentDeadline) return res.status(400).json({ error: "Expired" });

        tx.isPaid = true;
        s5.paymentStatus = 'completed';
        s5.locked = true;
        tx.currentStep = 6;

        const risks = tx.steps[2].data.risks || {};
        tx.steps[6].checklist = [
            { id: 'utilities', label: "🚰 水電瓦斯功能正常", checked: false },
            { id: 'security', label: "🪟 門窗鎖具開關正常", checked: false },
            { id: 'keys', label: "🔑 鑰匙門禁卡點交", checked: false },
            { id: 'leak', label: `🧱 驗證房仲承諾：${risks.water ? '有' : '無'}漏水`, checked: false },
            { id: 'wall', label: `🧱 驗證房仲承諾：${risks.wall ? '有' : '無'}壁癌`, checked: false }
        ];

        await saveTx(id, tx);
        await logAudit(id, `PAYMENT_COMPLETED`, user);
        res.json({ success: true, state: tx });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
}
```

### 6. 交屋清單 (`api/trust/checklist.ts`)

```typescript
import { getTx, saveTx, verifyToken, cors } from './_utils';

export default async function handler(req: any, res: any) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const user = verifyToken(req);
        const { id } = req.query;

        if (user.role !== 'buyer') return res.status(403).json({ error: "Forbidden" });
        if (user.caseId && user.caseId !== id) return res.status(403).json({ error: "Access denied" });

        const { itemId, checked } = req.body;
        const tx = await getTx(id);
        if (tx.currentStep !== 6) return res.status(400).json({ error: "Invalid step" });
        
        const item = tx.steps[6].checklist.find((i: any) => i.id === itemId);
        if (item) {
            item.checked = checked;
            await saveTx(id, tx);
            res.json({ success: true, state: tx });
        } else {
            res.status(400).json({ error: "Item not found" });
        }
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
}
```

### 7. 補充紀錄 (`api/trust/supplement.ts`)

```typescript
import { getTx, saveTx, logAudit, verifyToken, cors } from './_utils';

export default async function handler(req: any, res: any) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const user = verifyToken(req);
        const { id } = req.query;
        if (user.caseId && user.caseId !== id) return res.status(403).json({ error: "Access denied" });

        const { content } = req.body;
        if (!content) return res.status(400).json({ error: "Content required" });
        
        const tx = await getTx(id);
        tx.supplements.push({ role: user.role, content: content, timestamp: Date.now() });
        
        await saveTx(id, tx);
        await logAudit(id, 'ADD_SUPPLEMENT', user);
        res.json({ success: true, state: tx });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
}
```

### 8. 登入 API (`api/trust/login.ts`)

```typescript
import { JWT_SECRET, cors } from './_utils';
import jwt from 'jsonwebtoken';

export default async function handler(req: any, res: any) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).end();
    
    try {
        const { role, caseId } = req.body;
        const token = jwt.sign({ role, caseId: caseId || 'demo' }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
}
```

---

## 資料庫 (Supabase)

### SQL Schema (`supabase-trust-schema.sql`)

```sql
-- 交易狀態表
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    state JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 審計日誌表
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id TEXT NOT NULL REFERENCES transactions(id),
    action TEXT NOT NULL,
    role TEXT NOT NULL,
    ip TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_transactions_updated ON transactions(updated_at DESC);
CREATE INDEX idx_audit_logs_tx ON audit_logs(transaction_id);

-- RLS (Row Level Security)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 允許 Service Role 完全存取
CREATE POLICY "Service role full access" ON transactions FOR ALL TO service_role USING (true);
CREATE POLICY "Service role full access" ON audit_logs FOR ALL TO service_role USING (true);
```

---

## 環境變數

請在 Vercel 設定以下變數：

```bash
# Supabase 連線資訊
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx  # 必須使用 Service Role Key

# JWT 密鑰 (用於簽署 Token)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars

# 系統 API Key (選填，用於後端對後端)
SYSTEM_API_KEY=your-system-api-key
```

---

*文件生成時間: 2025-11-26*  
*專案維護者: Mike*
