import { useState, useEffect } from 'react';
import { GitCommit, RulesConfig } from '../types';
import { gasApi } from '../services/gas';

export function GitHistory() {
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);
  const [commitRules, setCommitRules] = useState<RulesConfig | null>(null);
  const [loadingRules, setLoadingRules] = useState(false);
  const [rolling, setRolling] = useState(false);

  // コミット履歴を取得
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const history = (await gasApi.getCommitHistory('rules.json', 30, 1)) as GitCommit[];
        setCommits(history || []);
      } catch (err) {
        setError(err as Error);
        console.error('Failed to fetch commit history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // 特定コミットの内容を表示
  const handleViewCommit = async (sha: string) => {
    try {
      setLoadingRules(true);
      setSelectedCommit(sha);
      const rules = (await gasApi.getRulesAtCommit(sha, 'rules.json')) as RulesConfig;
      setCommitRules(rules);
    } catch (err) {
      console.error('Failed to fetch rules at commit:', err);
      alert('コミットの内容を取得できませんでした: ' + (err as Error).message);
    } finally {
      setLoadingRules(false);
    }
  };

  // ロールバック
  const handleRollback = async (sha: string) => {
    if (!confirm(`コミット ${sha.substring(0, 7)} にロールバックしますか？\n\nこの操作により新しいコミットが作成されます。`)) {
      return;
    }

    try {
      setRolling(true);
      await gasApi.rollback(sha, 'rules.json');
      alert('ロールバックが完了しました！\n\n履歴を再読み込みします。');

      // 履歴を再取得
      const history = (await gasApi.getCommitHistory('rules.json', 30, 1)) as GitCommit[];
      setCommits(history || []);
      setSelectedCommit(null);
      setCommitRules(null);
    } catch (err) {
      console.error('Failed to rollback:', err);
      alert('ロールバックに失敗しました: ' + (err as Error).message);
    } finally {
      setRolling(false);
    }
  };

  // 日時をフォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>コミット履歴を読み込み中...</p>
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
    <div style={{ padding: '20px' }}>
      <h2 style={{ margin: '0 0 16px 0' }}>コミット履歴</h2>

      <p style={{ margin: '0 0 24px 0', color: '#6c757d', fontSize: '0.95em' }}>
        rules.json の変更履歴を表示しています。過去のバージョンを確認したり、ロールバックできます。
      </p>

      <div style={{ display: 'grid', gap: '16px' }}>
        {commits.map((commit) => (
          <div
            key={commit.sha}
            style={{
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: selectedCommit === commit.sha ? '#e7f3ff' : '#fff',
            }}
          >
            {/* コミット情報 */}
            <div style={{ marginBottom: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                }}
              >
                <code
                  style={{
                    backgroundColor: '#f8f9fa',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.85em',
                    fontFamily: 'monospace',
                  }}
                >
                  {commit.sha.substring(0, 7)}
                </code>
                <span style={{ fontSize: '0.9em', color: '#6c757d' }}>
                  {formatDate(commit.author.date)}
                </span>
              </div>

              <div style={{ marginBottom: '4px', fontWeight: '500' }}>
                {commit.message.split('\n')[0]}
              </div>

              <div style={{ fontSize: '0.85em', color: '#6c757d' }}>
                {commit.author.name} &lt;{commit.author.email}&gt;
              </div>
            </div>

            {/* アクションボタン */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleViewCommit(commit.sha)}
                disabled={loadingRules}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: '1px solid #007bff',
                  backgroundColor: '#fff',
                  color: '#007bff',
                  fontSize: '0.85em',
                  cursor: loadingRules ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  opacity: loadingRules ? 0.6 : 1,
                }}
              >
                {loadingRules && selectedCommit === commit.sha ? '読み込み中...' : '内容を表示'}
              </button>

              <button
                onClick={() => handleRollback(commit.sha)}
                disabled={rolling}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: '1px solid #28a745',
                  backgroundColor: '#fff',
                  color: '#28a745',
                  fontSize: '0.85em',
                  cursor: rolling ? 'not-allowed' : 'pointer',
                  fontWeight: '500',
                  opacity: rolling ? 0.6 : 1,
                }}
              >
                ロールバック
              </button>
            </div>

            {/* コミットの詳細内容 */}
            {selectedCommit === commit.sha && commitRules && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  border: '1px solid #dee2e6',
                }}
              >
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95em' }}>
                  コミット内容
                </h4>

                <div style={{ fontSize: '0.85em', color: '#495057' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>バージョン:</strong> {commitRules.version}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>最終更新:</strong> {formatDate(commitRules.lastUpdated)}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>ルール数:</strong> {commitRules.rules.length} 件
                  </div>
                  <div>
                    <strong>有効なルール:</strong>{' '}
                    {commitRules.rules.filter((r) => r.enabled).length} 件
                  </div>
                </div>

                <details style={{ marginTop: '12px' }}>
                  <summary
                    style={{
                      cursor: 'pointer',
                      fontSize: '0.85em',
                      color: '#007bff',
                      fontWeight: '500',
                    }}
                  >
                    ルール一覧を表示
                  </summary>
                  <div style={{ marginTop: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                    {commitRules.rules.map((rule) => (
                      <div
                        key={rule.id}
                        style={{
                          padding: '8px',
                          marginBottom: '4px',
                          backgroundColor: '#fff',
                          borderRadius: '4px',
                          fontSize: '0.8em',
                        }}
                      >
                        <div style={{ fontWeight: '500', marginBottom: '2px' }}>
                          {rule.name}
                          {!rule.enabled && (
                            <span style={{ color: '#6c757d', marginLeft: '8px' }}>
                              (無効)
                            </span>
                          )}
                        </div>
                        {rule.description && (
                          <div style={{ color: '#6c757d', fontSize: '0.95em' }}>
                            {rule.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </div>
        ))}
      </div>

      {commits.length === 0 && (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            color: '#6c757d',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
          }}
        >
          コミット履歴がありません
        </div>
      )}

      {/* ロールバック中の表示 */}
      {rolling && (
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
          ロールバック中...
        </div>
      )}
    </div>
  );
}
