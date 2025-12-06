/**
 * テスト用関数
 */

/**
 * 既存フィルタをエクスポートしてログに出力
 */
function testExportFilters() {
  try {
    console.log('=== Starting filter export ===');

    const result = exportExistingFilters();

    console.log('Export successful!');
    console.log('Rules count:', result.rules.length);
    console.log('');
    console.log('Full result:');
    console.log(JSON.stringify(result, null, 2));

    return result;
  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
}

/**
 * エクスポートして GitHub に保存
 */
function testExportAndSave() {
  try {
    console.log('=== Export and save to GitHub ===');

    // エクスポート
    const rulesConfig = exportExistingFilters();
    console.log('Exported', rulesConfig.rules.length, 'filters');

    // GitHub に保存
    const commitMessage = 'Import existing Gmail filters';
    const result = pushRulesToGitHub(rulesConfig, commitMessage);

    console.log('✅ Saved to GitHub');
    console.log('Commit SHA:', result.commit.sha);

    return result;
  } catch (error) {
    console.error('Failed:', error);
    throw error;
  }
}

/**
 * ラベル一覧を確認（ID と名前の対応）
 */
function testListLabels() {
  try {
    console.log('=== Listing Gmail Labels ===');

    const labels = listGmailLabels();

    console.log('Total labels:', labels.length);
    console.log('');

    // ユーザーラベルのみ表示
    const userLabels = labels.filter(label => label.type === 'user');
    console.log('User labels:', userLabels.length);
    console.log('');

    userLabels.forEach(label => {
      console.log(`${label.id} → ${label.name}`);
    });

    return labels;
  } catch (error) {
    console.error('Failed:', error);
    throw error;
  }
}

/**
 * ラベルをエクスポートして GitHub に保存
 */
function testExportAndSaveLabels() {
  try {
    console.log('=== Export and save labels to GitHub ===');

    // エクスポート
    const labelsConfig = exportLabelsToConfig();
    console.log('Exported', labelsConfig.labels.length, 'labels');

    // GitHub に保存
    const commitMessage = 'Import Gmail labels';
    const result = pushLabelsToGitHub(labelsConfig, commitMessage);

    console.log('✅ Saved to GitHub');
    console.log('Commit SHA:', result.commit.sha);

    return result;
  } catch (error) {
    console.error('Failed:', error);
    throw error;
  }
}

/**
 * メッセージ検索をテスト
 */
function testSearchMessages() {
  try {
    console.log('=== Testing message search ===');

    const sampleQuery = 'in:inbox newer_than:7d';
    const result = searchMessages(sampleQuery, {
      maxResults: 20,
      fetchFullMessage: true
    });

    console.log('Query:', sampleQuery);
    console.log('Retrieved:', result.retrievedCount);
    console.log('Total estimate:', result.totalResults);
    console.log('Next page token:', result.nextPageToken || 'none');

    // メッセージが0件だった場合
    if (result.messages.length === 0) {
      console.log('No messages returned.');
    } else {
      result.messages.forEach(msg => {
        console.log('---');
        console.log(`ID: ${msg.id}`);
        console.log(`Thread ID: ${msg.threadId}`);
        console.log(`Snippet: ${msg.snippet}`);
        console.log(`Internal Date: ${msg.internalDate || 'unknown'}`);

        if (msg.headers) {
          if (msg.headers.Subject) {
            console.log(`Subject: ${msg.headers.Subject}`);
          }
          if (msg.headers.From) {
            console.log(`From: ${msg.headers.From}`);
          }
        }
      });
    }

    return result;
  } catch (error) {
    console.error('Message search failed:', error);
    throw error;
  }
}

/**
 * 既存メール用ルールを実行（ドライラン）
 */
function testExecuteRule() {
  try {
    const ruleId = Browser.inputBox('実行するルールIDを入力してください（キャンセルで中止）');
    if (!ruleId || ruleId === 'cancel') {
      console.log('Rule execution canceled');
      return;
    }

    console.log('=== Executing rule (dry run) ===', ruleId);
    const result = executeRule(ruleId, {
      dryRun: true,
      batchSize: 20
    });

    console.log('Rule:', result.rule);
    console.log('Status:', result.status);
    console.log('Processed:', result.processedCount);
    console.log('Total estimate:', result.totalResults);
    console.log('Dry run:', result.dryRun);

    return result;
  } catch (error) {
    console.error('Rule execution failed:', error);
    throw error;
  }
}
