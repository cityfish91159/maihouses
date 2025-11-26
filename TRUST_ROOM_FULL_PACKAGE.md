# 安心留痕 (Trust Room) 完整代碼打包

> **版本**: V10 Demo Mode  
> **最後更新**: 2025-11-26  
> **專案**: MaiHouses (邁房子)

---

## 📋 目錄

1. [功能概述](#功能概述)
2. [線上網址](#線上網址)
3. [前端代碼](#前端代碼)
4. [後端 API 代碼](#後端-api-代碼)
5. [資料庫 Schema](#資料庫-schema)
6. [環境變數](#環境變數)
7. [部署說明](#部署說明)

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

### 演示模式 (Demo Mode)
- 無需後端、無需資料庫、無需登入
- 純前端模擬完整流程
- 可切換「房仲」與「買方」角色

---

## 線上網址

### Trust Room 主頁面
```
https://maihouses.vercel.app/maihouses/assure
```

### UAG 後台（含 Trust Room 入口）
```
https://maihouses.vercel.app/maihouses/uag
```

---

## 前端代碼

### 檔案位置
```
src/pages/Assure/Detail.tsx
```

### 完整代碼

```tsx
import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Phone, ClipboardCheck, HandCoins, MessageSquare, FileSignature, Home, Lock, Check, RotateCcw, Info, User, Briefcase, Zap } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

// --- MOCK DATA & UTILS (內建模擬數據，不依賴後端) ---
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

// Types
interface Step {
  name: string
  agentStatus: 'pending' | 'submitted'
  buyerStatus: 'pending' | 'confirmed'
  locked: boolean
  data: any
  paymentStatus?: 'pending' | 'initiated' | 'completed' | 'expired'
  paymentDeadline?: number | null
  checklist?: { label: string; checked: boolean }[]
}

interface Transaction {
  id: string
  currentStep: number
  isPaid: boolean
  steps: Record<string, Step>
  supplements: { role: string; content: string; timestamp: number }[]
}

export default function AssureDetail() {
  const location = useLocation()
  
  // States
  const [isMock, setIsMock] = useState(false) // 核心：Mock模式開關
  const [caseId, setCaseId] = useState('')
  const [role, setRole] = useState<'agent' | 'buyer'>('agent')
  const [token, setToken] = useState('')
  const [tx, setTx] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  
  // Inputs
  const [inputBuffer, setInputBuffer] = useState('')
  const [supplementInput, setSupplementInput] = useState('')
  const [timeLeft, setTimeLeft] = useState('--:--:--')
  
  // Dev Helper
  const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('127.0.0.1')

  // 初始化：檢查 Token 或 啟動 Mock
  useEffect(() => {
    const hash = location.hash
    let t = ''
    
    // 1. 嘗試從 URL Hash 獲取 Token
    if (hash.includes('token=')) {
      t = hash.split('token=')[1] ?? ''
      localStorage.setItem('mh_token', t)
      window.location.hash = ''
    } else {
      t = localStorage.getItem('mh_token') || ''
    }

    // 2. 如果有 Token，走正常流程
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
        localStorage.removeItem('mh_token') // 清除無效 Token
      }
    } 
    // 3. 如果沒 Token 且是本地開發，自動登入演示帳號
    else if (isDev) {
        // 本地開發依然可以走 API 測試
        setCaseId('demo-v10')
        // devLogin('agent', 'demo-v10') // 暫時註解，改用 Mock 優先
    }
  }, [location, isDev])

  // Mock 模式切換邏輯
  const startMockMode = () => {
    setIsMock(true)
    setCaseId('MOCK-DEMO-01')
    setRole('agent')
    setTx(createMockState('MOCK-DEMO-01'))
    toast.success('已進入演示模式 (資料僅暫存於瀏覽器)')
  }

  // 統一的數據獲取 (分辨 Real API vs Mock)
  const fetchData = async () => {
    if (isMock) return // Mock 模式不需要 fetch，數據在本地 state
    if (!token || !caseId) return

    setLoading(true)
    try {
      const res = await fetch(`/api/trust/status?id=${caseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setTx(data)
      } else {
        if (res.status === 401 || res.status === 403) toast.error('憑證失效，請重新登入')
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  // 定時輪詢 (僅在非 Mock 模式下)
  useEffect(() => {
    if (!isMock && token && caseId) {
      fetchData()
      const interval = setInterval(fetchData, 5000)
      return () => clearInterval(interval)
    }
  }, [token, caseId, isMock])

  // 付款倒數計時器
  useEffect(() => {
    const timer = setInterval(() => {
      if (tx?.steps?.[5]?.paymentStatus === 'initiated' && tx.steps[5].paymentDeadline) {
        const diff = tx.steps[5].paymentDeadline - Date.now()
        if (diff <= 0) {
            setTimeLeft("已逾期")
            // Mock 模式下自動處理過期
            if (isMock) {
                setTx(prev => {
                    if (!prev) return null
                    const next = {...prev}
                    if (next.steps[5]) {
                        next.steps[5].paymentStatus = 'expired'
                    }
                    return next
                })
            }
        } else {
          const h = Math.floor(diff / 3600000)
          const m = Math.floor((diff % 3600000) / 60000)
          const s = Math.floor((diff % 60000) / 1000)
          setTimeLeft(`${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`)
        }
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [tx, isMock])

  // 核心動作處理器 (支援 Real API 與 Mock Logic)
  const action = async (endpoint: string, body: any = {}) => {
    if (isBusy) return
    setIsBusy(true)

    // --- MOCK MODE LOGIC (模擬後端行為) ---
    if (isMock) {
        await new Promise(r => setTimeout(r, 600)); // 假裝延遲
        
        if (!tx) return;
        const newTx = JSON.parse(JSON.stringify(tx)) as Transaction; // Deep Clone
        const stepNum = parseInt(body.step || tx.currentStep);
        
        // Ensure step exists
        if (!newTx.steps[stepNum]) {
             toast.error("Invalid step");
             setIsBusy(false);
             return;
        }

        try {
            switch(endpoint) {
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
                        // Save buyer's note if provided
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
                        // 交屋檢查
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
                     // 生成交屋清單
                     if (newTx.steps[6]) {
                        newTx.steps[6].checklist = [
                            { label: "🚰 水電瓦斯功能正常", checked: false },
                            { label: "🪟 門窗鎖具開關正常", checked: false },
                            { label: "🔑 鑰匙門禁卡點交", checked: false },
                            { label: "🧱 房屋現況確認 (漏水/壁癌等)", checked: false }
                        ];
                     }
                    break;
                
                case 'checklist':
                    const step6 = newTx.steps[6];
                    if (step6 && step6.checklist) {
                        const item = step6.checklist[body.index];
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
                    setTx(createMockState(caseId));
                    toast.success('已重置 (Mock)');
                    setIsBusy(false);
                    return;
            }
            setTx(newTx);
            toast.success('操作成功 (Mock)');
            setInputBuffer('');
            setSupplementInput('');
        } catch(e: any) {
            toast.error(e.message);
        }
        setIsBusy(false);
        return;
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
      })
      const d = await res.json()
      if (d.error) {
        toast.error(d.error)
      } else {
        setInputBuffer('')
        setSupplementInput('')
        await fetchData()
        toast.success('成功')
      }
    } catch (e: any) {
      toast.error(e.message)
    }
    setIsBusy(false)
  }

  // Actions wrappers
  const submitAgent = (step: string) => action('submit', { step, data: { note: inputBuffer } })
  const confirmStep = (step: string) => action('confirm', { step, note: inputBuffer })
  const pay = () => { if (confirm('確認模擬付款？')) action('payment') }
  const toggleCheck = (index: number, checked: boolean) => { if (role === 'buyer') action('checklist', { index, checked }) }
  const addSupplement = () => action('supplement', { content: supplementInput })
  const reset = () => { if (confirm('重置所有進度？')) action('reset') }
  
  const toggleRole = () => {
      // Mock 模式下直接切換
      const newRole = role === 'agent' ? 'buyer' : 'agent'
      setRole(newRole)
      toast('切換身份為: ' + (newRole === 'agent' ? '房仲' : '買方'), { icon: newRole === 'agent' ? '👨‍💼' : '👤' })
  }

  // --- RENDERING ---

  // 1. 如果沒有資料且不在 Loading，顯示 Mock 入口
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
            {/* 總是顯示重置與切換角色按鈕，方便測試 */}
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

                {/* Step 2: Viewing (Replaced Risks with Note) */}
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
                        className={`w-full text-white font-bold py-2 rounded shadow transition ${timeLeft === '已逾期' ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-orange-500 to-red-500 hover:shadow-lg'}`}
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
                    {step.checklist?.map((item, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => toggleCheck(idx, !item.checked)} 
                        className={`flex items-center p-3 border rounded transition cursor-pointer ${item.checked ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-gray-50'}`}
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

## 後端 API 代碼

### 檔案結構
```
api/trust/
├── _utils.ts       # 共用工具函數
├── status.ts       # 獲取交易狀態
├── submit.ts       # 房仲提交
├── confirm.ts      # 買方確認
├── payment.ts      # 付款處理
├── checklist.ts    # 交屋清單
├── supplement.ts   # 補充紀錄
├── reset.ts        # 重置交易
├── login.ts        # 開發登入
└── token.ts        # 系統發行 Token
```

### _utils.ts (共用工具)

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
        const user = jwt.verify(token, JWT_SECRET) as any;
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

### status.ts

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

### submit.ts

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

### confirm.ts

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

### payment.ts

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
        if (Date.now() > s5.paymentDeadline) return res.status(400).json({ error: "Expired" });

        tx.isPaid = true;
        s5.paymentStatus = 'completed';
        s5.locked = true;
        tx.currentStep = 6;

        const risks = tx.steps[2].data.risks || {};
        tx.steps[6].checklist = [
            { label: "🚰 水電瓦斯功能正常", checked: false },
            { label: "🪟 門窗鎖具開關正常", checked: false },
            { label: "🔑 鑰匙門禁卡點交", checked: false },
            { label: `🧱 驗證房仲承諾：${risks.water ? '有' : '無'}漏水`, checked: false },
            { label: `🧱 驗證房仲承諾：${risks.wall ? '有' : '無'}壁癌`, checked: false }
        ];

        await saveTx(id, tx);
        await logAudit(id, `PAYMENT_COMPLETED`, user);
        res.json({ success: true, state: tx });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
}
```

### checklist.ts

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

        const { index, checked } = req.body;
        const tx = await getTx(id);
        if (tx.currentStep !== 6) return res.status(400).json({ error: "Invalid step" });
        
        tx.steps[6].checklist[index].checked = checked;
        await saveTx(id, tx);
        res.json({ success: true, state: tx });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
}
```

### supplement.ts

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

### reset.ts

```typescript
import { createInitialState, saveTx, verifyToken, cors } from './_utils';

export default async function handler(req: any, res: any) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const user = verifyToken(req);
        const { id } = req.query;
        
        if (user.caseId && user.caseId !== id) return res.status(403).json({ error: "Access denied" });

        await saveTx(id, createInitialState(id));
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
}
```

### login.ts (開發用)

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

### token.ts (系統用)

```typescript
import { JWT_SECRET, SYSTEM_API_KEY, cors } from './_utils';
import jwt from 'jsonwebtoken';

export default async function handler(req: any, res: any) {
    cors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const { apiKey, caseId, role } = req.body;
        if (apiKey !== SYSTEM_API_KEY) return res.status(403).json({ error: "Forbidden" });
        
        const token = jwt.sign({ role, caseId }, JWT_SECRET, { expiresIn: '12h' });
        res.json({ token });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
}
```

---

## UAG 入口元件

### 檔案位置
```
src/pages/UAG/components/TrustFlow.tsx
```

### 完整代碼

```tsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../UAG.module.css';

export default function TrustFlow() {
  return (
    <section className={`${styles['uag-card']} ${styles['k-span-3']}`}>
      <div className={styles['uag-card-header']}>
        <div className={styles['uag-card-title']}>安心流程管理</div>
        <div className={styles['uag-card-sub']}>五階段・交易留痕</div>
      </div>
      <div className={styles['card-body']}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '8px', marginBottom: '8px' }}>
          <div style={{ textAlign: 'center' }}><div className={styles['flow-stage']} style={{ background: '#16a34a', color: '#fff' }}>✓</div><div className="small" style={{ fontWeight: 700, color: '#16a34a' }}>M1 接洽</div></div>
          <div style={{ textAlign: 'center' }}><div className={styles['flow-stage']} style={{ background: '#16a34a', color: '#fff' }}>✓</div><div className="small" style={{ fontWeight: 700, color: '#16a34a' }}>M2 帶看</div></div>
          <div style={{ textAlign: 'center' }}><div className={styles['flow-stage']} style={{ background: '#1749d7', color: '#fff' }}>●</div><div className="small" style={{ fontWeight: 700, color: '#1749d7' }}>M3 出價</div></div>
          <div style={{ textAlign: 'center' }}><div className={styles['flow-stage']} style={{ background: '#e5e7eb', color: '#6b7280' }}>・</div><div className="small" style={{ color: '#6b7a90' }}>M4 簽約</div></div>
          <div style={{ textAlign: 'center' }}><div className={styles['flow-stage']} style={{ background: '#e5e7eb', color: '#6b7280' }}>・</div><div className="small" style={{ color: '#6b7a90' }}>M5 交屋</div></div>
        </div>
        <div className="timeline-wrap">
          <div className="timeline-header" style={{ display: 'grid', gridTemplateColumns: '90px 1fr 96px', gap: 0, padding: '8px 12px', fontSize: '13px' }}>
            <div>時間</div><div>事件與參與者</div><div>留痕</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 96px', alignItems: 'start', borderBottom: '1px solid var(--line-soft)', padding: '8px 12px' }}>
            <div className="small">10/30 22:10</div>
            <div><div className="small" style={{ color: 'var(--ink-100)' }}><b>M1 初次接洽建立</b>｜買方 A103</div><div className="small" style={{ color: 'var(--ink-300)' }}>房源：惠宇上晴 12F</div></div>
            <div><div className={styles['uag-badge']} style={{ fontSize: '10px' }}>hash: 9f2a…</div></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 96px', alignItems: 'start', borderBottom: '1px solid var(--line-soft)', padding: '8px 12px' }}>
            <div className="small">10/31 09:20</div>
            <div><div className="small" style={{ color: 'var(--ink-100)' }}><b>M2 帶看雙方到場</b>｜買方 A103</div><div className="small" style={{ color: 'var(--ink-300)' }}>GeoTag: 南屯社區大廳</div></div>
            <div><div className={styles['uag-badge']} style={{ fontSize: '10px' }}>sig: b7aa…</div></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 96px', alignItems: 'start', background: '#fefce8', padding: '8px 12px' }}>
            <div className="small">10/31 10:40</div>
            <div><div className="small" style={{ color: 'var(--ink-100)' }}><b>M3 買方出價</b>｜買方 A103</div><div className="small" style={{ color: 'var(--ink-300)' }}>出價 NT$31,500,000</div></div>
            <div><div className={styles['uag-badge']} style={{ fontSize: '10px', background: '#fef3c7', color: '#92400e', border: '1px solid #f6d88a' }}>hash: 1a7c…</div></div>
          </div>
        </div>
        <div style={{ padding: '12px', borderTop: '1px solid var(--line-soft)', textAlign: 'center' }}>
            <Link to="/assure" className={`${styles['uag-btn']} ${styles['primary']}`} style={{ width: '100%', display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                進入安心留痕 (Trust Room)
            </Link>
        </div>
      </div>
    </section>
  );
}
```

---

## 資料庫 Schema

### SQL 建表語句

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
CREATE POLICY "Service role full access" ON transactions FOR ALL USING (true);
CREATE POLICY "Service role full access" ON audit_logs FOR ALL USING (true);
```

---

## 環境變數

### Vercel 環境變數設定

```bash
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx

# JWT
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars

# System API Key (用於後端對後端)
SYSTEM_API_KEY=your-system-api-key
```

---

## 部署說明

### 1. 前端部署 (Vercel)

已自動部署，推送到 `main` 分支即可。

### 2. 資料庫設定 (Supabase)

1. 登入 Supabase Dashboard
2. 進入 SQL Editor
3. 執行上方的 SQL 建表語句
4. 複製 URL 和 Service Role Key 到 Vercel 環境變數

### 3. 環境變數設定

在 Vercel Dashboard → Settings → Environment Variables 設定所需變數。

---

## 路由設定

### App.tsx 路由配置

```tsx
<Route
  path="/maihouses/trust/room"
  element={
    <ErrorBoundary>
      <AssureDetail />
    </ErrorBoundary>
  }
/>
<Route
  path="/assure"
  element={
    <ErrorBoundary>
      <AssureDetail />
    </ErrorBoundary>
  }
/>
```

---

## 依賴套件

### 前端 (package.json)

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",
    "lucide-react": "^0.x",
    "react-hot-toast": "^2.x"
  }
}
```

### 後端 (Vercel Serverless)

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.x",
    "jsonwebtoken": "^9.x"
  }
}
```

---

*文件生成時間: 2025-11-26*  
*專案維護者: Mike*
