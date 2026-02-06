import type { Transaction, Step, StepData } from '../types/trust';
import { safeSessionStorage } from '../lib/safeStorage';
import { logger } from '../lib/logger';

// [NASA TypeScript Safety] Type Guard 驗證 Step 結構
function isValidStep(obj: unknown): obj is Step {
  if (typeof obj !== 'object' || obj === null) return false;
  const step = obj as Record<string, unknown>;
  return (
    typeof step.name === 'string' &&
    (step.agentStatus === 'pending' || step.agentStatus === 'submitted') &&
    (step.buyerStatus === 'pending' || step.buyerStatus === 'confirmed') &&
    typeof step.locked === 'boolean' &&
    typeof step.data === 'object' &&
    step.data !== null
  );
}

// [NASA TypeScript Safety] Type Guard 驗證 Transaction 結構
function isValidTransaction(obj: unknown): obj is Transaction {
  if (typeof obj !== 'object' || obj === null) return false;
  const tx = obj as Record<string, unknown>;

  if (
    typeof tx.id !== 'string' ||
    typeof tx.currentStep !== 'number' ||
    typeof tx.isPaid !== 'boolean' ||
    typeof tx.steps !== 'object' ||
    tx.steps === null ||
    !Array.isArray(tx.supplements)
  ) {
    return false;
  }

  // 驗證每個 step
  const steps = tx.steps as Record<string, unknown>;
  for (const key of Object.keys(steps)) {
    if (!isValidStep(steps[key])) return false;
  }

  // 驗證 supplements 陣列元素
  for (const supplement of tx.supplements) {
    if (typeof supplement !== 'object' || supplement === null) return false;
    const s = supplement as Record<string, unknown>;
    if (
      typeof s.role !== 'string' ||
      typeof s.content !== 'string' ||
      typeof s.timestamp !== 'number'
    ) {
      return false;
    }
  }

  return true;
}

// [NASA TypeScript Safety] Type Guard 驗證 dispatch body
interface ValidatedDispatchBody {
  step?: string | number;
  data?: StepData;
  note?: string;
  itemId?: string;
  checked?: boolean;
  content?: string;
}

function isValidDispatchBody(obj: unknown): obj is ValidatedDispatchBody {
  if (typeof obj !== 'object' || obj === null) return false;
  const body = obj as Record<string, unknown>;

  // 所有欄位都是可選的，但如果存在則必須是正確的類型
  if (body.step !== undefined) {
    if (typeof body.step !== 'string' && typeof body.step !== 'number') {
      return false;
    }
  }
  if (body.data !== undefined && typeof body.data !== 'object') return false;
  if (body.note !== undefined && typeof body.note !== 'string') return false;
  if (body.itemId !== undefined && typeof body.itemId !== 'string') return false;
  if (body.checked !== undefined && typeof body.checked !== 'boolean') {
    return false;
  }
  if (body.content !== undefined && typeof body.content !== 'string') {
    return false;
  }

  return true;
}

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
      data: {},
    },
    6: {
      name: '已交屋',
      agentStatus: 'pending',
      buyerStatus: 'pending',
      locked: false,
      checklist: [],
      data: {},
    },
  },
  supplements: [],
});

const getMockTx = (id: string): Transaction => {
  if (typeof window === 'undefined') return createMockState(id);
  // Use sessionStorage to avoid polluting global localStorage and keep it session-based
  const saved = safeSessionStorage.getItem(`mock_tx_${id}`);
  if (!saved) return createMockState(id);

  // [NASA TypeScript Safety] 使用 Type Guard 驗證 JSON 資料
  try {
    const parsed: unknown = JSON.parse(saved);
    if (isValidTransaction(parsed)) {
      return parsed;
    }
    logger.error('Invalid transaction data from storage', {
      id,
      parsed,
    });
    return createMockState(id);
  } catch (e) {
    logger.error('Failed to parse transaction JSON', { error: e });
    return createMockState(id);
  }
};

const saveMockTx = (tx: Transaction) => {
  if (typeof window !== 'undefined') {
    try {
      safeSessionStorage.setItem(`mock_tx_${tx.id}`, JSON.stringify(tx));
    } catch {}
  }
};

