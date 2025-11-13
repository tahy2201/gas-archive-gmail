/**
 * GitHub API 操作モジュール
 */

/**
 * GitHub から rules.json を取得
 * @returns {Object} ルール設定オブジェクト
 */
function fetchRulesFromGitHub() {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const token = scriptProperties.getProperty('GITHUB_TOKEN');
    const owner = scriptProperties.getProperty('GITHUB_REPO_OWNER');
    const repo = scriptProperties.getProperty('GITHUB_REPO_NAME');

    if (!token || !owner || !repo) {
      throw new Error('GitHub settings not configured');
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/rules.json`;
    const response = UrlFetchApp.fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      muteHttpExceptions: true
    });

    const statusCode = response.getResponseCode();
    if (statusCode !== 200) {
      throw new Error(`GitHub API error: ${statusCode} - ${response.getContentText()}`);
    }

    const data = JSON.parse(response.getContentText());
    const content = Utilities.newBlob(Utilities.base64Decode(data.content)).getDataAsString();
    return JSON.parse(content);
  } catch (error) {
    console.error('Error fetching rules from GitHub:', error);
    throw error;
  }
}

/**
 * GitHub に rules.json をコミット・プッシュ
 * @param {Object} rules - ルール設定オブジェクト
 * @param {string} commitMessage - コミットメッセージ
 * @returns {Object} GitHub API レスポンス
 */
function pushRulesToGitHub(rules, commitMessage) {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const token = scriptProperties.getProperty('GITHUB_TOKEN');
    const owner = scriptProperties.getProperty('GITHUB_REPO_OWNER');
    const repo = scriptProperties.getProperty('GITHUB_REPO_NAME');

    if (!token || !owner || !repo) {
      throw new Error('GitHub settings not configured');
    }

    // 現在のファイルのSHAを取得
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/rules.json`;
    const getResponse = UrlFetchApp.fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      muteHttpExceptions: true
    });

    let sha = null;
    if (getResponse.getResponseCode() === 200) {
      const data = JSON.parse(getResponse.getContentText());
      sha = data.sha;
    }

    // ファイルを更新
    const content = Utilities.base64Encode(JSON.stringify(rules, null, 2));
    const payload = {
      message: commitMessage,
      content: content,
      sha: sha
    };

    const putResponse = UrlFetchApp.fetch(url, {
      method: 'put',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const statusCode = putResponse.getResponseCode();
    if (statusCode !== 200 && statusCode !== 201) {
      throw new Error(`GitHub API error: ${statusCode} - ${putResponse.getContentText()}`);
    }

    return JSON.parse(putResponse.getContentText());
  } catch (error) {
    console.error('Error pushing rules to GitHub:', error);
    throw error;
  }
}
