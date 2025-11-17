import { useState } from 'react';

interface CommitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCommit: (message: string) => void;
  title?: string;
}

export function CommitDialog({
  isOpen,
  onClose,
  onCommit,
  title = 'GitHubにコミット',
}: CommitDialogProps) {
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onCommit(message.trim());
      setMessage('');
      onClose();
    }
  };

  const handleCancel = () => {
    setMessage('');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={handleCancel}
    >
      <div
        style={{
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '8px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 16px 0', fontSize: '1.5em' }}>{title}</h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="commit-message"
              style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}
            >
              コミットメッセージ
            </label>
            <textarea
              id="commit-message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="例: ルールを追加: 重要なメールのフィルタ"
              rows={4}
              autoFocus
              required
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                fontFamily: 'inherit',
                fontSize: '1em',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                backgroundColor: '#fff',
                cursor: 'pointer',
              }}
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={!message.trim()}
              style={{
                padding: '8px 16px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: message.trim() ? '#007bff' : '#ccc',
                color: '#fff',
                cursor: message.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              コミット
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
