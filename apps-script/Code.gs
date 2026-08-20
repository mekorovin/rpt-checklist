/**
 * Приём чек-листов из формы РПТ и запись в Google Таблицу.
 *
 * Установка:
 *   1. Вставить этот код в редактор Apps Script таблицы (заменить старый целиком).
 *   2. Один раз запустить функцию setupSheet() — она создаст листы и шапку.
 *   3. Развернуть: «Управление развёртываниями» → карандаш → «Новая версия» → «Развернуть».
 *      Именно так, а не «Новое развёртывание» — иначе сменится /exec URL и его
 *      придётся менять в src/App.jsx.
 *
 * Порядок критериев обязан совпадать с RATING_CRITERIA в src/App.jsx.
 */

const SHEET_NAME = 'Ответы';
const SUMMARY_NAME = 'Сводка';
const ERRORS_NAME = 'Ошибки';
const BRAND = '#d27d46';

const CRITERIA = [
  ['acceptance', 'Приемка в ремонт'],
  ['overall', 'Качество ремонта (в целом)'],
  ['engine', 'Ремонт двигателя'],
  ['hydro', 'Ремонт гидропередачи'],
  ['transmission', 'Ремонт трансмиссии'],
  ['wheelsets', 'Ремонт колесных пар'],
  ['hydraulics', 'Ремонт гидравлического оборудования'],
  ['electrics', 'Ремонт электрооборудования'],
  ['pneumatics', 'Ремонт пневмооборудования'],
  ['working_parts', 'Ремонт рабочих органов'],
  ['painting', 'Качество покраски'],
  ['cabin', 'Ремонт кабины управления'],
];

const BASE_HEADERS = [
  'Дата отправки',
  'Предприятие',
  'Дата ремонта',
  'Город/Станция',
  'Тип оборудования',
  'Номер оборудования',
  'Вид ремонта',
  'Сроки',
  'ФИО/Контакты',
  'Дефектная ведомость',
  'Что не устранено',
  'Проблем',
  'Список проблем',
];

const TAIL_HEADERS = ['Другие замечания', 'Предложения', 'Оценки вне списка'];

const STATUS_BAD = 'Не удовлетворен';

// ---------------------------------------------------------------- приём формы

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000); // две одновременные отправки не должны драться за строку

  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = ensureSheet();
    const ratings = data.ratings || {};

    const problems = [];
    const perCriterion = [];
    const known = {};

    CRITERIA.forEach(function (c) {
      const id = c[0];
      const label = c[1];
      const rating = ratings[id] || {};
      known[id] = true;
      if (isBad(rating.status)) problems.push(label);
      perCriterion.push(rating.status || '', rating.comment || '');
    });

    // Если в форме появится новый критерий, а скрипт ещё не обновили —
    // его оценка попадёт сюда, а не пропадёт.
    const extra = Object.keys(ratings)
      .filter(function (id) { return !known[id]; })
      .map(function (id) { return id + ': ' + JSON.stringify(ratings[id]); })
      .join('; ');

    const row = [
      new Date(),
      data.enterprise || '',
      parseDate(data.date),
      data.location || '',
      data.machineType || '',
      data.machineNumber || '',
      data.repairType || '',
      data.repairTimeframe || '',
      data.contactInfo || '',
      data.defectResolved || '',
      data.defectComment || '',
      problems.length,
      problems.join(', '),
    ]
      .concat(perCriterion)
      .concat([data.otherRemarks || '', data.suggestions || '', extra]);

    sheet.appendRow(row);

    // Длинные комментарии не должны раздувать высоту строки.
    sheet
      .getRange(sheet.getLastRow(), 1, 1, row.length)
      .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP)
      .setVerticalAlignment('top');

    // notifyIfProblems(data, problems);

    return json({ status: 'success', problems: problems.length });
  } catch (error) {
    logError(error, e);
    return json({ status: 'error', message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

// ---------------------------------------------------------------- подготовка

/** Запустить один раз вручную: создаёт листы, шапку и оформление. */
function setupSheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = book.insertSheet(SHEET_NAME);

  const headers = buildHeaders();

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet
    .getRange(1, 1, 1, headers.length)
    .setBackground(BRAND)
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setVerticalAlignment('middle')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);

  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(6); // дата … номер оборудования всегда на виду
  sheet.setRowHeight(1, 44);

  applyWidths(sheet);
  applyColors(sheet);

  sheet
    .getRange(2, 1, Math.max(sheet.getMaxRows() - 1, 1), headers.length)
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP)
    .setVerticalAlignment('top');

  sheet.getRange('A2:A').setNumberFormat('dd.MM.yyyy HH:mm');
  sheet.getRange('C2:C').setNumberFormat('dd.MM.yyyy');

  try {
    if (sheet.getFilter()) sheet.getFilter().remove();
    sheet.getRange(1, 1, sheet.getMaxRows(), headers.length).createFilter();
  } catch (err) {
    // фильтр уже есть — не страшно
  }

  buildSummary(book);
  book.setActiveSheet(sheet);
}

function buildHeaders() {
  const middle = [];
  CRITERIA.forEach(function (c) {
    middle.push(c[1], c[1] + ' — замечания');
  });
  return BASE_HEADERS.concat(middle).concat(TAIL_HEADERS);
}

