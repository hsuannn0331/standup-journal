import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useEntries } from './hooks/useEntries';
import { useCategories } from './hooks/useCategories';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { ItemList } from './components/ItemList';
import { NotesSection } from './components/NotesSection';
import { CategoryModal } from './components/CategoryModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { DailyEntry, JournalItem, NoteBlock, emptyItem, todayStr, weekdayStr, uid } from './types';

export default function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const [currentDate, setCurrentDate] = useState(todayStr());
  const { entry, setEntry, loading: entryLoading, loadEntry, listEntryDates, deleteEntry } =
    useEntries(user?.uid ?? null, currentDate);
  const { categories, saveCategories } = useCategories(user?.uid ?? null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [blockersCollapsed, setBlockersCollapsed] = useState(false);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [historyEntries, setHistoryEntries] = useState<{ date: string; entry: DailyEntry }[]>([]);

  // Load history list (dates + entries) whenever the current entry changes
  useEffect(() => {
    if (!user) return;
    (async () => {
      const dates = await listEntryDates();
      const set = new Set(dates);
      set.add(currentDate);
      const sorted = [...set].sort().reverse();
      const items = await Promise.all(
        sorted.map(async (date) => {
          const e = date === currentDate ? entry : await loadEntry(date);
          return { date, entry: e ?? { yesterday: [], today: [], blockers: [], notes: [] } };
        })
      );
      setHistoryEntries(items);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentDate, entry]);

  const hoursTotal = useMemo(() => {
    return entry.yesterday.reduce((sum, i) => sum + (typeof i.hours === 'number' ? i.hours : 0), 0);
  }, [entry.yesterday]);

  if (authLoading) {
    return <div className="loading-screen">載入中…</div>;
  }

  if (!user) {
    return <Login />;
  }

  const patchEntry = (patch: Partial<DailyEntry>) => {
    setEntry({ ...entry, ...patch });
  };

  const addItem = (listName: 'yesterday' | 'today' | 'blockers') => {
    const newItem = emptyItem();
    patchEntry({ [listName]: [...entry[listName], newItem] } as Partial<DailyEntry>);
    setEditingId(newItem.id);
    if (listName === 'blockers' && blockersCollapsed) setBlockersCollapsed(false);
  };

  const addNote = () => {
    const newNote: NoteBlock = { id: uid(), title: '', content: '' };
    patchEntry({ notes: [...entry.notes, newNote] });
    setEditingId(newNote.id);
  };

  const switchToDate = async (date: string) => {
    setCurrentDate(date);
    setEditingId(null);
  };

  const requestDeleteEntry = (date: string) => {
    setConfirm({
      message: `刪除「${date}」的紀錄後將無法復原,確定要刪除嗎?`,
      onConfirm: async () => {
        await deleteEntry(date);
        setConfirm(null);
        if (date === currentDate) {
          const dates = await listEntryDates();
          const next = dates.find((d) => d !== date) || todayStr();
          switchToDate(next);
        }
      },
    });
  };

  return (
    <div className="app">
      <Sidebar
        currentDate={currentDate}
        categories={categories}
        historyEntries={historyEntries}
        onSwitchDate={switchToDate}
        onNewToday={() => switchToDate(todayStr())}
        onOpenCategoryModal={() => setCatModalOpen(true)}
        onRequestDeleteEntry={requestDeleteEntry}
        userEmail={user.email}
        onLogout={logout}
      />

      <div className="main">
        <div className="date-header">
          <h2>{currentDate}</h2>
          <span className="weekday">{weekdayStr(currentDate)}</span>
        </div>
        <div className="save-state">{entryLoading ? '載入中…' : ''}</div>

        <section className="block">
          <div className="block-title">
            昨天完成{' '}
            {hoursTotal > 0 && (
              <span
                className="hours-total"
                style={{ color: hoursTotal >= 6 ? '#5C7A64' : '#B5726A' }}
              >
                共 {Math.round(hoursTotal * 100) / 100} 小時
              </span>
            )}
          </div>
          <ItemList
            listName="yesterday"
            items={entry.yesterday}
            categories={categories}
            editingId={editingId}
            setEditingId={setEditingId}
            onChange={(items) => patchEntry({ yesterday: items })}
            onRequestDelete={(message, onConfirmed) => setConfirm({ message, onConfirm: () => { onConfirmed(); setConfirm(null); } })}
          />
          <button className="add-item-btn" onClick={() => addItem('yesterday')}>
            + 新增項目
          </button>
        </section>

        <section className="block">
          <div className="block-title">今天計劃</div>
          <ItemList
            listName="today"
            items={entry.today}
            categories={categories}
            editingId={editingId}
            setEditingId={setEditingId}
            onChange={(items) => patchEntry({ today: items })}
            onRequestDelete={(message, onConfirmed) => setConfirm({ message, onConfirm: () => { onConfirmed(); setConfirm(null); } })}
          />
          <button className="add-item-btn" onClick={() => addItem('today')}>
            + 新增項目
          </button>
        </section>

        <section className={'block' + (blockersCollapsed ? ' collapsed' : '')}>
          <div className="block-title">
            困難點
            <button className="toggle" onClick={() => setBlockersCollapsed((v) => !v)}>
              {blockersCollapsed ? '展開' : '收合'}
            </button>
          </div>
          <div className="items-wrap">
            <ItemList
              listName="blockers"
              items={entry.blockers}
              categories={categories}
              editingId={editingId}
              setEditingId={setEditingId}
              onChange={(items) => patchEntry({ blockers: items })}
              onRequestDelete={(message, onConfirmed) => setConfirm({ message, onConfirm: () => { onConfirmed(); setConfirm(null); } })}
            />
          </div>
          <button className="add-item-btn" onClick={() => addItem('blockers')}>
            + 新增項目
          </button>
        </section>

        <section className="block">
          <div className="block-title">筆記區塊</div>
          <NotesSection
            notes={entry.notes}
            editingId={editingId}
            setEditingId={setEditingId}
            onChange={(notes) => patchEntry({ notes })}
            onRequestDelete={(message, onConfirmed) => setConfirm({ message, onConfirm: () => { onConfirmed(); setConfirm(null); } })}
          />
          <button className="add-note-btn" onClick={addNote}>
            + 新增筆記區塊
          </button>
        </section>
      </div>

      <CategoryModal
        open={catModalOpen}
        categories={categories}
        onSave={saveCategories}
        onRequestDelete={(cat, onConfirmed) =>
          setConfirm({
            message: `刪除分類「${cat.name}」後將無法復原,確定要刪除嗎?`,
            onConfirm: () => {
              onConfirmed();
              setConfirm(null);
            },
          })
        }
        onClose={() => setCatModalOpen(false)}
      />

      <ConfirmDialog
        open={!!confirm}
        message={confirm?.message ?? ''}
        onConfirm={() => confirm?.onConfirm()}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
