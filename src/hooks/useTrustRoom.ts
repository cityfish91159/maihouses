import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { mockService, realService } from '../services/trustService';

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

export function useTrustRoom() {
  // States
  const [isMock, setIsMock] = useState(false);
  const [caseId, setCaseId] = useState('');
  const [role, setRole] = useState<'agent' | 'buyer'>('agent');
  const [tx, setTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [timeLeft, setTimeLeft] = useState('--:--:--');

  // Init / Session Check
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const init = async () => {
      // 1. Check URL Token (Legacy/Link support)
      const hash = window.location.hash;
      if (hash.includes('token=')) {
        const t = hash.split('token=')[1];
        try {
          await fetch('/api/trust/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: t })
          });
          window.location.hash = ''; // Clear token from URL
        } catch (e) {
          console.error("Session exchange failed", e);
        }
      }

      // 2. Check Session (Cookie)
      try {
        const res = await fetch('/api/trust/me');
        if (res.ok) {
          const user = await res.json();
          setRole(user.role);
          setCaseId(user.caseId);
          setIsMock(false);
          await fetchData(user.caseId);
        } else {
          // Not logged in
          setLoading(false);
        }
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    };

    init();
  }, []);

  // Mock Mode Toggle
  const startMockMode = useCallback(async () => {
    setIsMock(true);
    const mockId = 'MOCK-DEMO-01';
    setCaseId(mockId);
    setRole('agent');
    const mockTx = await mockService.fetchData(mockId);
    setTx(mockTx);
    toast.success('已進入演示模式 (資料僅暫存於瀏覽器)');
  }, []);

  // Fetch Data
  const fetchData = useCallback(async (id?: string) => {
    const targetId = id || caseId;
    if (!targetId) return;

    setLoading(true);
    try {
      let data;
      if (isMock) {
        data = await mockService.fetchData(targetId);
      } else {
        data = await realService.fetchData(targetId, ''); // Token handled by cookie
      }
      
      if (data) {
        setTx(data);
      } else if (!isMock) {
        // If real mode and no data/error, maybe session expired
        // But we handle that in init mostly.
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [isMock, caseId]);

  // Polling
  useEffect(() => {
    if (!isMock && caseId) {
      const interval = setInterval(() => fetchData(), 5000);
      return () => clearInterval(interval);
    }
  }, [caseId, isMock, fetchData]);

  // Payment Timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (tx?.steps?.[5]?.paymentStatus === 'initiated' && tx.steps[5].paymentDeadline) {
        const diff = tx.steps[5].paymentDeadline - Date.now();
        if (diff <= 0) {
          setTimeLeft("已逾期");
          if (isMock) {
             // Mock auto-expire logic could be moved to service, but simple UI update here is fine for now
             // Actually, let's just refresh data or handle it in service next time
          } else {
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

    const service = isMock ? mockService : realService;
    // For mock service, we map endpoint names to dispatch action
    // For real service, we pass endpoint name directly
    
    let result;
    if (isMock) {
        result = await mockService.dispatch(endpoint, caseId, role, body);
    } else {
        result = await realService.dispatch(endpoint, caseId, '', body);
    }

    if (result.success) {
        if (result.tx) setTx(result.tx); // Update local state immediately if returned
        await fetchData(); // Refresh to be sure
        toast.success('成功');
        setIsBusy(false);
        return true;
    } else {
        toast.error(result.error || '操作失敗');
        setIsBusy(false);
        return false;
    }
  }, [isMock, caseId, role, fetchData, isBusy]);

  return {
    isMock,
    caseId,
    setCaseId,
    role,
    setRole,
    setToken: () => {}, // Deprecated but kept for interface compatibility if needed
    token: '', // Deprecated
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
