function testGmailAPI() {
  try {
    // Gmail API が有効かテスト
    const response = Gmail.Users.Labels.list('me');
    console.log('Gmail API is working!');
    console.log('Found ' + response.labels.length + ' labels');
    return 'Success: Gmail API is enabled';
  } catch (error) {
    console.error('Error:', error);
    return 'Error: ' + error.message;
  }
}

/**
 * GitHub トークンを Script Properties に設定する
 * ⚠️ この関数は一度だけ実行してください
 */
function setupGitHubToken() {
  const token = Browser.inputBox(
    'GitHub Personal Access Token を入力してください',
    'github_pat_ で始まるトークンを貼り付けてください',
    Browser.Buttons.OK_CANCEL
  );

  if (token === 'cancel') {
    console.log('キャンセルされました');
    return;
  }

  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperties({
    'GITHUB_TOKEN': token,
    'GITHUB_REPO_OWNER': 'tahy2201',
    'GITHUB_REPO_NAME': 'gmail-config-private'
  });

  console.log('✅ GitHub 設定が完了しました');
  return 'Success: GitHub token configured';
}

/**
 * GitHub 設定をテストする
 */
function testGitHubConnection() {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const token = scriptProperties.getProperty('GITHUB_TOKEN');
    const owner = scriptProperties.getProperty('GITHUB_REPO_OWNER');
    const repo = scriptProperties.getProperty('GITHUB_REPO_NAME');

    if (!token || !owner || !repo) {
      throw new Error('GitHub 設定が見つかりません。setupGitHubToken() を実行してください。');
    }

    console.log('Owner:', owner);
    console.log('Repo:', repo);
    console.log('Token:', token.substring(0, 20) + '...');

    // GitHub API でリポジトリ情報を取得
    const url = `https://api.github.com/repos/${owner}/${repo}`;
    const response = UrlFetchApp.fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      muteHttpExceptions: true
    });

    const statusCode = response.getResponseCode();
    console.log('Status Code:', statusCode);

    if (statusCode === 200) {
      const repoInfo = JSON.parse(response.getContentText());
      console.log('✅ Repository:', repoInfo.full_name);
      console.log('✅ Private:', repoInfo.private);
      return 'Success: GitHub connection verified';
    } else {
      const errorText = response.getContentText();
      console.error('Error:', errorText);
      return 'Error: ' + statusCode + ' - ' + errorText;
    }
  } catch (error) {
    console.error('Error:', error);
    return 'Error: ' + error.message;
  }
}