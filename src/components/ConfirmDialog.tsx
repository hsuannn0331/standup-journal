interface Props {
  open: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, message, onConfirm, onCancel }: Props) {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ width: 300 }}>
        <h3>確定要刪除嗎?</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="secondary-btn" onClick={onCancel}>
            取消
          </button>
          <button className="danger-btn" onClick={onConfirm}>
            刪除
          </button>
        </div>
      </div>
    </div>
  );
}
