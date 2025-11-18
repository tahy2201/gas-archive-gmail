/**
 * Web アプリケーション エントリーポイント
 */

/**
 * Web アプリのGETリクエストハンドラ
 * @param {Object} e - イベントオブジェクト
 * @returns {HtmlOutput} HTML出力
 */
function doGet(e) {
  try {
    // index.html を UTF-8 で読み込んで返す
    const template = HtmlService.createTemplateFromFile('index');
    const html = template.evaluate()
      .setTitle('Gmail Filter Manager')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

    return html;
  } catch (error) {
    console.error('Error in doGet:', error);
    return HtmlService.createHtmlOutput(`
      <h1>Error</h1>
      <p>${error.message}</p>
    `);
  }
}

/**
 * クライアントから呼び出されるAPI関数群
 */

/**
 * ルール一覧を取得
 * @returns {Object} ルール設定
 */
function getRules() {
  try {
    return fetchRulesFromGitHub();
  } catch (error) {
    console.error('Error getting rules:', error);
    throw new Error(`Failed to get rules: ${error.message}`);
  }
}

/**
 * ルールを保存
 * @param {Object} rules - ルール設定
 * @param {string} commitMessage - コミットメッセージ
 * @returns {Object} 保存結果
 */
function saveRules(rules, commitMessage) {
  try {
    // タイムスタンプ更新
    rules.lastUpdated = new Date().toISOString();

    // GitHub にプッシュ
    const response = pushRulesToGitHub(rules, commitMessage || 'Update rules via web UI');

    return {
      success: true,
      commit: response.commit
    };
  } catch (error) {
    console.error('Error saving rules:', error);
    throw new Error(`Failed to save rules: ${error.message}`);
  }
}

/**
 * ラベル一覧を取得
 * @returns {Array} ラベル一覧
 */
function getLabels() {
  try {
    return listGmailLabels();
  } catch (error) {
    console.error('Error getting labels:', error);
    throw new Error(`Failed to get labels: ${error.message}`);
  }
}

/**
 * フィルタを適用
 * @param {string} ruleId - ルールID
 * @returns {Object} 実行結果
 */
function applyFilter(ruleId) {
  try {
    const rules = fetchRulesFromGitHub();
    const rule = rules.rules.find(r => r.id === ruleId);

    if (!rule) {
      throw new Error(`Rule not found: ${ruleId}`);
    }

    if (!rule.enabled) {
      throw new Error(`Rule is disabled: ${ruleId}`);
    }

    if (rule.type === 'filter' || rule.type === 'both') {
      // フィルタ作成
      const filter = createGmailFilter(rule);
      return {
        success: true,
        filterId: filter.id,
        message: 'Filter created successfully'
      };
    }

    if (rule.type === 'archive' || rule.type === 'both') {
      // アーカイブルール実行
      const count = executeArchiveRule(rule);
      return {
        success: true,
        processedCount: count,
        message: `Processed ${count} messages`
      };
    }

    throw new Error(`Unknown rule type: ${rule.type}`);
  } catch (error) {
    console.error('Error applying filter:', error);
    throw new Error(`Failed to apply filter: ${error.message}`);
  }
}

/**
 * 現在のユーザー情報を取得
 * @returns {Object} ユーザー情報
 */
function getCurrentUser() {
  try {
    const email = Session.getActiveUser().getEmail();
    return {
      email: email
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    throw new Error(`Failed to get current user: ${error.message}`);
  }
}

/**
 * 既存の Gmail フィルタをエクスポート
 * @returns {Object} rules.json 形式
 */
function exportFilters() {
  try {
    return exportExistingFilters();
  } catch (error) {
    console.error('Error exporting filters:', error);
    throw new Error(`Failed to export filters: ${error.message}`);
  }
}

/**
 * ルールを Gmail に同期
 * @param {boolean} dryRun - ドライランモード
 * @returns {Object} 同期結果
 */
function syncRules(dryRun) {
  try {
    return syncRulesToGmail(dryRun || false);
  } catch (error) {
    console.error('Error syncing rules:', error);
    throw new Error(`Failed to sync rules: ${error.message}`);
  }
}

/**
 * ラベルをエクスポート
 * @returns {Object} labels.json 形式
 */
function exportLabels() {
  try {
    return exportLabelsToConfig();
  } catch (error) {
    console.error('Error exporting labels:', error);
    throw new Error(`Failed to export labels: ${error.message}`);
  }
}

/**
 * labels.json を GitHub から取得
 * @returns {Object} labels.json の内容
 */
function getLabelsConfig() {
  try {
    return fetchLabelsFromGitHub();
  } catch (error) {
    console.error('Error getting labels config:', error);
    throw new Error(`Failed to get labels config: ${error.message}`);
  }
}

/**
 * labels.json を GitHub に保存
 * @param {Object} labelsConfig - labels.json の内容
 * @param {string} commitMessage - コミットメッセージ
 * @returns {Object} 保存結果
 */
function saveLabelsConfig(labelsConfig, commitMessage) {
  try {
    return pushLabelsToGitHub(labelsConfig, commitMessage);
  } catch (error) {
    console.error('Error saving labels config:', error);
    throw new Error(`Failed to save labels config: ${error.message}`);
  }
}
