import { Category, uid } from '../types';

interface Props {
  open: boolean;
  categories: Category[];
  onSave: (next: Category[]) => void;
  onRequestDelete: (cat: Category, onConfirmed: () => void) => void;
  onClose: () => void;
}

export function CategoryModal({ open, categories, onSave, onRequestDelete, onClose }: Props) {
  if (!open) return null;

  const updateCategory = (id: string, patch: Partial<Category>) => {
    onSave(categories.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const removeCategory = (cat: Category) => {
    onRequestDelete(cat, () => {
      onSave(categories.filter((c) => c.id !== cat.id));
    });
  };

  const addCategory = () => {
    onSave([...categories, { id: uid(), name: '新分類', color: '#777777' }]);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>管理分類</h3>
        <div>
          {categories.map((c) => (
            <div className="cat-row" key={c.id}>
              <input
                type="color"
                value={c.color}
                onChange={(e) => updateCategory(c.id, { color: e.target.value })}
              />
              <input
                type="text"
                value={c.name}
                onChange={(e) => updateCategory(c.id, { name: e.target.value })}
              />
              <button onClick={() => removeCategory(c)}>×</button>
            </div>
          ))}
        </div>
        <button className="add-cat-btn" onClick={addCategory}>
          + 新增分類
        </button>
        <button className="close-modal-btn" onClick={onClose}>
          完成
        </button>
      </div>
    </div>
  );
}
