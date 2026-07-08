import { Fragment, ReactNode, useEffect, useState } from 'react';
import { Category, DailyEntry, todayStr } from '../types';

interface HistoryEntry {
  date: string;
  entry: DailyEntry | undefined;
}

interface Props {
  currentDate: string;
  categories: Category[];
  historyEntries: HistoryEntry[];
  historyFullyLoaded: boolean;
  loadingAllHistory: boolean;
  onEnsureAllHistoryLoaded: () => void;
  onSwitchDate: (date: string) => void;
  onNewToday: () => void;
  onOpenCategoryModal: () => void;
  onRequestDeleteEntry: (date: string) => void;
  userEmail?: string | null;
  onLogout: () => void;
}

const DEFAULT_COUNT = 3;
const EXPANDED_COUNT = 10;
const SEARCH_DEBOUNCE_MS = 200;

function highlight(text: string, query: string): ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query);
  if (idx === -1) return text;
  return (
    <Fragment>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </Fragment>
  );
}

function findSnippets(entry: DailyEntry, query: string): string[] {
  const texts = [
    ...entry.yesterday.map((i) => i.text),
    ...entry.today.map((i) => i.text),
    ...entry.blockers.map((i) => i.text),
    ...entry.notes.flatMap((n) => [n.title, n.content]),
  ];
  return texts.filter((t) => t.toLowerCase().includes(query));
}

export function Sidebar({
  currentDate,
  categories,
  historyEntries,
  historyFullyLoaded,
  loadingAllHistory,
  onEnsureAllHistoryLoaded,
  onSwitchDate,
  onNewToday,
  onOpenCategoryModal,
  onRequestDeleteEntry,
  userEmail,
  onLogout,
}: Props) {
  const [pastDate, setPastDate] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    setPastDate(
      y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0')
    );
  }, []);

  // Debounce the search query, and only fetch the full history once the user
  // actually starts searching (recent entries are already loaded eagerly).
  useEffect(() => {
    const trimmed = searchInput.trim().toLowerCase();
    const t = setTimeout(() => setQuery(trimmed), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (query) onEnsureAllHistoryLoaded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const catById = (id: string) => categories.find((c) => c.id === id);

  const switchAndCollapse = (date: string) => {
    onSwitchDate(date);
    setExpanded(false);
  };

  const matchesSearch = (date: string, entry: DailyEntry, q: string) => {
    if (date.includes(q)) return true;
    return findSnippets(entry, q).length > 0;
  };

  const visibleEntries = query
    ? historyEntries.filter(({ date, entry }) => entry && matchesSearch(date, entry, query))
    : historyEntries.slice(0, showMore ? EXPANDED_COUNT : DEFAULT_COUNT);

  const isSearching = query.length > 0;
  const stillLoadingResults = isSearching && !historyFullyLoaded && loadingAllHistory;

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
        <div className="history-search-row">
          <input
            className="history-search"
            type="text"
            placeholder="搜尋日期或內容…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button
              className="history-search-clear"
              title="清除搜尋"
              onClick={() => setSearchInput('')}
            >
              ×
            </button>
          )}
        </div>
        {stillLoadingResults && <div className="history-loading">搜尋中…</div>}
        <div className="history-list">
          {!stillLoadingResults && visibleEntries.length === 0 && (
            <div className="history-empty">找不到符合的紀錄</div>
          )}
          {visibleEntries.map(({ date, entry }) => {
            if (!entry) return null;
            const usedTags = new Set<string>();
            [...entry.yesterday, ...entry.today].forEach((i) =>
              (i.tags || []).forEach((t) => usedTags.add(t))
            );
            const snippets = isSearching && !date.includes(query) ? findSnippets(entry, query) : [];
            return (
              <div
                className={'history-item-wrap' + (date === currentDate ? ' active' : '')}
                key={date}
              >
                <div className="history-item" onClick={() => switchAndCollapse(date)}>
                  <span>{highlight(date, query)}</span>
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
                {snippets.map((snippet, i) => (
                  <div
                    className="history-snippet"
                    key={i}
                    onClick={() => switchAndCollapse(date)}
                  >
                    {highlight(snippet, query)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        {!isSearching && historyEntries.length > DEFAULT_COUNT && (
          <button className="history-toggle-btn" onClick={() => setShowMore((v) => !v)}>
            {showMore ? '收合' : `展開最近 ${EXPANDED_COUNT} 筆`}
          </button>
        )}

        <button className="manage-cat-btn" onClick={onOpenCategoryModal}>
          管理分類 →
        </button>
      </div>
    </div>
  );
}
