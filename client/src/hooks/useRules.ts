import { useState, useEffect, useCallback } from 'react';
import { gasApi } from '../services/gas';
import { Rule, RulesConfig } from '../types';

export function useRules() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // ルール一覧を取得
  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const config = await gasApi.getRules() as RulesConfig;
      setRules(config.rules || []);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch rules:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ルールを保存
  const saveRules = useCallback(async (newRules: Rule[], commitMessage: string) => {
    try {
      setLoading(true);
      setError(null);

      const config: RulesConfig = {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        rules: newRules,
      };

      await gasApi.saveRules(config, commitMessage);
      setRules(newRules);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to save rules:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ルールを追加
  const addRule = useCallback((rule: Rule) => {
    setRules(prev => [...prev, rule]);
  }, []);

  // ルールを更新
  const updateRule = useCallback((id: string, updates: Partial<Rule>) => {
    setRules(prev =>
      prev.map(rule =>
        rule.id === id ? { ...rule, ...updates, updatedAt: new Date().toISOString() } : rule
      )
    );
  }, []);

  // ルールを削除
  const deleteRule = useCallback((id: string) => {
    setRules(prev => prev.filter(rule => rule.id !== id));
  }, []);

  // ルールの有効/無効を切り替え
  const toggleRule = useCallback((id: string) => {
    setRules(prev =>
      prev.map(rule =>
        rule.id === id ? { ...rule, enabled: !rule.enabled, updatedAt: new Date().toISOString() } : rule
      )
    );
  }, []);

  // 初回マウント時にルールを取得
  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return {
    rules,
    loading,
    error,
    fetchRules,
    saveRules,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
  };
}
