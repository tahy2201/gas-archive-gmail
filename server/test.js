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
