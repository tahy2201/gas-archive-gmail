/**
 * ルール実行エンジン
 * type: existing / always の既存メール処理を司る。
 */

const DEFAULT_RULE_BATCH_SIZE = 50;

/**
 * 単一ルールを実行
 * @param {string} ruleId
 * @param {Object} options
 */
function executeRule(ruleId, options) {
  if (!ruleId) {
    throw new Error('executeRule: ruleId is required');
  }

  const rulesConfig = fetchRulesFromGitHub();
  const rule = (rulesConfig.rules || []).find(r => r.id === ruleId);

  if (!rule) {
    throw new Error(`Rule not found: ${ruleId}`);
  }

  return runArchiveRule(rule, options || {});
}

/**
 * スケジュール対象のルールを一括実行
 * @param {Object} options
 * @returns {Array<Object>} 実行結果
 */
function executeScheduledRules(options) {
  const opts = options || {};
  const rulesConfig = fetchRulesFromGitHub();
  const rules = rulesConfig.rules || [];
  const results = [];

  rules.forEach(rule => {
    if (!rule.enabled) return;
    if (!rule.schedule) return;
    if (!isArchiveCapable(rule)) return;

    try {
      const result = runArchiveRule(rule, opts);
      results.push(result);
    } catch (error) {
      console.error(`Failed to execute scheduled rule ${rule.id}:`, error);
      results.push({
        rule: {
          id: rule.id,
          name: rule.name,
          type: rule.type
        },
        status: 'failed',
        error: error.message
      });
    }
  });

  return results;
}

function runArchiveRule(rule, options) {
  if (!isArchiveCapable(rule)) {
    throw new Error(`Rule ${rule.id} is not archive-capable`);
  }
  if (!rule.enabled) {
    throw new Error(`Rule ${rule.id} is disabled`);
  }

  const actions = getExistingActions(rule);
  const query = getExistingQuery(rule);
  if (!query) {
    throw new Error(`Rule ${rule.id} does not have archive query`);
  }

  const dryRun = options.dryRun === true;
  const batchSize = options.batchSize || DEFAULT_RULE_BATCH_SIZE;
  const timeLimitMs = options.timeLimitMs;

  const logHandle = startExecutionLog({
    ruleId: rule.id,
    ruleName: rule.name,
    query: query
  });

  try {
    const summary = processMessagesInBatches({
      ruleId: rule.id,
      query: query,
      dryRun: dryRun,
      batchSize: batchSize,
      timeLimitMs: timeLimitMs,
      onBatch: (messages) => handleRuleBatch(messages, actions, dryRun)
    });

    updateExecutionLog(logHandle, {
      totalResults: summary.totalResults,
      processedCount: summary.processedCount,
      status: summary.status,
      message: dryRun ? 'Dry run' : ''
    });

    return Object.assign(summary, {
      dryRun: dryRun,
      rule: {
        id: rule.id,
        name: rule.name,
        type: rule.type
      }
    });
  } catch (error) {
    updateExecutionLog(logHandle, {
      status: 'failed',
      message: error.message
    });
    throw error;
  }
}

function handleRuleBatch(messages, actions, dryRun) {
  if (!messages || messages.length === 0) {
    return { processed: 0 };
  }

  if (dryRun) {
    return { processed: messages.length };
  }

  const ids = messages.map(message => message.id);
  const modifyRequest = buildModifyRequest(actions);

  if (modifyRequest.addLabelIds.length > 0 || modifyRequest.removeLabelIds.length > 0) {
    Gmail.Users.Messages.batchModify({
      ids: ids,
      addLabelIds: modifyRequest.addLabelIds.length > 0 ? modifyRequest.addLabelIds : undefined,
      removeLabelIds: modifyRequest.removeLabelIds.length > 0 ? modifyRequest.removeLabelIds : undefined
    }, 'me');
  }

  if (actions.trash) {
    ids.forEach(id => Gmail.Users.Messages.trash('me', id));
  }

  return { processed: ids.length };
}

function buildModifyRequest(actions) {
  const addSet = new Set();
  const removeSet = new Set();

  (actions.addLabelIds || []).forEach(id => addSet.add(id));
  (actions.removeLabelIds || []).forEach(id => removeSet.add(id));

  if (actions.archive) {
    removeSet.add('INBOX');
  }
  if (actions.markRead) {
    removeSet.add('UNREAD');
  }
  if (actions.markUnread) {
    addSet.add('UNREAD');
  }

  return {
    addLabelIds: Array.from(addSet),
    removeLabelIds: Array.from(removeSet)
  };
}

function getExistingActions(rule) {
  if (rule.type === 'always' && rule.existingActions) {
    return rule.existingActions;
  }
  return rule.actions || {};
}

function getExistingQuery(rule) {
  if (rule.type === 'always') {
    return rule.existingQuery || (rule.criteria && rule.criteria.query);
  }
  return rule.criteria ? rule.criteria.query : '';
}

function isArchiveCapable(rule) {
  return rule && (rule.type === 'existing' || rule.type === 'always');
}
