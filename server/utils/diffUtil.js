/**
 * 差分検出ユーティリティ
 * Gmail フィルタと GitHub rules.json の差分を検出
 */

/**
 * ルール差分を検出
 * @param {Array} githubRules - GitHub の rules.json から取得したルール配列
 * @param {Array} gmailFilters - Gmail API から取得したフィルタ配列
 * @returns {Object} 差分情報
 */
function detectRuleDiff(githubRules, gmailFilters) {
  const toCreate = []; // GitHub にあるが Gmail にないルール
  const toUpdate = []; // 両方にあるが内容が異なるルール
  const toDelete = []; // Gmail にあるが GitHub にないフィルタ
  const unchanged = []; // 変更なし

  // Gmail フィルタを ID でマップ化
  const gmailFilterMap = new Map();
  gmailFilters.forEach(filter => {
    gmailFilterMap.set(filter.id, filter);
  });

  // GitHub ルールを処理
  githubRules.forEach(rule => {
    // type が incoming または always のみ Gmail フィルタとして同期
    if (rule.type !== 'incoming' && rule.type !== 'always') {
      return;
    }

    if (!rule.enabled) {
      return; // 無効なルールはスキップ
    }

    // _originalFilterId があれば、それを使って既存フィルタを検索
    const originalFilterId = rule._originalFilterId;
    const existingFilter = originalFilterId ? gmailFilterMap.get(originalFilterId) : null;

    if (existingFilter) {
      // 既存フィルタが見つかった場合、内容を比較
      if (isFilterDifferent(rule, existingFilter)) {
        toUpdate.push({
          rule: rule,
          existingFilter: existingFilter,
          changes: getFilterChanges(rule, existingFilter)
        });
      } else {
        unchanged.push({
          rule: rule,
          existingFilter: existingFilter
        });
      }

      // 処理済みとしてマークを削除
      gmailFilterMap.delete(originalFilterId);
    } else {
      // 新規作成が必要
      toCreate.push(rule);
    }
  });

  // 残っている Gmail フィルタは削除対象
  gmailFilterMap.forEach(filter => {
    toDelete.push(filter);
  });

  return {
    toCreate: toCreate,
    toUpdate: toUpdate,
    toDelete: toDelete,
    unchanged: unchanged,
    summary: {
      create: toCreate.length,
      update: toUpdate.length,
      delete: toDelete.length,
      unchanged: unchanged.length,
      total: toCreate.length + toUpdate.length + toDelete.length
    }
  };
}

/**
 * フィルタ内容が異なるかチェック
 * @param {Object} rule - GitHub ルール
 * @param {Object} gmailFilter - Gmail フィルタ
 * @returns {boolean} 異なる場合 true
 */
function isFilterDifferent(rule, gmailFilter) {
  // criteria の比較
  if (!deepEqual(rule.criteria, gmailFilter.criteria)) {
    return true;
  }

  // actions の比較
  if (!deepEqual(rule.actions, gmailFilter.action)) {
    return true;
  }

  return false;
}

/**
 * フィルタの変更内容を取得
 * @param {Object} rule - GitHub ルール
 * @param {Object} gmailFilter - Gmail フィルタ
 * @returns {Array} 変更内容の配列
 */
function getFilterChanges(rule, gmailFilter) {
  const changes = [];

  // criteria の変更
  const criteriaChanges = getObjectDiff(rule.criteria, gmailFilter.criteria);
  if (criteriaChanges.length > 0) {
    changes.push({
      field: 'criteria',
      changes: criteriaChanges
    });
  }

  // actions の変更
  const actionChanges = getObjectDiff(rule.actions, gmailFilter.action);
  if (actionChanges.length > 0) {
    changes.push({
      field: 'actions',
      changes: actionChanges
    });
  }

  return changes;
}

/**
 * オブジェクトの差分を取得
 * @param {Object} newObj - 新しいオブジェクト
 * @param {Object} oldObj - 古いオブジェクト
 * @returns {Array} 変更内容の配列
 */
function getObjectDiff(newObj, oldObj) {
  const changes = [];

  // すべてのキーを収集
  const allKeys = new Set([
    ...Object.keys(newObj || {}),
    ...Object.keys(oldObj || {})
  ]);

  allKeys.forEach(key => {
    const newValue = newObj ? newObj[key] : undefined;
    const oldValue = oldObj ? oldObj[key] : undefined;

    if (!deepEqual(newValue, oldValue)) {
      changes.push({
        key: key,
        oldValue: oldValue,
        newValue: newValue
      });
    }
  });

  return changes;
}

/**
 * 深い等価性チェック
 * @param {*} obj1 - オブジェクト1
 * @param {*} obj2 - オブジェクト2
 * @returns {boolean} 等しい場合 true
 */
function deepEqual(obj1, obj2) {
  if (obj1 === obj2) return true;

  if (obj1 == null || obj2 == null) return obj1 === obj2;

  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return obj1 === obj2;
  }

  // 配列の場合
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) return false;

    for (let i = 0; i < obj1.length; i++) {
      if (!deepEqual(obj1[i], obj2[i])) return false;
    }

    return true;
  }

  // オブジェクトの場合
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
}

/**
 * 差分サマリーをフォーマット
 * @param {Object} diff - detectRuleDiff の戻り値
 * @returns {string} フォーマットされたサマリー
 */
function formatDiffSummary(diff) {
  const lines = [];

  lines.push('=== Sync Summary ===');
  lines.push(`Total changes: ${diff.summary.total}`);
  lines.push(`  - To create: ${diff.summary.create}`);
  lines.push(`  - To update: ${diff.summary.update}`);
  lines.push(`  - To delete: ${diff.summary.delete}`);
  lines.push(`  - Unchanged: ${diff.summary.unchanged}`);

  if (diff.toCreate.length > 0) {
    lines.push('');
    lines.push('To Create:');
    diff.toCreate.forEach(rule => {
      lines.push(`  - [${rule.id}] ${rule.name}`);
    });
  }

  if (diff.toUpdate.length > 0) {
    lines.push('');
    lines.push('To Update:');
    diff.toUpdate.forEach(item => {
      lines.push(`  - [${item.rule.id}] ${item.rule.name}`);
      item.changes.forEach(change => {
        lines.push(`      ${change.field} changed`);
      });
    });
  }

  if (diff.toDelete.length > 0) {
    lines.push('');
    lines.push('To Delete:');
    diff.toDelete.forEach(filter => {
      lines.push(`  - [${filter.id}]`);
    });
  }

  return lines.join('\n');
}
