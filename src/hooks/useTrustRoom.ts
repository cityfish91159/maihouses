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
  checklist?: { label: string; checked: boolean }[];
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

      // Ensure step exists
      if (!newTx.steps[stepNum]) {
        // Some actions like 'reset' or 'supplement' might not need step validation in the same way, 
        // but for flow actions it's needed.
        // We'll handle specific endpoints below.
      }

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