export const mockService = {
  fetchData: async (caseId: string) => {
    return getMockTx(caseId);
  },

  dispatch: async (
    action: string,
    caseId: string,
    role: string,
    body: Record<string, unknown>
  ): Promise<{ success: boolean; tx?: Transaction; error?: string }> => {
    await new Promise((r) => setTimeout(r, 600)); // Simulate delay
    const tx = getMockTx(caseId);

    // [NASA TypeScript Safety] 使用 Type Guard 驗證後深拷貝
    const txCopy: unknown = JSON.parse(JSON.stringify(tx));
    if (!isValidTransaction(txCopy)) {
      logger.error('Invalid transaction structure during dispatch', {
        caseId,
      });
      return { success: false, error: 'Invalid transaction structure' };
    }
    const newTx = txCopy;

    // [NASA TypeScript Safety] 驗證 body 參數
    if (!isValidDispatchBody(body)) {
      logger.error('Invalid dispatch body', {
        body,
      });
      return { success: false, error: 'Invalid request body' };
    }
    const validatedBody = body;

    const stepNum = parseInt(String(validatedBody.step ?? newTx.currentStep), 10);

    try {
      switch (action) {
        case 'submit':
          if (role !== 'agent') throw new Error('權限不足');
          if (newTx.steps[stepNum]) {
            // [NASA TypeScript Safety] 已透過 Type Guard 驗證 body.data
            const submitData = validatedBody.data;
            if (submitData && typeof submitData === 'object') {
              newTx.steps[stepNum].data = {
                ...newTx.steps[stepNum].data,
                ...submitData,
              };
            }
            newTx.steps[stepNum].agentStatus = 'submitted';
          }
          break;

        case 'confirm':
          if (role !== 'buyer') throw new Error('權限不足');
          if (newTx.steps[stepNum]) {
            newTx.steps[stepNum].buyerStatus = 'confirmed';
            // [NASA TypeScript Safety] 已透過 Type Guard 驗證 body.note
            const noteValue = validatedBody.note;
            if (typeof noteValue === 'string' && noteValue) {
              newTx.steps[stepNum].data = {
                ...newTx.steps[stepNum].data,
                buyerNote: noteValue,
              };
            }
          }

          if (stepNum === 5) {
            if (newTx.steps[5]) {
              newTx.steps[5].paymentStatus = 'initiated';
              newTx.steps[5].paymentDeadline = Date.now() + (MOCK_TIMEOUTS[5] || 30000);
            }
          } else if (stepNum === 6) {
            const allChecked = newTx.steps[6]?.checklist?.every((i) => i.checked);
            if (!allChecked) throw new Error('檢查項目未完成');
            if (newTx.steps[6]) newTx.steps[6].locked = true;
          } else {
            if (newTx.steps[stepNum]) newTx.steps[stepNum].locked = true;
            newTx.currentStep += 1;
          }
          break;

        case 'payment':
          if (role !== 'agent') throw new Error('權限不足');
          if (newTx.steps[5]?.paymentStatus !== 'initiated') throw new Error('非付款狀態');
          newTx.isPaid = true;
          if (newTx.steps[5]) {
            newTx.steps[5].paymentStatus = 'completed';
            newTx.steps[5].locked = true;
          }
          newTx.currentStep = 6;
          if (newTx.steps[6]) {
            newTx.steps[6].checklist = [
              { id: 'utilities', label: '🚰 水電瓦斯功能正常', checked: false },
              { id: 'security', label: '🪟 門窗鎖具開關正常', checked: false },
              { id: 'keys', label: '🔑 鑰匙門禁卡點交', checked: false },
              {
                id: 'condition',
                label: '🧱 房屋現況確認 (漏水/壁癌等)',
                checked: false,
              },
            ];
          }
          break;

        case 'checklist': {
          const step6 = newTx.steps[6];
          if (step6 && step6.checklist) {
            // [NASA TypeScript Safety] 已透過 Zod 驗證 body.itemId
            const itemId = validatedBody.itemId;
            if (itemId) {
              const item = step6.checklist.find((i) => i.id === itemId);
              if (item) {
                item.checked = Boolean(validatedBody.checked);
              }
            }
          }
          break;
        }

        case 'supplement':
          newTx.supplements.push({
            role,
            content: String(validatedBody.content ?? ''),
            timestamp: Date.now(),
          });
          break;

        case 'reset': {
          const resetState = createMockState(caseId);
          saveMockTx(resetState);
          return { success: true, tx: resetState };
        }
      }
      saveMockTx(newTx);
      return { success: true, tx: newTx };
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error',
      };
    }
  },
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
        throw new Error('UNAUTHORIZED');
      }
      return null;
    } catch (e) {
      if (e instanceof Error && e.message === 'UNAUTHORIZED') throw e;
      logger.error('Trust service fetch error', { error: e });
      return null;
    }
  },

  dispatch: async (
    endpoint: string,
    caseId: string,
    _token: string,
    body: Record<string, unknown>
  ) => {
    try {
      const res = await fetch(`/api/trust/${endpoint}?id=${caseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (res.status === 401 || res.status === 403) {
        return { success: false, error: 'UNAUTHORIZED' };
      }

      const d = await res.json();
      if (d.error) {
        return { success: false, error: d.error };
      } else {
        return { success: true, tx: d.state || d }; // Some APIs return { success: true, state: ... }
      }
    } catch (e) {
      return {
        success: false,
        error: e instanceof Error ? e.message : 'Unknown error',
      };
    }
  },
};
