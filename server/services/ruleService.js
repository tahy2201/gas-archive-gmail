/**
 * ルール管理サービス
 * Gmail フィルタと GitHub rules.json を統合管理
 */

/**
 * 既存の Gmail フィルタをエクスポート
 * @returns {Object} rules.json 形式のオブジェクト
 */
function exportExistingFilters() {
  try {
    const gmailFilters = listGmailFilters();
    const rules = [];

    gmailFilters.forEach((filter, index) => {
      // Gmail Filter を Rule 形式に変換
      const rule = {
        id: `imported_filter_${Date.now()}_${index}`,
        type: 'filter',
        enabled: true,
        name: generateFilterName(filter.criteria),
        description: `Imported from Gmail filter ${filter.id}`,
        criteria: filter.criteria || {},
        actions: filter.action || {},
        applyToExisting: false,
        schedule: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _originalFilterId: filter.id // Gmail の元のフィルタID（参照用）
      };

      // ラベルIDはそのまま保存
      rules.push(rule);
    });

    return {
      version: '2.0.0',
      lastUpdated: new Date().toISOString(),
      rules: rules
    };
  } catch (error) {
    console.error('Error exporting filters:', error);
    throw new Error(`Failed to export filters: ${error.message}`);
  }
}

/**
 * フィルタ条件から人間が読みやすい名前を生成
 * @param {Object} criteria - フィルタ条件
 * @returns {string} フィルタ名
 */
function generateFilterName(criteria) {
  if (!criteria) return 'Unnamed Filter';

  const parts = [];

  if (criteria.from) parts.push(`From: ${criteria.from}`);
  if (criteria.to) parts.push(`To: ${criteria.to}`);
  if (criteria.subject) parts.push(`Subject: ${criteria.subject}`);
  if (criteria.query) parts.push(`Query: ${criteria.query}`);
  if (criteria.hasAttachment) parts.push('Has attachment');

  return parts.length > 0 ? parts.join(', ') : 'Unnamed Filter';
}

/**
 * ルールIDを生成
 * @param {string} userSpecifiedId - ユーザー指定ID（オプション）
 * @param {string} type - ルールタイプ（filter, archive, both）
 * @param {Array} existingRules - 既存ルール（重複チェック用）
 * @returns {string} ルールID
 */
function generateRuleId(userSpecifiedId, type, existingRules) {
  if (userSpecifiedId) {
    // ユーザー指定がある場合はサニタイズして使用
    const sanitized = userSpecifiedId
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .substring(0, 50);

    // 重複チェック
    if (existingRules && existingRules.some(r => r.id === sanitized)) {
      throw new Error(`Rule ID "${sanitized}" already exists`);
    }

    return sanitized;
  }

  // 自動生成: {prefix}_{timestamp}_{hash}
  const prefix = type === 'archive' ? 'archive' : type === 'both' ? 'both' : 'filter';
  const timestamp = Math.floor(Date.now() / 1000);
  const hash = Math.random().toString(36).substring(2, 5);

  return `${prefix}_${timestamp}_${hash}`;
}

/**
 * ルールを検証
 * @param {Object} rule - ルールオブジェクト
 * @returns {Object} 検証結果 { valid: boolean, errors: string[] }
 */
