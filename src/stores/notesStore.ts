import { safeLocalStorage } from '../lib/safeStorage';

export type NoteItem = {
  id: string;
  createdAt: number;
  note: string;
  echo?: string;
};
const KEY = 'mai-notes-v1';
// [NASA TypeScript Safety] 類型守衛驗證 NoteItem
function isNoteItem(obj: unknown): obj is NoteItem {
  if (typeof obj !== 'object' || obj === null) return false;
  const record = obj as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.createdAt === 'number' &&
    typeof record.note === 'string'
  );
}

function loadAll(): NoteItem[] {
  try {
    const raw = safeLocalStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    // [NASA TypeScript Safety] 使用類型守衛取代 as NoteItem[]
    if (Array.isArray(parsed)) {
      return parsed.filter(isNoteItem);
    }
    return [];
  } catch {
    return [];
  }
}
function saveAll(items: NoteItem[]) {
  try {
    safeLocalStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
}
export function addNote(note: string, echo?: string): NoteItem {
  const items = loadAll();
  const item: NoteItem = {
    id: Math.random().toString(36).slice(2),
    createdAt: Date.now(),
    note,
    ...(echo && { echo }),
  };
  items.unshift(item);
  saveAll(items);
  return item;
}
export function listNotes(): NoteItem[] {
  return loadAll();
}
export function clearNotes() {
  saveAll([]);
}
