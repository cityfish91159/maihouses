export type NoteItem = {
  id: string;
  createdAt: number;
  note: string;
  echo?: string;
};
const KEY = "mai-notes-v1";
function loadAll(): NoteItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as NoteItem[];
  } catch {
    return [];
  }
}
function saveAll(items: NoteItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
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
export function listNotes(): NoteItem[] { return loadAll(); }
export function clearNotes() { saveAll([]); }
