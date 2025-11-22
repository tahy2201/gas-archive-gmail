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
    const content = Utilities.newBlob(Utilities.base64Decode(data.content)).getDataAsString('UTF-8');
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

    // ファイルを更新（UTF-8でエンコード）
    const jsonString = JSON.stringify(rules, null, 2);
    const blob = Utilities.newBlob('').setDataFromString(jsonString, 'UTF-8');
    const content = Utilities.base64Encode(blob.getBytes());
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

/**
 * GitHub のコミット履歴を取得
 * @param {string} filePath - ファイルパス（デフォルト: rules.json）
 * @param {number} perPage - 1ページあたりの件数（デフォルト: 30）
 * @param {number} page - ページ番号（デフォルト: 1）
 * @returns {Array} コミット履歴の配列
 */
function fetchCommitHistory(filePath, perPage, page) {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const token = scriptProperties.getProperty('GITHUB_TOKEN');
    const owner = scriptProperties.getProperty('GITHUB_REPO_OWNER');
    const repo = scriptProperties.getProperty('GITHUB_REPO_NAME');

    if (!token || !owner || !repo) {
      throw new Error('GitHub settings not configured');
    }

    const path = filePath || 'rules.json';
    const perPageParam = perPage || 30;
    const pageParam = page || 1;

    const url = `https://api.github.com/repos/${owner}/${repo}/commits?path=${path}&per_page=${perPageParam}&page=${pageParam}`;

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

    const commits = JSON.parse(response.getContentText());

    // 必要な情報のみを抽出して返す
    return commits.map(commit => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: {
        name: commit.commit.author.name,
        email: commit.commit.author.email,
        date: commit.commit.author.date
      },
      committer: {
        name: commit.commit.committer.name,
        date: commit.commit.committer.date
      }
    }));
  } catch (error) {
    console.error('Error fetching commit history:', error);
    throw error;
  }
}

/**
 * 特定のコミットの rules.json を取得
 * @param {string} commitSha - コミットSHA
 * @param {string} filePath - ファイルパス（デフォルト: rules.json）
 * @returns {Object} ルール設定オブジェクト
 */
function fetchRulesAtCommit(commitSha, filePath) {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const token = scriptProperties.getProperty('GITHUB_TOKEN');
    const owner = scriptProperties.getProperty('GITHUB_REPO_OWNER');
    const repo = scriptProperties.getProperty('GITHUB_REPO_NAME');

    if (!token || !owner || !repo) {
      throw new Error('GitHub settings not configured');
    }

    const path = filePath || 'rules.json';
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${commitSha}`;

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
    const content = Utilities.newBlob(Utilities.base64Decode(data.content)).getDataAsString('UTF-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error fetching rules at commit:', error);
    throw error;
  }
}

/**
 * 指定したコミットの内容でロールバック
 * @param {string} commitSha - ロールバック先のコミットSHA
 * @param {string} filePath - ファイルパス（デフォルト: rules.json）
 * @returns {Object} GitHub API レスポンス
 */
function rollbackToCommit(commitSha, filePath) {
  try {
    const path = filePath || 'rules.json';

    // 指定したコミットの内容を取得
    const rules = fetchRulesAtCommit(commitSha, path);

    // ロールバックメッセージを生成
    const commitMessage = `Rollback to ${commitSha.substring(0, 7)}\n\nRolled back ${path} to commit ${commitSha}`;

    // 新しいコミットとして保存
    return pushRulesToGitHub(rules, commitMessage);
  } catch (error) {
    console.error('Error rolling back to commit:', error);
    throw error;
  }
}
