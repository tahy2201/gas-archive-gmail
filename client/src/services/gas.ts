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
};
