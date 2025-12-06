/**
 * メッセージ検索サービス
 * Gmail 標準クエリをそのまま使用し、Apps Script から Gmail API を叩く。
 */

const MESSAGE_METADATA_HEADERS = ['Subject', 'From', 'To', 'Cc', 'Date'];
const DEFAULT_MAX_RESULTS = 100;
const MAX_ALLOWED_RESULTS = 500;

/**
 * メッセージを検索
 * @param {string} query - Gmail 検索クエリ
 * @param {Object} [options]
 * @param {number} [options.maxResults=100] - 最大取得件数（上限500）
 * @param {string} [options.pageToken] - 続き取得用 pageToken
 * @param {boolean} [options.includeSpamTrash=false] - 迷惑メール/ゴミ箱も対象にする場合
 * @param {boolean} [options.fetchFullMessage=false] - メッセージ詳細を取得するか
 * @returns {Object} 検索結果
 */
function searchMessages(query, options) {
  if (!query || typeof query !== 'string') {
    throw new Error('searchMessages: query is required');
  }

  const opts = options || {};
  const maxResults = Math.min(
    Math.max(1, opts.maxResults || DEFAULT_MAX_RESULTS),
    MAX_ALLOWED_RESULTS
  );

  const params = {
    q: query,
    maxResults: maxResults,
    pageToken: opts.pageToken || undefined,
    includeSpamTrash: opts.includeSpamTrash || false
  };

  const startedAt = new Date();

  try {
    const listResponse = Gmail.Users.Messages.list('me', params);
    const shouldFetchFullMessage = opts.fetchFullMessage !== false;
    const messageSummaries = buildMessageSummaries(listResponse, shouldFetchFullMessage);

    const finishedAt = new Date();
    const result = {
      query: query,
      maxResults: maxResults,
      retrievedCount: messageSummaries.length,
      totalResults: listResponse.resultSizeEstimate || messageSummaries.length,
      nextPageToken: listResponse.nextPageToken || null,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      messages: messageSummaries
    };

    logSearchSummary(result);
    return result;
  } catch (error) {
    console.error('Error in searchMessages:', error);
    throw new Error(`Failed to search messages: ${error.message}`);
  }
}

/**
 * Gmail API から取得したメッセージ一覧をクライアントが扱いやすい形に整形
 * @param {Object} listResponse - Gmail.Users.Messages.list のレスポンス
 * @param {boolean} fetchFullMessage - メッセージ詳細を取得するか
 * @returns {Array<Object>} 整形済みメッセージ配列
 */
function buildMessageSummaries(listResponse, fetchFullMessage) {
  const messages = listResponse && listResponse.messages ? listResponse.messages : [];
  if (messages.length === 0) {
    return [];
  }

  return messages.map(item => {
    if (!fetchFullMessage) {
      return {
        id: item.id,
        threadId: item.threadId
      };
    }

    const detail = Gmail.Users.Messages.get('me', item.id, {
      format: 'metadata',
      metadataHeaders: MESSAGE_METADATA_HEADERS
    });

    return normalizeMessage(detail);
  });
}

/**
 * Gmail API の Message をアプリ内で扱いやすい形に正規化
 * @param {Object} message - Gmail API Message オブジェクト
 * @returns {Object} 正規化済みメッセージ
 */
function normalizeMessage(message) {
  if (!message) {
    return {};
  }

  const headers = convertHeadersToMap(message.payload && message.payload.headers);
  const internalDate = message.internalDate
    ? new Date(Number(message.internalDate)).toISOString()
    : null;

  return {
    id: message.id,
    threadId: message.threadId,
    historyId: message.historyId || null,
    labelIds: message.labelIds || [],
    snippet: message.snippet || '',
    internalDate: internalDate,
    headers: headers
  };
}

/**
 * ヘッダー配列を { key: value } 形式に変換
 * @param {Array<Object>} headersArray - Gmail API headers
 * @returns {Object} ヘッダーマップ
 */
function convertHeadersToMap(headersArray) {
  if (!headersArray || headersArray.length === 0) {
    return {};
  }

  return headersArray.reduce((acc, header) => {
    if (header.name && header.value) {
      acc[header.name] = header.value;
    }
    return acc;
  }, {});
}

/**
 * 検索実行ログをまとめておく（将来の進捗トラッキング向け）
 * @param {Object} result - searchMessages の戻り値
 */
function logSearchSummary(result) {
  console.log(
    [
      '[messageService.searchMessages]',
      `query="${result.query}"`,
      `retrieved=${result.retrievedCount}`,
      `total=${result.totalResults}`,
      `nextPageToken=${result.nextPageToken || 'none'}`
    ].join(' ')
  );
}
