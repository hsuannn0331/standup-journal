import { useEffect, useRef } from 'react';
import { NoteBlock } from '../types';

interface Props {
  notes: NoteBlock[];
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  onChange: (notes: NoteBlock[]) => void;
  onRequestDelete: (message: string, onConfirmed: () => void) => void;
}

function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  }, [value]);
  return (
    <textarea
      ref={ref}
      className="note-content"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function NotesSection({ notes, editingId, setEditingId, onChange, onRequestDelete }: Props) {
  const update = (id: string, patch: Partial<NoteBlock>) => {
    onChange(notes.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  };

  const remove = (id: string) => {
    onRequestDelete('刪除後將無法復原,確定要刪除這個筆記區塊嗎?', () => {
      onChange(notes.filter((n) => n.id !== id));
      if (editingId === id) setEditingId(null);
    });
  };

  if (notes.length === 0) {
    return <div className="empty-hint">尚未新增筆記區塊</div>;
  }

  return (
    <div>
      {notes.map((note) => {
        const isEditing = editingId === note.id;
        return (
          <div className="note-block" key={note.id}>
            <div className="note-block-header">
              {isEditing ? (
                <>
                  <input
                    className="note-title-input"
                    placeholder="筆記標題"
                    value={note.title}
                    autoFocus
                    onChange={(e) => update(note.id, { title: e.target.value })}
                  />
                  <button className="confirm-btn" onClick={() => setEditingId(null)}>
                    確認
                  </button>
                  <button className="del-btn" onClick={() => remove(note.id)}>
                    ×
                  </button>
                </>
              ) : (
                <>
                  <div
                    className="note-title-input note-title-display"
                    style={{ color: note.title ? 'var(--ink)' : 'var(--ink-faint)' }}
                  >
                    {note.title || '（無標題）'}
                  </div>
                  <button className="icon-btn" title="編輯" onClick={() => setEditingId(note.id)}>
                    ✎
                  </button>
                  <button className="del-btn" onClick={() => remove(note.id)}>
                    ×
                  </button>
                </>
              )}
            </div>

            {isEditing ? (
              <AutoResizeTextarea
                value={note.content}
                placeholder="寫點什麼…"
                onChange={(v) => update(note.id, { content: v })}
              />
            ) : (
              <div className={'item-text-display' + (note.content ? '' : ' is-empty')}>
                {note.content || '（無內容）'}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
