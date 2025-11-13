/**
 * Gmail API 操作モジュール
 */

/**
 * Gmail フィルタを作成
 * @param {Object} rule - ルール定義
 * @returns {Object} 作成されたフィルタ
 */
function createGmailFilter(rule) {
  try {
    const filter = {
      criteria: rule.criteria,
      action: rule.actions
    };

    const response = Gmail.Users.Settings.Filters.create(filter, 'me');
    console.log('Filter created:', response.id);
    return response;
  } catch (error) {
    console.error('Error creating filter:', error);
    throw error;
  }
}

/**
 * Gmail フィルタを削除
 * @param {string} filterId - フィルタID
 */
function deleteGmailFilter(filterId) {
  try {
    Gmail.Users.Settings.Filters.remove('me', filterId);
    console.log('Filter deleted:', filterId);
  } catch (error) {
    console.error('Error deleting filter:', error);
    throw error;
  }
}

/**
 * すべての Gmail フィルタを取得
 * @returns {Array} フィルタ一覧
 */
function listGmailFilters() {
  try {
    const response = Gmail.Users.Settings.Filters.list('me');
    return response.filter || [];
  } catch (error) {
    console.error('Error listing filters:', error);
    throw error;
  }
}

/**
 * アーカイブルールを実行
 * @param {Object} rule - ルール定義
 * @returns {number} 処理したメール数
 */
function executeArchiveRule(rule) {
  try {
    const query = rule.criteria.query;
    const threads = GmailApp.search(query, 0, 100); // 最大100件

    let count = 0;
    threads.forEach(thread => {
      const messages = thread.getMessages();

      messages.forEach(message => {
        // アーカイブ
        if (rule.actions.archive) {
          thread.moveToArchive();
        }

        // ラベル追加
        if (rule.actions.addLabelIds && rule.actions.addLabelIds.length > 0) {
          rule.actions.addLabelIds.forEach(labelName => {
            const label = GmailApp.getUserLabelByName(labelName) || GmailApp.createLabel(labelName);
            thread.addLabel(label);
          });
        }

        // ラベル削除
        if (rule.actions.removeLabelIds && rule.actions.removeLabelIds.length > 0) {
          rule.actions.removeLabelIds.forEach(labelName => {
            const label = GmailApp.getUserLabelByName(labelName);
            if (label) {
              thread.removeLabel(label);
            }
          });
        }

        // ゴミ箱
        if (rule.actions.trash) {
          thread.moveToTrash();
        }

        count++;
      });
    });

    console.log(`Archive rule executed: ${count} messages processed`);
    return count;
  } catch (error) {
    console.error('Error executing archive rule:', error);
    throw error;
  }
}

/**
 * すべてのラベルを取得
 * @returns {Array} ラベル一覧
 */
function listGmailLabels() {
  try {
    const response = Gmail.Users.Labels.list('me');
    return response.labels || [];
  } catch (error) {
    console.error('Error listing labels:', error);
    throw error;
  }
}
