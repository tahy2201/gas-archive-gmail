/**
 * バッチ処理エンジン
 * GAS の実行制限に合わせてページングしながらメッセージを処理する。
 */

const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_TIME_LIMIT_MS = 5 * 60 * 1000; // 5分
const EXECUTION_BUFFER_MS = 30 * 1000; // 終了前余裕
const EXECUTION_STATE_KEY_PREFIX = 'RULE_EXECUTION_STATE_';

/**
 * メッセージをバッチ処理
 * @param {Object} params
 * @param {string} params.ruleId
 * @param {string} params.query
 * @param {boolean} [params.dryRun=false]
 * @param {number} [params.batchSize=50]
 * @param {number} [params.timeLimitMs=5*60*1000]
 * @param {function(Object[], Object):Object} params.onBatch - 各バッチ処理ハンドラ
 * @returns {Object} 処理サマリ
 */
function processMessagesInBatches(params) {
  if (!params || !params.ruleId || !params.query || typeof params.onBatch !== 'function') {
    throw new Error('processMessagesInBatches: invalid parameters');
  }

  const batchSize = params.batchSize || DEFAULT_BATCH_SIZE;
  const timeLimitMs = params.timeLimitMs || DEFAULT_TIME_LIMIT_MS;
  const startTime = Date.now();

  const previousState = loadExecutionState(params.ruleId);
  let nextPageToken = params.pageToken || (previousState && previousState.nextPageToken) || null;
  let processedCount = previousState ? previousState.processedCount || 0 : 0;
  let totalResults = previousState ? previousState.totalResults || 0 : 0;
  let batchIndex = 0;
  let status = 'completed';

  while (true) {
    const searchResult = searchMessages(params.query, {
      maxResults: batchSize,
      pageToken: nextPageToken,
      fetchFullMessage: false
    });

    if (searchResult.retrievedCount === 0) {
      clearExecutionState(params.ruleId);
      totalResults = searchResult.totalResults || totalResults;
      break;
    }

    batchIndex += 1;
    totalResults = searchResult.totalResults || totalResults;

    const batchResult = params.onBatch(searchResult.messages, {
      batchIndex: batchIndex,
      query: params.query,
      dryRun: params.dryRun === true,
      metadata: searchResult
    }) || {};

    processedCount += batchResult.processed || searchResult.messages.length;

    if (batchResult.stop) {
      status = 'stopped';
      saveExecutionState(params.ruleId, {
        nextPageToken: searchResult.nextPageToken,
        processedCount: processedCount,
        totalResults: totalResults,
        lastRunAt: new Date().toISOString()
      });
      break;
    }

    if (!searchResult.nextPageToken) {
      clearExecutionState(params.ruleId);
      break;
    }

    nextPageToken = searchResult.nextPageToken;

    if (!hasTimeRemaining(startTime, timeLimitMs)) {
      status = 'partial';
      saveExecutionState(params.ruleId, {
        nextPageToken: nextPageToken,
        processedCount: processedCount,
        totalResults: totalResults,
        lastRunAt: new Date().toISOString()
      });
      break;
    }
  }

  return {
    ruleId: params.ruleId,
    query: params.query,
    status: status,
    processedCount: processedCount,
    totalResults: totalResults,
    resumed: Boolean(previousState),
    startedAt: new Date(startTime).toISOString(),
    finishedAt: new Date().toISOString(),
    nextPageToken: status === 'completed' ? null : nextPageToken
  };
}

function hasTimeRemaining(startTime, timeLimitMs) {
  const elapsed = Date.now() - startTime;
  return elapsed < Math.max(0, timeLimitMs - EXECUTION_BUFFER_MS);
}

function loadExecutionState(ruleId) {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty(EXECUTION_STATE_KEY_PREFIX + ruleId);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse execution state:', error);
    props.deleteProperty(EXECUTION_STATE_KEY_PREFIX + ruleId);
    return null;
  }
}

function saveExecutionState(ruleId, state) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty(EXECUTION_STATE_KEY_PREFIX + ruleId, JSON.stringify(state));
}

function clearExecutionState(ruleId) {
  const props = PropertiesService.getScriptProperties();
  props.deleteProperty(EXECUTION_STATE_KEY_PREFIX + ruleId);
}
