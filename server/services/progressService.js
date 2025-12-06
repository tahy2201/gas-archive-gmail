/**
 * 進捗トラッキングサービス
 * Spreadsheet に実行ログを残しつつ、未設定の場合はコンソールにフォールバックする。
 */

const EXECUTION_LOG_SHEET_ID_KEY = 'EXECUTION_LOG_SHEET_ID';
const EXECUTION_LOG_SHEET_NAME_KEY = 'EXECUTION_LOG_SHEET_NAME';
const DEFAULT_LOG_SHEET_NAME = 'ExecutionLog';

const LOG_COLUMNS = {
  startedAt: 1,
  ruleId: 2,
  ruleName: 3,
  query: 4,
  totalResults: 5,
  processedCount: 6,
  status: 7,
  message: 8
};

/**
 * 実行ログを開始
 * @param {Object} entry
 * @param {string} entry.ruleId
 * @param {string} entry.ruleName
 * @param {string} entry.query
 * @returns {Object|null} ログ更新用ハンドル
 */
function startExecutionLog(entry) {
  const sheet = getExecutionLogSheet();
  if (!sheet) {
    console.log('[progress] Spreadsheet not configured. Skipping log start.');
    return null;
  }

  const now = new Date().toISOString();
  sheet.appendRow([
    now,
    entry.ruleId || '',
    entry.ruleName || '',
    entry.query || '',
    '',
    0,
    'running',
    ''
  ]);

  const row = sheet.getLastRow();

  return {
    sheetId: sheet.getParent().getId(),
    sheetName: sheet.getName(),
    row: row
  };
}

/**
 * 実行ログを更新
 * @param {Object|null} handle - startExecutionLog の戻り値
 * @param {Object} updates
 */
function updateExecutionLog(handle, updates) {
  if (!handle) {
    console.log('[progress] Spreadsheet not configured. Update:', updates);
    return;
  }

  const sheet = getSheetByHandle(handle);
  if (!sheet) return;

  const row = handle.row;

  if (updates.totalResults !== undefined) {
    sheet.getRange(row, LOG_COLUMNS.totalResults).setValue(updates.totalResults);
  }
  if (updates.processedCount !== undefined) {
    sheet.getRange(row, LOG_COLUMNS.processedCount).setValue(updates.processedCount);
  }
  if (updates.status) {
    sheet.getRange(row, LOG_COLUMNS.status).setValue(updates.status);
  }
  if (updates.message !== undefined) {
    sheet.getRange(row, LOG_COLUMNS.message).setValue(updates.message);
  }
}

/**
 * Spreadsheet を取得
 * @returns {GoogleAppsScript.Spreadsheet.Sheet|null}
 */
function getExecutionLogSheet() {
  try {
    const props = PropertiesService.getScriptProperties();
    const sheetId = props.getProperty(EXECUTION_LOG_SHEET_ID_KEY);
    if (!sheetId) {
      return null;
    }

    const sheetName = props.getProperty(EXECUTION_LOG_SHEET_NAME_KEY) || DEFAULT_LOG_SHEET_NAME;
    const spreadsheet = SpreadsheetApp.openById(sheetId);
    const sheet = spreadsheet.getSheetByName(sheetName);
    return sheet || spreadsheet.insertSheet(sheetName);
  } catch (error) {
    console.error('Failed to open execution log sheet:', error);
    return null;
  }
}

function getSheetByHandle(handle) {
  try {
    const spreadsheet = SpreadsheetApp.openById(handle.sheetId);
    const sheet = spreadsheet.getSheetByName(handle.sheetName);
    return sheet;
  } catch (error) {
    console.error('Failed to open sheet by handle:', error);
    return null;
  }
}
