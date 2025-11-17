import { Rule } from '../types';

interface RuleListProps {
  rules: Rule[];
  onEdit: (rule: Rule) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onApplyFilter: (id: string) => void;
}

export function RuleList({
  rules,
  onEdit,
  onDelete,
  onToggle,
  onApplyFilter,
}: RuleListProps) {
  if (rules.length === 0) {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          color: '#666',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px',
          border: '1px dashed #ddd',
        }}
      >
        <p style={{ margin: 0 }}>ルールがまだ登録されていません</p>
        <p style={{ margin: '8px 0 0 0', fontSize: '0.9em' }}>
          「新しいルールを追加」ボタンから登録してください
        </p>
      </div>
    );
  }

  return (
    <div>
      {rules.map(rule => (
        <div
          key={rule.id}
          style={{
            backgroundColor: rule.enabled ? '#fff' : '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}
          >
            <div style={{ flex: 1 }}>
              <h3
                style={{
                  margin: '0 0 4px 0',
                  fontSize: '1.1em',
                  color: rule.enabled ? '#000' : '#999',
                }}
              >
                {rule.name}
              </h3>
              {rule.description && (
                <p
                  style={{
                    margin: '0 0 8px 0',
                    fontSize: '0.9em',
                    color: rule.enabled ? '#666' : '#999',
                  }}
                >
                  {rule.description}
                </p>
              )}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.85em',
                    backgroundColor: rule.enabled ? '#e3f2fd' : '#e0e0e0',
                    color: rule.enabled ? '#1976d2' : '#666',
                  }}
                >
                  {rule.type === 'filter'
                    ? 'フィルタ'
                    : rule.type === 'archive'
                    ? 'アーカイブ'
                    : 'フィルタ + アーカイブ'}
                </span>
                {rule.schedule && rule.schedule !== 'manual' && (
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.85em',
                      backgroundColor: rule.enabled ? '#fff3e0' : '#e0e0e0',
                      color: rule.enabled ? '#f57c00' : '#666',
                    }}
                  >
                    {rule.schedule === 'hourly'
                      ? '1時間ごと'
                      : rule.schedule === 'daily'
                      ? '毎日'
                      : '毎週'}
                  </span>
                )}
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.85em',
                    backgroundColor: rule.enabled ? '#e8f5e9' : '#e0e0e0',
                    color: rule.enabled ? '#388e3c' : '#666',
                  }}
                >
                  {rule.enabled ? '有効' : '無効'}
                </span>
              </div>
            </div>
          </div>

          {/* 条件とアクションの概要 */}
          <div
            style={{
              fontSize: '0.85em',
              color: '#666',
              marginBottom: '12px',
              paddingTop: '8px',
              borderTop: '1px solid #eee',
            }}
          >
            {/* 条件 */}
            {Object.keys(rule.criteria).length > 0 && (
              <div style={{ marginBottom: '4px' }}>
                <strong>条件:</strong>{' '}
                {[
                  rule.criteria.from && `送信元: ${rule.criteria.from}`,
                  rule.criteria.to && `宛先: ${rule.criteria.to}`,
                  rule.criteria.subject && `件名: ${rule.criteria.subject}`,
                  rule.criteria.query && `クエリ: ${rule.criteria.query}`,
                  rule.criteria.hasAttachment && '添付ファイルあり',
                ]
                  .filter(Boolean)
                  .join(', ') || 'なし'}
              </div>
            )}

            {/* アクション */}
            {Object.keys(rule.actions).length > 0 && (
              <div>
                <strong>アクション:</strong>{' '}
                {[
                  rule.actions.addLabelIds &&
                    rule.actions.addLabelIds.length > 0 &&
                    `ラベル追加 (${rule.actions.addLabelIds.length}件)`,
                  rule.actions.removeLabelIds &&
                    rule.actions.removeLabelIds.length > 0 &&
                    `ラベル削除 (${rule.actions.removeLabelIds.length}件)`,
                  rule.actions.archive && 'アーカイブ',
                  rule.actions.trash && 'ゴミ箱',
                ]
                  .filter(Boolean)
                  .join(', ') || 'なし'}
              </div>
            )}
          </div>

          {/* ボタン */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => onToggle(rule.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                backgroundColor: '#fff',
                cursor: 'pointer',
                fontSize: '0.9em',
              }}
            >
              {rule.enabled ? '無効化' : '有効化'}
            </button>
            <button
              onClick={() => onEdit(rule)}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #007bff',
                backgroundColor: '#fff',
                color: '#007bff',
                cursor: 'pointer',
                fontSize: '0.9em',
              }}
            >
              編集
            </button>
            {(rule.type === 'filter' || rule.type === 'both') && (
              <button
                onClick={() => onApplyFilter(rule.id)}
                disabled={!rule.enabled}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: rule.enabled ? '#28a745' : '#ccc',
                  color: '#fff',
                  cursor: rule.enabled ? 'pointer' : 'not-allowed',
                  fontSize: '0.9em',
                }}
              >
                フィルタ適用
              </button>
            )}
            <button
              onClick={() => {
                if (
                  confirm(`ルール「${rule.name}」を削除してもよろしいですか？`)
                ) {
                  onDelete(rule.id);
                }
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #dc3545',
                backgroundColor: '#fff',
                color: '#dc3545',
                cursor: 'pointer',
                fontSize: '0.9em',
              }}
            >
              削除
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
