export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface JournalItem {
  id: string;
  text: string;
  tags: string[];
  hours?: number | null;
}

export interface NoteBlock {
  id: string;
  title: string;
  content: string;
}

export interface DailyEntry {
  yesterday: JournalItem[];
  today: JournalItem[];
  blockers: JournalItem[];
  notes: NoteBlock[];
}

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'sa', name: 'SA', color: '#4B6455' },
  { id: 'sd', name: 'SD', color: '#7A5C3E' },
  { id: 'sp', name: 'SP', color: '#3E5A7A' },
  { id: 'meeting', name: 'Meeting', color: '#8A4B5C' },
];

export function emptyEntry(): DailyEntry {
  return { yesterday: [], today: [], blockers: [], notes: [] };
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function emptyItem(text = ''): JournalItem {
  return { id: uid(), text, tags: [] };
}

export function todayStr(): string {
  const d = new Date();
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

export function weekdayStr(dateStr: string): string {
  const days = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
  const d = new Date(dateStr + 'T00:00:00');
  return days[d.getDay()];
}
