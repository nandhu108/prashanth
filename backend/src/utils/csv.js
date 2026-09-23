'use strict';

/** Wraps a value in quotes only when it needs it (contains a comma, quote or newline). */
function csvCell(value) {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Builds a CSV string from an array of plain objects and a column list.
 * `columns` is [{ key, label }] — key may be a dotted path ("attendee.name").
 */
function toCsv(rows, columns) {
  const header = columns.map((c) => csvCell(c.label)).join(',');
  const lines = rows.map((row) =>
    columns
      .map((c) => csvCell(c.key.split('.').reduce((obj, k) => (obj == null ? obj : obj[k]), row)))
      .join(',')
  );
  return [header, ...lines].join('\r\n');
}

module.exports = { toCsv };
