import { GmailLabel } from '../types';

interface LabelSelectorProps {
  labels: GmailLabel[];
  selectedLabelIds: string[];
  onChange: (labelIds: string[]) => void;
  label?: string;
  multiple?: boolean;
}

export function LabelSelector({
  labels,
  selectedLabelIds,
  onChange,
  label = 'ラベルを選択',
  multiple = true,
}: LabelSelectorProps) {
  const handleCheckboxChange = (labelId: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedLabelIds, labelId]);
    } else {
      onChange(selectedLabelIds.filter(id => id !== labelId));
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value) {
      onChange([value]);
    } else {
      onChange([]);
    }
  };

  // ユーザーラベルとシステムラベルを分離
  const userLabels = labels.filter(l => l.type === 'user');
  const systemLabels = labels.filter(l => l.type === 'system');

  if (!multiple) {
    // シングル選択モード
    return (
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
          {label}
        </label>
        <select
          value={selectedLabelIds[0] || ''}
          onChange={handleSelectChange}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '4px',
            border: '1px solid #ddd',
          }}
        >
          <option value="">-- 選択してください --</option>
          {userLabels.length > 0 && (
            <optgroup label="ユーザーラベル">
              {userLabels.map(l => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </optgroup>
          )}
          {systemLabels.length > 0 && (
            <optgroup label="システムラベル">
              {systemLabels.map(l => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </div>
    );
  }

  // マルチ選択モード
  return (
    <div style={{ marginBottom: '12px' }}>
      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
        {label}
      </label>
      <div
        style={{
          border: '1px solid #ddd',
          borderRadius: '4px',
          padding: '8px',
          maxHeight: '200px',
          overflowY: 'auto',
          backgroundColor: '#fff',
        }}
      >
        {userLabels.length > 0 && (
          <>
            <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '0.9em', color: '#666' }}>
              ユーザーラベル
            </div>
            {userLabels.map(l => (
              <label
                key={l.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px 0',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedLabelIds.includes(l.id)}
                  onChange={e => handleCheckboxChange(l.id, e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                <span>{l.name}</span>
              </label>
            ))}
          </>
        )}

        {systemLabels.length > 0 && (
          <>
            <div
              style={{
                fontWeight: '600',
                marginTop: userLabels.length > 0 ? '12px' : '0',
                marginBottom: '4px',
                fontSize: '0.9em',
                color: '#666',
              }}
            >
              システムラベル
            </div>
            {systemLabels.map(l => (
              <label
                key={l.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px 0',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedLabelIds.includes(l.id)}
                  onChange={e => handleCheckboxChange(l.id, e.target.checked)}
                  style={{ marginRight: '8px' }}
                />
                <span>{l.name}</span>
              </label>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