function validateRule(rule) {
  const errors = [];

  // 必須フィールドチェック
  if (!rule.id) errors.push('id is required');
  if (!rule.type) errors.push('type is required');
  if (!['filter', 'archive', 'both'].includes(rule.type)) {
    errors.push('type must be "filter", "archive", or "both"');
  }
  if (rule.enabled === undefined) errors.push('enabled is required');
  if (!rule.name) errors.push('name is required');
  if (!rule.criteria) errors.push('criteria is required');
  if (!rule.actions) errors.push('actions is required');

  // type=both の場合は archiveQuery が必要
  if (rule.type === 'both' && !rule.archiveQuery) {
    errors.push('archiveQuery is required for type "both"');
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * ルールを正規化（デフォルト値を設定）
 * @param {Object} rule - ルールオブジェクト
 * @returns {Object} 正規化されたルール
 */
function normalizeRule(rule) {
  const now = new Date().toISOString();

  return {
    id: rule.id,
    type: rule.type,
    enabled: rule.enabled !== false, // デフォルト true
    name: rule.name,
    description: rule.description || '',
    criteria: rule.criteria || {},
    actions: rule.actions || {},
    applyToExisting: rule.applyToExisting || false,
    schedule: rule.schedule || null,
    archiveQuery: rule.archiveQuery || null,
    archiveActions: rule.archiveActions || null,
    createdAt: rule.createdAt || now,
    updatedAt: now
  };
}

/**
 * ルールを Gmail と GitHub に同期
 * @param {boolean} dryRun - ドライランモード（true の場合は変更を適用しない）
 * @returns {Object} 同期結果
 */
function syncRulesToGmail(dryRun) {
  try {
    // GitHub からルールを取得
    const rulesConfig = fetchRulesFromGitHub();
    const githubRules = rulesConfig.rules || [];

    // Gmail の既存フィルタを取得
    const gmailFilters = listGmailFilters();

    // 差分を検出
    const diff = detectRuleDiff(githubRules, gmailFilters);

    console.log(formatDiffSummary(diff));

    if (dryRun) {
      return {
        dryRun: true,
        diff: diff,
        summary: diff.summary,
        message: 'Dry run completed. No changes were applied.'
      };
    }

    const results = {
      created: [],
      updated: [],
      deleted: [],
      errors: []
    };

    // 新規作成
    diff.toCreate.forEach(rule => {
      try {
        const filter = createGmailFilter(rule);

        // ルールに Gmail フィルタID を保存
        rule._originalFilterId = filter.id;

        results.created.push({
          ruleId: rule.id,
          filterId: filter.id,
          name: rule.name
        });

        console.log(`✅ Created filter: [${rule.id}] ${rule.name}`);
      } catch (error) {
        console.error(`❌ Failed to create filter: [${rule.id}]`, error);
        results.errors.push({
          ruleId: rule.id,
          operation: 'create',
          error: error.message
        });
      }
    });

    // 更新
    diff.toUpdate.forEach(item => {
      try {
        // Gmail API では既存フィルタの更新はサポートされていない
        // そのため、削除→再作成を行う
        deleteGmailFilter(item.existingFilter.id);
        const newFilter = createGmailFilter(item.rule);

        // ルールに新しい Gmail フィルタID を保存
        item.rule._originalFilterId = newFilter.id;

        results.updated.push({
          ruleId: item.rule.id,
          oldFilterId: item.existingFilter.id,
          newFilterId: newFilter.id,
          name: item.rule.name
        });

        console.log(`✅ Updated filter: [${item.rule.id}] ${item.rule.name}`);
      } catch (error) {
        console.error(`❌ Failed to update filter: [${item.rule.id}]`, error);
        results.errors.push({
          ruleId: item.rule.id,
          operation: 'update',
          error: error.message
        });
      }
    });

    // 削除
    diff.toDelete.forEach(filter => {
      try {
        deleteGmailFilter(filter.id);

        results.deleted.push({
          filterId: filter.id
        });

        console.log(`✅ Deleted filter: ${filter.id}`);
      } catch (error) {
        console.error(`❌ Failed to delete filter: ${filter.id}`, error);
        results.errors.push({
          filterId: filter.id,
          operation: 'delete',
          error: error.message
        });
      }
    });

    // GitHub の rules.json を更新（_originalFilterId を保存）
    if (results.created.length > 0 || results.updated.length > 0) {
      try {
        pushRulesToGitHub(rulesConfig, 'Auto-sync: Update filter IDs from Gmail');
        console.log('✅ Updated rules.json with Gmail filter IDs');
      } catch (error) {
        console.error('⚠️ Failed to update rules.json:', error);
        results.errors.push({
          operation: 'github_update',
          error: error.message
        });
      }
    }

    return {
      dryRun: false,
      results: results,
      summary: {
        created: results.created.length,
        updated: results.updated.length,
        deleted: results.deleted.length,
        errors: results.errors.length,
        unchanged: diff.unchanged.length
      },
      message: `Sync completed. ${results.created.length} created, ${results.updated.length} updated, ${results.deleted.length} deleted.`
    };
  } catch (error) {
    console.error('Error syncing rules:', error);
    throw new Error(`Failed to sync rules: ${error.message}`);
  }
}
