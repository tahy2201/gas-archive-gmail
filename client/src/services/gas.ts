/**
 * GAS API クライアント
 */

// GAS の google.script.run の型定義
declare const google: {
  script: {
    run: {
      withSuccessHandler: (callback: (result: any) => void) => any;
      withFailureHandler: (callback: (error: Error) => void) => any;
      getRules: () => void;
      saveRules: (rules: any, commitMessage: string) => void;
      getLabels: () => void;
      applyFilter: (ruleId: string) => void;
      getCurrentUser: () => void;
      exportFilters: () => void;
      syncRules: (dryRun: boolean) => void;
      exportLabels: () => void;
      getLabelsConfig: () => void;
      saveLabelsConfig: (labelsConfig: any, commitMessage: string) => void;
      getCommitHistory: (filePath?: string, perPage?: number, page?: number) => void;
      getRulesAtCommit: (commitSha: string, filePath?: string) => void;
      rollback: (commitSha: string, filePath?: string) => void;
    };
  };
};

/**
 * GAS関数を Promise でラップ
 */
function runGasFunction<T>(functionName: string, ...args: any[]): Promise<T> {
  return new Promise((resolve, reject) => {
    (google.script.run as any)
      .withSuccessHandler(resolve)
      .withFailureHandler(reject)
      [functionName](...args);
  });
}

export const gasApi = {
  /**
   * ルール一覧を取得
   */
  getRules: () => runGasFunction('getRules'),

  /**
   * ルールを保存
   */
  saveRules: (rules: any, commitMessage: string) =>
    runGasFunction('saveRules', rules, commitMessage),

  /**
   * ラベル一覧を取得
   */
  getLabels: () => runGasFunction('getLabels'),

  /**
   * フィルタを適用
   */
  applyFilter: (ruleId: string) => runGasFunction('applyFilter', ruleId),

  /**
   * 現在のユーザー情報を取得
   */
  getCurrentUser: () => runGasFunction('getCurrentUser'),

  /**
   * 既存の Gmail フィルタをエクスポート
   */
  exportFilters: () => runGasFunction('exportFilters'),

  /**
   * ルールを Gmail に同期
   */
  syncRules: (dryRun: boolean) => runGasFunction('syncRules', dryRun),

  /**
   * ラベルをエクスポート
   */
  exportLabels: () => runGasFunction('exportLabels'),

  /**
   * labels.json を取得
   */
  getLabelsConfig: () => runGasFunction('getLabelsConfig'),

  /**
   * labels.json を保存
   */
  saveLabelsConfig: (labelsConfig: any, commitMessage: string) =>
    runGasFunction('saveLabelsConfig', labelsConfig, commitMessage),

  /**
   * Git コミット履歴を取得
   */
  getCommitHistory: (filePath?: string, perPage?: number, page?: number) =>
    runGasFunction('getCommitHistory', filePath, perPage, page),

  /**
   * 特定コミットの rules.json を取得
   */
  getRulesAtCommit: (commitSha: string, filePath?: string) =>
    runGasFunction('getRulesAtCommit', commitSha, filePath),

  /**
   * 指定したコミットにロールバック
   */
  rollback: (commitSha: string, filePath?: string) =>
    runGasFunction('rollback', commitSha, filePath),
};
