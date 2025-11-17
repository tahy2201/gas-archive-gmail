import { useState, useEffect, useCallback } from 'react';
import { gasApi } from '../services/gas';
import { GmailLabel } from '../types';

export function useLabels() {
  const [labels, setLabels] = useState<GmailLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // ラベル一覧を取得
  const fetchLabels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const labelList = await gasApi.getLabels() as GmailLabel[];
      setLabels(labelList || []);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch labels:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初回マウント時にラベルを取得
  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  // ユーザー作成ラベルのみをフィルタ
  const userLabels = labels.filter(label => label.type === 'user');

  // システムラベルのみをフィルタ
  const systemLabels = labels.filter(label => label.type === 'system');

  return {
    labels,
    userLabels,
    systemLabels,
    loading,
    error,
    fetchLabels,
  };
}
