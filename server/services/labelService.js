/**
 * ラベル管理サービス
 * Gmail ラベルと GitHub labels.json を統合管理
 */

/**
 * Gmail のラベルをエクスポート
 * @returns {Object} labels.json 形式のオブジェクト
 */
function exportLabelsToConfig() {
  try {
    const gmailLabels = listGmailLabels();

    // labels.json 形式に変換
    const labels = gmailLabels.map(label => ({
      id: label.id,
      name: label.name,
      type: label.type,
      color: label.color || null,
      messageListVisibility: label.messageListVisibility || null,
      labelListVisibility: label.labelListVisibility || null
    }));

    return {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      labels: labels
    };
  } catch (error) {
    console.error('Error exporting labels:', error);
    throw new Error(`Failed to export labels: ${error.message}`);
  }
}

/**
 * GitHub から labels.json を取得
 * @returns {Object} labels.json の内容
 */
function fetchLabelsFromGitHub() {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const token = scriptProperties.getProperty('GITHUB_TOKEN');
    const owner = scriptProperties.getProperty('GITHUB_REPO_OWNER');
    const repo = scriptProperties.getProperty('GITHUB_REPO_NAME');

    if (!token || !owner || !repo) {
      throw new Error('GitHub configuration not found. Please run setupGitHubToken()');
    }

    const url = `https://api.github.com/repos/${owner}/${repo}/contents/labels.json`;

    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      muteHttpExceptions: true
    });

    const statusCode = response.getResponseCode();

    if (statusCode === 200) {
      const data = JSON.parse(response.getContentText());
      const content = Utilities.newBlob(Utilities.base64Decode(data.content))
        .getDataAsString('UTF-8');

      return JSON.parse(content);
    } else if (statusCode === 404) {
      // labels.json が存在しない場合は空のオブジェクトを返す
      console.log('labels.json not found. Returning empty config.');
      return {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        labels: []
      };
    } else {
      const errorText = response.getContentText();
      throw new Error(`GitHub API error (${statusCode}): ${errorText}`);
    }
  } catch (error) {
    console.error('Error fetching labels from GitHub:', error);
    throw new Error(`Failed to fetch labels from GitHub: ${error.message}`);
  }
}

/**
 * labels.json を GitHub にプッシュ
 * @param {Object} labelsConfig - labels.json の内容
 * @param {string} commitMessage - コミットメッセージ
 * @returns {Object} GitHub API のレスポンス
 */
function pushLabelsToGitHub(labelsConfig, commitMessage) {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const token = scriptProperties.getProperty('GITHUB_TOKEN');
    const owner = scriptProperties.getProperty('GITHUB_REPO_OWNER');
    const repo = scriptProperties.getProperty('GITHUB_REPO_NAME');

    if (!token || !owner || !repo) {
      throw new Error('GitHub configuration not found');
    }

    // 現在のファイルの SHA を取得（更新時に必要）
    const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/labels.json`;
    let sha = null;

    const getResponse = UrlFetchApp.fetch(fileUrl, {
      method: 'get',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      muteHttpExceptions: true
    });

    if (getResponse.getResponseCode() === 200) {
      const data = JSON.parse(getResponse.getContentText());
      sha = data.sha;
    }

    // UTF-8 でエンコード
    const jsonString = JSON.stringify(labelsConfig, null, 2);
    const blob = Utilities.newBlob('').setDataFromString(jsonString, 'UTF-8');
    const content = Utilities.base64Encode(blob.getBytes());

    // GitHub に保存
    const payload = {
      message: commitMessage,
      content: content,
      branch: 'main'
    };

    if (sha) {
      payload.sha = sha; // 更新の場合は SHA が必要
    }

    const response = UrlFetchApp.fetch(fileUrl, {
      method: 'put',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const statusCode = response.getResponseCode();

    if (statusCode === 200 || statusCode === 201) {
      const result = JSON.parse(response.getContentText());
      console.log('✅ Labels saved to GitHub:', result.commit.sha);
      return result;
    } else {
      const errorText = response.getContentText();
      throw new Error(`GitHub API error (${statusCode}): ${errorText}`);
    }
  } catch (error) {
    console.error('Error pushing labels to GitHub:', error);
    throw new Error(`Failed to push labels to GitHub: ${error.message}`);
  }
}
