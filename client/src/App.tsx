import { useState } from 'react';
import { Rule } from './types';
import { useRules } from './hooks/useRules';
import { useLabels } from './hooks/useLabels';
import { RuleList } from './components/RuleList';
import { RuleEditor } from './components/RuleEditor';
import { CommitDialog } from './components/CommitDialog';
import { GitHistory } from './components/GitHistory';
import { gasApi } from './services/gas';

function App() {
  const { rules, loading: rulesLoading, error: rulesError, toggleRule, saveRules } = useRules();
  const { labels, loading: labelsLoading, error: labelsError } = useLabels();

  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [commitDialogOpen, setCommitDialogOpen] = useState(false);
  const [pendingRules, setPendingRules] = useState<Rule[]>([]);
  const [applyingFilter, setApplyingFilter] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [currentTab, setCurrentTab] = useState<'rules' | 'history'>('rules');

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

  // 既存フィルタをインポート
  const handleExportFilters = async () => {
    if (!confirm('Gmail の既存フィルタをエクスポートして GitHub に保存しますか？')) {
      return;
    }
    try {
      setSyncing(true);
      const result: any = await gasApi.exportFilters();
      alert(`${result.rules.length} 件のフィルタをエクスポートしました！\n\nGitHub に保存する場合は「インポート結果を保存」ボタンを押してください。`);
      console.log('Exported filters:', result);
    } catch (err) {
      console.error('Failed to export filters:', err);
      alert('エクスポートに失敗しました: ' + (err as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  // ドライラン（差分確認）
  const handleDryRun = async () => {
    try {
      setSyncing(true);
      const result: any = await gasApi.syncRules(true);
      const summary = result.summary || result.diff?.summary;

      let message = '【差分確認結果】\n\n';
      if (summary) {
        message += `作成: ${summary.toCreate || 0} 件\n`;
        message += `更新: ${summary.toUpdate || 0} 件\n`;
        message += `削除: ${summary.toDelete || 0} 件\n`;
        message += `変更なし: ${summary.unchanged || 0} 件\n`;
      }
      message += '\n※ドライランのため、実際の変更は行われていません。';

      alert(message);
      console.log('Dry run result:', result);
    } catch (err) {
      console.error('Failed to dry run:', err);
      alert('差分確認に失敗しました: ' + (err as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  // Gmail に同期
  const handleSync = async () => {
    if (!confirm('GitHub の rules.json を Gmail に同期しますか？\n\n※Gmail のフィルタが上書きされます。')) {
      return;
    }
    try {
      setSyncing(true);
      const result: any = await gasApi.syncRules(false);
      const summary = result.summary;

      let message = '【同期完了】\n\n';
      if (summary) {
        message += `作成: ${summary.created || 0} 件\n`;
        message += `更新: ${summary.updated || 0} 件\n`;
        message += `削除: ${summary.deleted || 0} 件\n`;
        if (summary.errors > 0) {
          message += `\nエラー: ${summary.errors} 件`;
        }
      }

      alert(message);
      console.log('Sync result:', result);
    } catch (err) {
      console.error('Failed to sync:', err);
      alert('同期に失敗しました: ' + (err as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  // ラベルをエクスポート
  const handleExportLabels = async () => {
    if (!confirm('Gmail のラベルをエクスポートして GitHub に保存しますか？')) {
      return;
    }
    try {
      setSyncing(true);
      const result: any = await gasApi.exportLabels();
      alert(`${result.labels.length} 件のラベルをエクスポートしました！`);
      console.log('Exported labels:', result);
    } catch (err) {
      console.error('Failed to export labels:', err);
      alert('ラベルのエクスポートに失敗しました: ' + (err as Error).message);
    } finally {
      setSyncing(false);
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

      {/* タブナビゲーション */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '2px solid #dee2e6',
        }}
      >
        <button
          onClick={() => setCurrentTab('rules')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: 'transparent',
            color: currentTab === 'rules' ? '#007bff' : '#6c757d',
            fontSize: '1em',
            cursor: 'pointer',
            fontWeight: '500',
            borderBottom: currentTab === 'rules' ? '3px solid #007bff' : '3px solid transparent',
            marginBottom: '-2px',
          }}
        >
          ルール管理
        </button>
        <button
          onClick={() => setCurrentTab('history')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: 'transparent',
            color: currentTab === 'history' ? '#007bff' : '#6c757d',
            fontSize: '1em',
            cursor: 'pointer',
            fontWeight: '500',
            borderBottom: currentTab === 'history' ? '3px solid #007bff' : '3px solid transparent',
            marginBottom: '-2px',
          }}
        >
          履歴・ロールバック
        </button>
      </div>

      {/* 履歴タブ */}
      {currentTab === 'history' && <GitHistory />}

      {/* ルールタブ */}
      {currentTab === 'rules' && (
        <>
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

      {/* Phase 3: 同期・インポート機能 */}
      {!isCreating && !editingRule && (
        <div
          style={{
            marginBottom: '24px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1em' }}>
            Gmail との同期・インポート
          </h3>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <button
              onClick={handleExportFilters}
              disabled={syncing}
              style={{
                padding: '10px 20px',
                borderRadius: '4px',
                border: '1px solid #6c757d',
                backgroundColor: '#fff',
                color: '#6c757d',
                fontSize: '0.95em',
                cursor: syncing ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                opacity: syncing ? 0.6 : 1,
              }}
              title="Gmail の既存フィルタをエクスポート"
            >
              📥 既存フィルタをインポート
            </button>

            <button
              onClick={handleDryRun}
              disabled={syncing}
              style={{
                padding: '10px 20px',
                borderRadius: '4px',
                border: '1px solid #17a2b8',
                backgroundColor: '#fff',
                color: '#17a2b8',
                fontSize: '0.95em',
                cursor: syncing ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                opacity: syncing ? 0.6 : 1,
              }}
              title="変更内容を確認（実際には適用されません）"
            >
              🔍 差分確認（ドライラン）
            </button>

            <button
              onClick={handleSync}
              disabled={syncing}
              style={{
                padding: '10px 20px',
                borderRadius: '4px',
                border: '1px solid #28a745',
                backgroundColor: '#28a745',
                color: '#fff',
                fontSize: '0.95em',
                cursor: syncing ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                opacity: syncing ? 0.6 : 1,
              }}
              title="GitHub → Gmail に同期"
            >
              🔄 Gmail に同期
            </button>

            <button
              onClick={handleExportLabels}
              disabled={syncing}
              style={{
                padding: '10px 20px',
                borderRadius: '4px',
                border: '1px solid #fd7e14',
                backgroundColor: '#fff',
                color: '#fd7e14',
                fontSize: '0.95em',
                cursor: syncing ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                opacity: syncing ? 0.6 : 1,
              }}
              title="Gmail のラベルをエクスポート"
            >
              🏷️ ラベルをエクスポート
            </button>
          </div>
          <p
            style={{
              margin: '12px 0 0 0',
              fontSize: '0.85em',
              color: '#6c757d',
            }}
          >
            💡 ヒント: まず「差分確認」で変更内容を確認してから「Gmail に同期」することをおすすめします
          </p>
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
        </>
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

      {/* 同期中の表示 */}
      {syncing && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#28a745',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          処理中...
        </div>
      )}
    </div>
  );
}

export default App;
