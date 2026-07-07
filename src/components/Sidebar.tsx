import { useEffect, useState } from 'react';
import { Category, DailyEntry, todayStr } from '../types';

interface HistoryEntry {
  date: string;
  entry: DailyEntry;
}

interface Props {
  currentDate: string;
  categories: Category[];
  historyEntries: HistoryEntry[];
  onSwitchDate: (date: string) => void;
  onNewToday: () => void;
  onOpenCategoryModal: () => void;
  onRequestDeleteEntry: (date: string) => void;
  userEmail?: string | null;
  onLogout: () => void;
}

export function Sidebar({
  currentDate,
  categories,
  historyEntries,
  onSwitchDate,
  onNewToday,
  onOpenCategoryModal,
  onRequestDeleteEntry,
  userEmail,
  onLogout,
}: Props) {
  const [pastDate, setPastDate] = useState('');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    setPastDate(
      y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0')
    );
  }, []);

  const catById = (id: string) => categories.find((c) => c.id === id);

  const switchAndCollapse = (date: string) => {
    onSwitchDate(date);
    setExpanded(false);
  };

  return (
    <div className="sidebar">
      <button
        className={'sidebar-toggle' + (expanded ? ' expanded' : '')}
        onClick={() => setExpanded((v) => !v)}
      >
        <span>站會筆記 · {currentDate}</span>
        <span className="chevron">▾</span>
      </button>

      <div className={'sidebar-content' + (expanded ? ' expanded' : '')}>
        <h1>站會筆記</h1>
        <div className="sub">Daily Standup Journal</div>

        {userEmail && (
          <div className="user-row">
            <span>{userEmail}</span>
            <button className="logout-btn" onClick={onLogout}>
              登出
            </button>
          </div>
        )}

        <button
          className="new-btn"
          onClick={() => {
            onNewToday();
            setExpanded(false);
          }}
        >
          + 新增今天
        </button>

        <div className="past-entry-row">
          <input
            type="date"
            value={pastDate}
            max={todayStr()}
            onChange={(e) => setPastDate(e.target.value)}
          />
          <button onClick={() => pastDate && switchAndCollapse(pastDate)}>新增/前往</button>
        </div>

        <div className="history-label">歷史紀錄</div>
        <div className="history-list">
          {historyEntries.map(({ date, entry }) => {
            const usedTags = new Set<string>();
            [...entry.yesterday, ...entry.today].forEach((i) =>
              (i.tags || []).forEach((t) => usedTags.add(t))
            );
            return (
              <div
                className={'history-item' + (date === currentDate ? ' active' : '')}
                key={date}
                onClick={() => switchAndCollapse(date)}
              >
                <span>{date}</span>
                <span className="dots">
                  {[...usedTags].slice(0, 4).map((tid) => {
                    const cat = catById(tid);
                    if (!cat) return null;
                    return <span key={tid} className="dot" style={{ background: cat.color }} />;
                  })}
                </span>
                <button
                  className="del-entry-btn"
                  title="刪除這天的紀錄"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequestDeleteEntry(date);
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>

        <button className="manage-cat-btn" onClick={onOpenCategoryModal}>
          管理分類 →
        </button>
      </div>
    </div>
  );
}
