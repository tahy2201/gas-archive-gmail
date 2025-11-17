import { useState, useEffect } from 'react';
import { Rule, GmailLabel } from '../types';
import { LabelSelector } from './LabelSelector';

interface RuleEditorProps {
  rule: Rule | null;
  labels: GmailLabel[];
  onSave: (rule: Rule) => void;
  onCancel: () => void;
}

const emptyRule: Omit<Rule, 'id' | 'createdAt' | 'updatedAt'> = {
  type: 'filter',
  enabled: true,
  name: '',
  description: '',
  criteria: {},
  actions: {},
  schedule: 'manual',
};

export function RuleEditor({ rule, labels, onSave, onCancel }: RuleEditorProps) {
  const [formData, setFormData] = useState<Omit<Rule, 'id' | 'createdAt' | 'updatedAt'>>(
    rule
      ? {
          type: rule.type,
          enabled: rule.enabled,
          name: rule.name,
          description: rule.description,
          criteria: rule.criteria,
          actions: rule.actions,
          schedule: rule.schedule,
        }
      : emptyRule
  );

  useEffect(() => {
    if (rule) {
      setFormData({
        type: rule.type,
        enabled: rule.enabled,
        name: rule.name,
        description: rule.description,
        criteria: rule.criteria,
        actions: rule.actions,
        schedule: rule.schedule,
      });
    }
  }, [rule]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date().toISOString();
    const savedRule: Rule = {
      id: rule?.id || `rule_${Date.now()}`,
      ...formData,
      createdAt: rule?.createdAt || now,
      updatedAt: now,
    };

    onSave(savedRule);
  };

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: typeof formData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateCriteria = <K extends keyof typeof formData.criteria>(
    field: K,
    value: typeof formData.criteria[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      criteria: { ...prev.criteria, [field]: value },
    }));
  };

  const updateActions = <K extends keyof typeof formData.actions>(
    field: K,
    value: typeof formData.actions[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      actions: { ...prev.actions, [field]: value },
    }));
  };

  return (
    <div
      style={{
        backgroundColor: '#fff',
        padding: '24px',
        borderRadius: '8px',
        border: '1px solid #ddd',
      }}
    >
      <h2 style={{ margin: '0 0 20px 0' }}>
        {rule ? 'ルールを編集' : '新しいルールを追加'}
      </h2>

      <form onSubmit={handleSubmit}>
        {/* 基本情報 */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1em' }}>基本情報</h3>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              ルール名 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => updateField('name', e.target.value)}
              required
              placeholder="例: 重要なメールのフィルタ"
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd',
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              説明
            </label>
            <textarea
              value={formData.description}
              onChange={e => updateField('description', e.target.value)}
              placeholder="このルールの説明を入力してください"
              rows={2}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              種類 *
            </label>
            <select
              value={formData.type}
              onChange={e => updateField('type', e.target.value as Rule['type'])}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd',
              }}
            >
              <option value="filter">フィルタのみ</option>
              <option value="archive">アーカイブのみ</option>
              <option value="both">フィルタ + アーカイブ</option>
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={e => updateField('enabled', e.target.checked)}
                style={{ marginRight: '8px' }}
              />
              <span>有効化</span>
            </label>
          </div>
        </div>

        {/* 検索条件 */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1em' }}>検索条件</h3>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              送信元 (from)
            </label>
            <input
              type="text"
              value={formData.criteria.from || ''}
              onChange={e => updateCriteria('from', e.target.value || undefined)}
              placeholder="例: example@gmail.com"
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd',
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              宛先 (to)
            </label>
            <input
              type="text"
              value={formData.criteria.to || ''}
              onChange={e => updateCriteria('to', e.target.value || undefined)}
              placeholder="例: me@gmail.com"
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd',
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              件名 (subject)
            </label>
            <input
              type="text"
              value={formData.criteria.subject || ''}
              onChange={e => updateCriteria('subject', e.target.value || undefined)}
              placeholder="例: お知らせ"
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd',
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              検索クエリ (query)
            </label>
            <input
              type="text"
              value={formData.criteria.query || ''}
              onChange={e => updateCriteria('query', e.target.value || undefined)}
              placeholder="例: has:attachment label:inbox"
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd',
              }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.criteria.hasAttachment || false}
                onChange={e =>
                  updateCriteria('hasAttachment', e.target.checked || undefined)
                }
                style={{ marginRight: '8px' }}
              />
              <span>添付ファイルあり</span>
            </label>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.criteria.excludeChats || false}
                onChange={e => updateCriteria('excludeChats', e.target.checked || undefined)}
                style={{ marginRight: '8px' }}
              />
              <span>チャットを除外</span>
            </label>
          </div>
        </div>

        {/* アクション */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1em' }}>アクション</h3>

          <LabelSelector
            labels={labels}
            selectedLabelIds={formData.actions.addLabelIds || []}
            onChange={ids => updateActions('addLabelIds', ids.length > 0 ? ids : undefined)}
            label="追加するラベル"
            multiple
          />

          <LabelSelector
            labels={labels}
            selectedLabelIds={formData.actions.removeLabelIds || []}
            onChange={ids =>
              updateActions('removeLabelIds', ids.length > 0 ? ids : undefined)
            }
            label="削除するラベル"
            multiple
          />

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.actions.archive || false}
                onChange={e => updateActions('archive', e.target.checked || undefined)}
                style={{ marginRight: '8px' }}
              />
              <span>アーカイブする</span>
            </label>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.actions.trash || false}
                onChange={e => updateActions('trash', e.target.checked || undefined)}
                style={{ marginRight: '8px' }}
              />
              <span>ゴミ箱に移動</span>
            </label>
          </div>
        </div>

        {/* スケジュール */}
        {(formData.type === 'archive' || formData.type === 'both') && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1em' }}>スケジュール</h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                実行頻度
              </label>
              <select
                value={formData.schedule}
                onChange={e =>
                  updateField('schedule', e.target.value as Rule['schedule'])
                }
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                }}
              >
                <option value="manual">手動</option>
                <option value="hourly">1時間ごと</option>
                <option value="daily">毎日</option>
                <option value="weekly">毎週</option>
              </select>
            </div>
          </div>
        )}

        {/* ボタン */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '10px 20px',
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
            style={{
              padding: '10px 20px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#007bff',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            保存
          </button>
        </div>
      </form>
    </div>
  );
}
