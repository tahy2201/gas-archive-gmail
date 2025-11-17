import { useState } from 'react';
import { Rule } from './types';
import { useRules } from './hooks/useRules';
import { useLabels } from './hooks/useLabels';
import { RuleList } from './components/RuleList';
import { RuleEditor } from './components/RuleEditor';
import { CommitDialog } from './components/CommitDialog';
import { gasApi } from './services/gas';

function App() {
  const { rules, loading: rulesLoading, error: rulesError, toggleRule, saveRules } = useRules();
  const { labels, loading: labelsLoading, error: labelsError } = useLabels();

  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [commitDialogOpen, setCommitDialogOpen] = useState(false);
  const [pendingRules, setPendingRules] = useState<Rule[]>([]);
  const [applyingFilter, setApplyingFilter] = useState<string | null>(null);

  // ルール編集開始
  const handleEdit = (rule: Rule) => {
    setEditingRule(rule);
    setIsCreating(false);
  };

  // 新規ルール作成開始
  const handleCreate = () => {
    setEditingRule(null);
    setIsCreating(true);
  };

  // ルール保存（ローカル）
  const handleSaveRule = (rule: Rule) => {
    let updatedRules: Rule[];

    if (editingRule) {
      // 編集
      updatedRules = rules.map(r => (r.id === rule.id ? rule : r));
    } else {
      // 新規追加
      updatedRules = [...rules, rule];
    }

    setPendingRules(updatedRules);
    setEditingRule(null);
    setIsCreating(false);
    setCommitDialogOpen(true);
  };

  // キャンセル
  const handleCancel = () => {
    setEditingRule(null);
    setIsCreating(false);
  };

  // GitHubにコミット
  const handleCommit = async (message: string) => {
    try {
      await saveRules(pendingRules, message);
      alert('ルールをGitHubに保存しました！');
    } catch (err) {
      console.error('Failed to save rules:', err);
      alert('保存に失敗しました: ' + (err as Error).message);
    }
  };

  // ルール削除
  const handleDelete = (id: string) => {
    const updatedRules = rules.filter(r => r.id !== id);
    setPendingRules(updatedRules);
    setCommitDialogOpen(true);
  };

  // ルール有効/無効切り替え
  const handleToggle = (id: string) => {
    toggleRule(id);
    const updatedRules = rules.map(r =>
      r.id === id ? { ...r, enabled: !r.enabled, updatedAt: new Date().toISOString() } : r
    );
    setPendingRules(updatedRules);
    setCommitDialogOpen(true);
  };

  // フィルタ適用
  const handleApplyFilter = async (ruleId: string) => {
    try {
      setApplyingFilter(ruleId);
      await gasApi.applyFilter(ruleId);
      alert('フィルタを適用しました！');
    } catch (err) {
      console.error('Failed to apply filter:', err);
      alert('フィルタの適用に失敗しました: ' + (err as Error).message);
    } finally {
      setApplyingFilter(null);
    }
  };

  const loading = rulesLoading || labelsLoading;
  const error = rulesError || labelsError;

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: '#dc3545' }}>
        <h2>エラーが発生しました</h2>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'sans-serif',
      }}
    >
      <header style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: '0 0 8px 0' }}>Gmail Filter Manager</h1>
        <p style={{ margin: 0, color: '#666' }}>
          Gmail のフィルタとアーカイブルールを管理します
        </p>
      </header>

      {/* 統計情報 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            backgroundColor: '#e3f2fd',
            padding: '16px',
            borderRadius: '8px',
          }}
        >
          <div style={{ fontSize: '0.9em', color: '#1976d2', marginBottom: '4px' }}>
            全ルール数
          </div>
          <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#1976d2' }}>
            {rules.length}
          </div>
        </div>
        <div
          style={{
            backgroundColor: '#e8f5e9',
            padding: '16px',
            borderRadius: '8px',
          }}
        >
          <div style={{ fontSize: '0.9em', color: '#388e3c', marginBottom: '4px' }}>
            有効なルール
          </div>
          <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#388e3c' }}>
            {rules.filter(r => r.enabled).length}
          </div>
        </div>
        <div
          style={{
            backgroundColor: '#fff3e0',
            padding: '16px',
            borderRadius: '8px',
          }}
        >
          <div style={{ fontSize: '0.9em', color: '#f57c00', marginBottom: '4px' }}>
            ラベル数
          </div>
          <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#f57c00' }}>
            {labels.length}
          </div>
        </div>
      </div>

      {/* 新規作成ボタン */}
      {!isCreating && !editingRule && (
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={handleCreate}
            style={{
              padding: '12px 24px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: '#007bff',
              color: '#fff',
              fontSize: '1em',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            + 新しいルールを追加
          </button>
        </div>
      )}

      {/* ルールエディタ */}
      {(isCreating || editingRule) && (
        <div style={{ marginBottom: '24px' }}>
          <RuleEditor
            rule={editingRule}
            labels={labels}
            onSave={handleSaveRule}
            onCancel={handleCancel}
          />
        </div>
      )}

      {/* ルール一覧 */}
      {!isCreating && !editingRule && (
        <div>
          <h2 style={{ margin: '0 0 16px 0' }}>ルール一覧</h2>
          <RuleList
            rules={rules}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggle={handleToggle}
            onApplyFilter={handleApplyFilter}
          />
        </div>
      )}

      {/* コミットダイアログ */}
      <CommitDialog
        isOpen={commitDialogOpen}
        onClose={() => setCommitDialogOpen(false)}
        onCommit={handleCommit}
      />

      {/* フィルタ適用中の表示 */}
      {applyingFilter && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#007bff',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          フィルタを適用中...
        </div>
      )}
    </div>
  );
}

export default App;
