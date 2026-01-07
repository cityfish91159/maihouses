/**
 * Trust Room 共用型別定義
 * 從 useTrustRoom.ts 抽離,避免與 trustService.ts 產生循環依賴
 */

export interface StepRisks {
  water: boolean;
  wall: boolean;
  structure: boolean;
  other: boolean;
}

export interface StepData {
  note?: string;
  buyerNote?: string;
  risks?: StepRisks;
  [key: string]: string | StepRisks | undefined;
}

export interface Step {
  name: string;
  agentStatus: "pending" | "submitted";
  buyerStatus: "pending" | "confirmed";
  locked: boolean;
  data: StepData;
  paymentStatus?: "pending" | "initiated" | "completed" | "expired";
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
