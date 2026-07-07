import { useEffect, useRef, useState } from 'react';
import { Category, JournalItem, emptyItem } from '../types';

type ListName = 'yesterday' | 'today' | 'blockers';

interface Props {
  listName: ListName;
  items: JournalItem[];
  categories: Category[];
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  onChange: (items: JournalItem[]) => void;
  onRequestDelete: (message: string, onConfirmed: () => void) => void;
  autoExpand?: () => void;
}

function clampHoursInput(raw: string): string {
  let v = raw.replace(/[^0-9.]/g, '');
  const firstDot = v.indexOf('.');
  if (firstDot !== -1) {
    v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '');
  }
  const dotIdx = v.indexOf('.');
  if (dotIdx !== -1 && v.length - dotIdx - 1 > 2) {
    v = v.slice(0, dotIdx + 3);
  }
  if (parseFloat(v) > 12) v = '12';
  return v;
}

function HoursInput({
  value,
  onChange,
}: {
  value: number | null | undefined;
  onChange: (v: number | null) => void;
}) {
  const [text, setText] = useState(value != null ? String(value) : '');

  return (
    <input
      type="text"
      inputMode="decimal"
      placeholder="0.00"
      value={text}
      onChange={(e) => {
        const v = clampHoursInput(e.target.value);
        setText(v);
        onChange(v === '' || v === '.' ? null : parseFloat(v));
      }}
    />
  );
}

function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoFocus?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  }, [value]);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function ItemList({
  listName,
  items,
  categories,
  editingId,
  setEditingId,
  onChange,
  onRequestDelete,
}: Props) {
  const catById = (id: string) => categories.find((c) => c.id === id);

  const updateItem = (id: string, patch: Partial<JournalItem>) => {
    onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const removeItem = (id: string) => {
    onRequestDelete('刪除後將無法復原,確定要刪除這個項目嗎?', () => {
      onChange(items.filter((i) => i.id !== id));
      if (editingId === id) setEditingId(null);
    });
  };

  const toggleTag = (item: JournalItem, catId: string) => {
    const isSelected = (item.tags || []).includes(catId);
    updateItem(item.id, { tags: isSelected ? [] : [catId] });
  };

  if (items.length === 0) {
    return (
      <div className="empty-hint">
        {listName === 'blockers' ? '目前沒有困難點 🎉' : '尚未新增項目'}
      </div>
    );
  }

  return (
    <div className="items">
      {items.map((item) => {
        const isEditing = editingId === item.id;
        return (
          <div className="item-row" key={item.id}>
            <div className="item-row-top">
              {isEditing ? (
                <>
                  <AutoResizeTextarea
                    value={item.text}
                    placeholder="輸入內容…"
                    autoFocus
                    onChange={(v) => updateItem(item.id, { text: v })}
                  />
                  {listName === 'yesterday' && (
                    <div className="hours-field">
                      <HoursInput
                        value={item.hours}
                        onChange={(hours) => updateItem(item.id, { hours })}
                      />
                      <label>小時</label>
                    </div>
                  )}
                  <button className="confirm-btn" onClick={() => setEditingId(null)}>
                    確認
                  </button>
                  <button className="del-btn" onClick={() => removeItem(item.id)}>
                    ×
                  </button>
                </>
              ) : (
                <>
                  <div className={'item-text-display' + (item.text ? '' : ' is-empty')}>
                    {item.text || '（無內容）'}
                  </div>
                  {listName === 'yesterday' && item.hours != null && (
                    <div className="hours-display">{item.hours} 小時</div>
                  )}
                  <button className="icon-btn" title="編輯" onClick={() => setEditingId(item.id)}>
                    ✎
                  </button>
                  <button className="del-btn" onClick={() => removeItem(item.id)}>
                    ×
                  </button>
                </>
              )}
            </div>

            {listName !== 'blockers' && isEditing && (
              <div className="item-tags">
                {categories.map((c) => (
                  <span
                    key={c.id}
                    className={'item-tag' + ((item.tags || []).includes(c.id) ? ' on' : '')}
                    style={{ background: c.color }}
                    onClick={() => toggleTag(item, c.id)}
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            )}

            {listName !== 'blockers' && !isEditing && (item.tags || []).length > 0 && (
              <div className="item-tags-display">
                {item.tags.map((tid) => {
                  const cat = catById(tid);
                  if (!cat) return null;
                  return (
                    <span key={tid} className="item-tag-display" style={{ background: cat.color }}>
                      {cat.name}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { emptyItem };
export type { ListName };
