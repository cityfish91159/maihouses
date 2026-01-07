import type { Transaction, Step, StepData } from '../types/trust';
import { safeSessionStorage } from '../lib/safeStorage';
import { logger } from '../lib/logger';

// --- SERVICE INTERFACE ---
export interface TrustService {
  fetchData: (caseId: string, token: string) => Promise<Transaction | null>;
  submit: (caseId: string, token: string, step: string, data: StepData) => Promise<boolean>;
  confirm: (caseId: string, token: string, step: string, note?: string) => Promise<boolean>;
  payment: (caseId: string, token: string) => Promise<boolean>;
  checklist: (caseId: string, token: string, itemId: string, checked: boolean) => Promise<boolean>;
  supplement: (caseId: string, token: string, content: string) => Promise<boolean>;
  reset: (caseId: string, token: string) => Promise<boolean>;
}

// --- MOCK IMPLEMENTATION ---
const MOCK_TIMEOUTS: Record<number, number> = { 5: 30 * 1000 };

const createMockState = (id: string): Transaction => ({
  id,
  currentStep: 1,
  isPaid: false,
  steps: {
    1: { name: "已電聯", agentStatus: 'pending', buyerStatus: 'pending', data: {}, locked: false },
    2: { name: "已帶看", agentStatus: 'pending', buyerStatus: 'pending', locked: false, data: { risks: { water: false, wall: false, structure: false, other: false } } },
    3: { name: "已出價", agentStatus: 'pending', buyerStatus: 'pending', data: {}, locked: false },
    4: { name: "已斡旋", agentStatus: 'pending', buyerStatus: 'pending', data: {}, locked: false },
    5: { name: "已成交", agentStatus: 'pending', buyerStatus: 'pending', locked: false, paymentStatus: 'pending', paymentDeadline: null, data: {} },
    6: { name: "已交屋", agentStatus: 'pending', buyerStatus: 'pending', locked: false, checklist: [], data: {} }
  },
  supplements: []
});

const getMockTx = (id: string): Transaction => {
  if (typeof window === 'undefined') return createMockState(id);
  // Use sessionStorage to avoid polluting global localStorage and keep it session-based
  const saved = safeSessionStorage.getItem(`mock_tx_${id}`);
  return saved ? JSON.parse(saved) : createMockState(id);
};

const saveMockTx = (tx: Transaction) => {
  if (typeof window !== 'undefined') {
    try {
      safeSessionStorage.setItem(`mock_tx_${tx.id}`, JSON.stringify(tx));
    } catch { }
  }
};

export const mockService = {
  fetchData: async (caseId: string) => {
    return getMockTx(caseId);
  },

  dispatch: async (action: string, caseId: string, role: string, body: Record<string, unknown>): Promise<{ success: boolean; tx?: Transaction; error?: string }> => {
    await new Promise(r => setTimeout(r, 600)); // Simulate delay
    const tx = getMockTx(caseId);
    const newTx = JSON.parse(JSON.stringify(tx)) as Transaction;
    const stepNum = parseInt(String(body.step ?? newTx.currentStep), 10);

    try {
      switch (action) {
        case 'submit':
          if (role !== 'agent') throw new Error("權限不足");
          if (newTx.steps[stepNum]) {
            const submitData = body.data as StepData | undefined;
            newTx.steps[stepNum].data = { ...newTx.steps[stepNum].data, ...submitData };
            newTx.steps[stepNum].agentStatus = 'submitted';
          }
          break;

        case 'confirm':
          if (role !== 'buyer') throw new Error("權限不足");
          if (newTx.steps[stepNum]) {
            newTx.steps[stepNum].buyerStatus = 'confirmed';
            const noteValue = body.note as string | undefined;
            if (noteValue) {
              newTx.steps[stepNum].data = { ...newTx.steps[stepNum].data, buyerNote: noteValue };
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
          if (role !== 'agent') throw new Error("權限不足");
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
            const itemId = body.itemId as string;
            const item = step6.checklist.find(i => i.id === itemId);
            if (item) {
              item.checked = Boolean(body.checked);
            }
          }
          break;

        case 'supplement':
          newTx.supplements.push({
            role,
            content: String(body.content ?? ''),
            timestamp: Date.now()
          });
          break;

        case 'reset':
          const resetState = createMockState(caseId);
          saveMockTx(resetState);
          return { success: true, tx: resetState };
      }
      saveMockTx(newTx);
      return { success: true, tx: newTx };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }
  }
};

// --- REAL IMPLEMENTATION ---
export const realService = {
  fetchData: async (caseId: string, _token: string) => {
    try {
      const res = await fetch(`/api/trust/status?id=${caseId}`);
      if (res.ok) {
        return await res.json();
      }
      if (res.status === 401 || res.status === 403) {
        throw new Error("UNAUTHORIZED");
      }
      return null;
    } catch (e) {
      if (e instanceof Error && e.message === "UNAUTHORIZED") throw e;
      logger.error('Trust service fetch error', { error: e });
      return null;
    }
  },

  dispatch: async (endpoint: string, caseId: string, _token: string, body: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/trust/${endpoint}?id=${caseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (res.status === 401 || res.status === 403) {
        return { success: false, error: "UNAUTHORIZED" };
      }

      const d = await res.json();
      if (d.error) {
        return { success: false, error: d.error };
      } else {
        return { success: true, tx: d.state || d }; // Some APIs return { success: true, state: ... }
      }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }
  }
};