function applyWidths(sheet) {
  sheet.setColumnWidth(1, 130); // дата отправки
  sheet.setColumnWidth(2, 180); // предприятие
  sheet.setColumnWidth(3, 100); // дата ремонта
  sheet.setColumnWidth(4, 120);
  sheet.setColumnWidth(5, 150);
  sheet.setColumnWidth(6, 130);
  sheet.setColumnWidth(7, 120);
  sheet.setColumnWidth(8, 110);
  sheet.setColumnWidth(9, 180);
  sheet.setColumnWidth(10, 110); // дефектная ведомость
  sheet.setColumnWidth(11, 220);
  sheet.setColumnWidth(12, 80); // проблем
  sheet.setColumnWidth(13, 260); // список проблем

  statusColumns().forEach(function (col) {
    sheet.setColumnWidth(col, 150); // статус
    sheet.setColumnWidth(col + 1, 240); // замечание
  });

  const tailStart = BASE_HEADERS.length + CRITERIA.length * 2 + 1;
  sheet.setColumnWidth(tailStart, 260);
  sheet.setColumnWidth(tailStart + 1, 260);
  sheet.setColumnWidth(tailStart + 2, 200);
}

/** Красит статусы и колонку «Проблем», чтобы проблемные ремонты видеть глазами. */
function applyColors(sheet) {
  const lastRow = sheet.getMaxRows();
  const statusRanges = statusColumns().map(function (col) {
    return sheet.getRange(2, col, lastRow - 1, 1);
  });

  const rules = [
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(STATUS_BAD)
      .setBackground('#fce8e6')
      .setFontColor('#9a3a2c')
      .setRanges(statusRanges)
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Удовлетворен')
      .setBackground('#e8f3e6')
      .setFontColor('#3f6a3a')
      .setRanges(statusRanges)
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenNumberGreaterThan(0)
      .setBackground('#fce8e6')
      .setFontColor('#9a3a2c')
      .setBold(true)
      .setRanges([sheet.getRange(2, 12, lastRow - 1, 1)])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('Нет')
      .setBackground('#fce8e6')
      .setFontColor('#9a3a2c')
      .setRanges([sheet.getRange(2, 10, lastRow - 1, 1)])
      .build(),
  ];

  sheet.setConditionalFormatRules(rules);
  sheet.getRange(2, 12, lastRow - 1, 1).setHorizontalAlignment('center');
}

/** Лист «Сводка»: сколько раз каждый критерий получил «Не удовлетворен». */
function buildSummary(book) {
  let sheet = book.getSheetByName(SUMMARY_NAME);
  if (!sheet) sheet = book.insertSheet(SUMMARY_NAME);
  sheet.clear();

  const rows = [['Критерий', 'Оценок', 'Не удовлетворён', 'Доля проблем']];

  CRITERIA.forEach(function (c, i) {
    const col = letter(BASE_HEADERS.length + 1 + i * 2);
    const range = "'" + SHEET_NAME + "'!" + col + '2:' + col;
    rows.push([
      c[1],
      '=COUNTA(' + range + ')',
      '=COUNTIF(' + range + ',"' + STATUS_BAD + '")',
      '=IFERROR(C' + (i + 2) + '/B' + (i + 2) + ',0)',
    ]);
  });

  sheet.getRange(1, 1, rows.length, 4).setValues(rows);
  sheet
    .getRange(1, 1, 1, 4)
    .setBackground(BRAND)
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  sheet.getRange(2, 4, CRITERIA.length, 1).setNumberFormat('0%');
  sheet.setColumnWidth(1, 300);
  sheet.setFrozenRows(1);

  sheet
    .getRange(2, 3, CRITERIA.length, 1)
    .setHorizontalAlignment('center');
}

// ---------------------------------------------------------------- служебное

function ensureSheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = book.getSheetByName(SHEET_NAME);
  if (sheet && sheet.getLastRow() > 0) return sheet;
  setupSheet();
  return book.getSheetByName(SHEET_NAME);
}

function statusColumns() {
  const cols = [];
  for (let i = 0; i < CRITERIA.length; i++) {
    cols.push(BASE_HEADERS.length + 1 + i * 2);
  }
  return cols;
}

function isBad(status) {
  return String(status || '').toLowerCase().indexOf('не ') === 0;
}

/** '2026-08-19' → настоящая дата, чтобы работали сортировка и фильтры. */
function parseDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  if (!match) return value || '';
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function letter(column) {
  let result = '';
  let n = column;
  while (n > 0) {
    const rest = (n - 1) % 26;
    result = String.fromCharCode(65 + rest) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

/** Форма шлёт no-cors и ответ не читает — поэтому падения пишем в лист. */
function logError(error, e) {
  try {
    const book = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = book.getSheetByName(ERRORS_NAME);
    if (!sheet) {
      sheet = book.insertSheet(ERRORS_NAME);
      sheet.appendRow(['Когда', 'Ошибка', 'Исходные данные']);
    }
    sheet.appendRow([
      new Date(),
      error.toString(),
      e && e.postData ? e.postData.contents : '',
    ]);
  } catch (ignored) {
    // если и это не вышло — остаётся журнал выполнений Apps Script
  }
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/** Письмо только когда есть проблемы. Раскомментировать вызов в doPost. */
function notifyIfProblems(data, problems) {
  if (!problems.length) return;
  MailApp.sendEmail({
    to: 'parshin@rptgrupp.ru',
    subject:
      'Чек-лист с замечаниями: ' +
      (data.machineType || '') +
      ' №' +
      (data.machineNumber || ''),
    body:
      'Предприятие: ' + (data.enterprise || '—') + '\n' +
      'Оборудование: ' + (data.machineType || '—') + ' (' + (data.machineNumber || '—') + ')\n' +
      'Контакты: ' + (data.contactInfo || '—') + '\n\n' +
      'Не удовлетворён по пунктам (' + problems.length + '):\n• ' +
      problems.join('\n• '),
  });
}
