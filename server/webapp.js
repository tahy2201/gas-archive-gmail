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

    let filterResult = null;
    let archiveResult = null;

    if (rule.type === 'incoming' || rule.type === 'always') {
      filterResult = createGmailFilter(rule);
    }

    if (rule.type === 'existing' || rule.type === 'always') {
      archiveResult = executeRule(rule.id, { dryRun: false });
    }

    const messages = [];
    if (filterResult) {
      messages.push('Filter created successfully');
    }
    if (archiveResult) {
      messages.push(`Processed ${archiveResult.processedCount} messages (${archiveResult.status})`);
    }

    const result = {
      success: true,
      filterId: filterResult ? filterResult.id : null,
      archiveResult: archiveResult,
      processedCount: archiveResult ? archiveResult.processedCount : undefined,
      status: archiveResult ? archiveResult.status : undefined,
      message: messages.join(' / ') || 'No action executed'
    };

    return result;
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
 * 既存メールにルールを適用
 * @param {string} ruleId
 * @param {Object} options
 * @returns {Object} 実行結果
 */
function runArchiveRuleById(ruleId, options) {
  try {
    return executeRule(ruleId, options || {});
  } catch (error) {
    console.error('Error executing rule:', error);
    throw new Error(`Failed to execute rule: ${error.message}`);
  }
}

/**
 * スケジュール対象のルールを実行
 * @param {Object} options
 * @returns {Array<Object>} 実行結果一覧
 */
function runScheduledArchiveRules(options) {
  try {
    return executeScheduledRules(options || {});
  } catch (error) {
    console.error('Error executing scheduled rules:', error);
    throw new Error(`Failed to execute scheduled rules: ${error.message}`);
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

/**
 * Git コミット履歴を取得
 * @param {string} filePath - ファイルパス
 * @param {number} perPage - 1ページあたりの件数
 * @param {number} page - ページ番号
 * @returns {Array} コミット履歴
 */
function getCommitHistory(filePath, perPage, page) {
  try {
    return fetchCommitHistory(filePath, perPage, page);
  } catch (error) {
    console.error('Error getting commit history:', error);
    throw new Error(`Failed to get commit history: ${error.message}`);
  }
}

/**
 * 特定コミットの rules.json を取得
 * @param {string} commitSha - コミットSHA
 * @param {string} filePath - ファイルパス
 * @returns {Object} ルール設定
 */
function getRulesAtCommit(commitSha, filePath) {
  try {
    return fetchRulesAtCommit(commitSha, filePath);
  } catch (error) {
    console.error('Error getting rules at commit:', error);
    throw new Error(`Failed to get rules at commit: ${error.message}`);
  }
}

/**
 * 指定したコミットにロールバック
 * @param {string} commitSha - コミットSHA
 * @param {string} filePath - ファイルパス
 * @returns {Object} 保存結果
 */
function rollback(commitSha, filePath) {
  try {
    return rollbackToCommit(commitSha, filePath);
  } catch (error) {
    console.error('Error rolling back:', error);
    throw new Error(`Failed to rollback: ${error.message}`);
  }
}
