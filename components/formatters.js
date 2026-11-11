// Centralized Number, Currency, and Datetime Formatters for Humanode Tracker

// Universal formatting policy:
// - Comma (',') is used ONLY for decimal numbers.
// - Dot ('.') is used for separating digits (thousands separator).
export const NUMBER_LOCALE = 'de-DE';

// Universal client-side patch for Number.prototype.toLocaleString so any component calling it adheres to the policy
if (typeof window !== 'undefined') {
  try {
    const origToLocaleString = Number.prototype.toLocaleString;
    Number.prototype.toLocaleString = function (locales, options) {
      return origToLocaleString.call(this, NUMBER_LOCALE, options);
    };
  } catch (e) {
    console.warn('Could not patch Number.prototype.toLocaleString:', e);
  }
}

let currentLocale = '';

export function setAppLocale(locale) {
  if (locale && typeof locale === 'string') {
    currentLocale = locale.trim().toLowerCase();
  }
}

export function getAppLocale() {
  return currentLocale;
}

function getLocaleString(locale) {
  return locale || currentLocale || undefined;
}

/**
 * Format any number strictly adhering to:
 * - '.' (dot) for separating digits (thousands separator)
 * - ',' (comma) ONLY for decimal digits
 *
 * @param {number|string} value
 * @param {object} [options]
 * @param {number} [options.minDecimals=0]
 * @param {number} [options.maxDecimals=2]
 * @returns {string} e.g. '1.714.204,94' or '33.080'
 */
export function formatNumber(value, options = {}) {
  const num = Number(value);
  if (isNaN(num)) return '0';

  const minDec = options.minDecimals !== undefined ? options.minDecimals : 0;
  const maxDec = options.maxDecimals !== undefined ? options.maxDecimals : 2;

  return num.toLocaleString(NUMBER_LOCALE, {
    minimumFractionDigits: minDec,
    maximumFractionDigits: maxDec,
  });
}

/**
 * Format HMND amounts cleanly with thousands separators and decimal precision.
 * Numbers are formatted cleanly without any scale labels in parentheses.
 *
 * @param {number|string} amount
 * @param {object} [options]
 * @param {boolean} [options.suffix=true] Append ' HMND'
 * @param {number} [options.maxDecimals]
 * @param {number} [options.minDecimals]
 * @param {boolean} [options.sign=false] Prepend '+' for positive numbers
 * @param {boolean} [options.showScale=false] Append scale in parentheses ONLY when explicitly true
 * @param {string} [options.locale] ISO language/locale code
 * @returns {string} e.g. '45.799.956,64 HMND' or '600.199,72 HMND (600,2 Bin)'
 */
export function formatHMND(amount, options = {}) {
  const val = Number(amount);
  if (isNaN(val) || val === 0) {
    return options.suffix === false ? '0' : '0 HMND';
  }

  const isNeg = val < 0;
  const absVal = Math.abs(val);

  let maxDec = options.maxDecimals;
  if (maxDec === undefined) {
    if (absVal < 0.0001) maxDec = 6;
    else if (absVal < 1) maxDec = 4;
    else maxDec = 2;
  }
  const minDec = options.minDecimals !== undefined ? options.minDecimals : 0;

  const formatted = formatNumber(absVal, {
    minDecimals: minDec,
    maxDecimals: maxDec,
  });

  const signStr = isNeg ? '-' : (options.sign ? '+' : '');
  const suff = options.suffix === false ? '' : ' HMND';

  return `${signStr}${formatted}${suff}`;
}

/**
 * Format Fee amounts cleanly.
 *
 * @param {number|string} fee
 * @param {boolean} [withSuffix=true]
 * @param {string} [locale]
 */
export function formatFee(fee, withSuffix = true, locale = null) {
  const val = Number(fee);
  if (isNaN(val) || val <= 0) {
    return withSuffix ? '0 HMND' : '0';
  }

  let minDec = 0;
  let maxDec = 2;
  if (val < 0.0001) {
    minDec = 2;
    maxDec = 6;
  } else if (val < 1) {
    minDec = 2;
    maxDec = 4;
  }

  const formatted = formatNumber(val, {
    minDecimals: minDec,
    maxDecimals: maxDec,
  });

  return withSuffix ? `${formatted} HMND` : `${formatted}`;
}

/**
 * Format USD currency amount.
 * Thousands separated with '.' and cents/decimals with ','.
 *
 * @param {number|string} amountUsd
 * @param {string} [locale]
 * @param {number} [maxDecimals=2]
 */
export function formatUSD(amountUsd, locale = null, maxDecimals = 2) {
  const val = Number(amountUsd);
  if (isNaN(val) || val === 0) return '$0';

  const absVal = Math.abs(val);
  let minDec = 2;
  let maxDec = maxDecimals !== undefined ? maxDecimals : 2;
  if (absVal < 0.01 && absVal > 0) {
    minDec = 4;
    maxDec = 6;
  }

  const formatted = formatNumber(absVal, {
    minDecimals: minDec,
    maxDecimals: maxDec,
  });

  const sign = val < 0 ? '-' : '';
  return `${sign}$${formatted}`;
}

export function formatHMNDWithUSD(amountHmnd, priceUsd = 0.0025, locale = null) {
  const val = Number(amountHmnd) || 0;
  const hmndStr = formatHMND(val, { locale });
  const usdVal = val * (Number(priceUsd) || 0);

  if (usdVal < 0.01 && usdVal > 0) {
    return `${hmndStr} (≈ < $0,01)`;
  }
  if (usdVal <= 0) {
    return hmndStr;
  }
  return `${hmndStr} (≈ ${formatUSD(usdVal, locale)})`;
}

export function formatCompact(amount, locale = null) {
  const val = Number(amount);
  if (isNaN(val) || val === 0) return '0';

  const absVal = Math.abs(val);

  if (absVal >= 100) {
    return formatNumber(Math.round(val), {
      minDecimals: 0,
      maxDecimals: 0,
    });
  }

  return formatNumber(val, {
    minDecimals: 0,
    maxDecimals: 2,
  });
}

/**
 * Format Unix timestamp to localized standard date/time string.
 *
 * @param {number|string} ts
 * @param {string} [locale]
 * @returns {string} e.g. '28.10.2026 15:00:42' (TR) or '10/28/2026, 3:00:42 PM' (EN)
 */
export function formatTimestamp(ts, locale = null) {
  if (!ts) return '-';
  try {
    const d = new Date(Number(ts) > 1e11 ? Number(ts) : Number(ts) * 1000);
    const locStr = getLocaleString(locale);
    return d.toLocaleString(locStr, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return String(ts);
  }
}

/**
 * Relative time ago.
 *
 * @param {number|string} ts
 * @param {string} [locale]
 * @returns {string}
 */
export function timeAgo(ts, locale = null) {
  if (!ts) return '';
  const now = Date.now();
  const time = Number(ts) > 1e11 ? Number(ts) : Number(ts) * 1000;
  const diffSec = Math.floor((now - time) / 1000);
  const loc = locale || currentLocale || undefined;

  try {
    const rtf = new Intl.RelativeTimeFormat(loc, { numeric: 'auto' });
    if (diffSec < 60) return rtf.format(-diffSec, 'second');
    if (diffSec < 3600) return rtf.format(-Math.floor(diffSec / 60), 'minute');
    if (diffSec < 86400) return rtf.format(-Math.floor(diffSec / 3600), 'hour');
    return rtf.format(-Math.floor(diffSec / 86400), 'day');
  } catch {
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  }
}

/**
 * Shorten address (0x... or hm...)
 *
 * @param {string} addr
 * @param {number} [head=6]
 * @param {number} [tail=4]
 * @returns {string}
 */
export function shortAddr(addr, head = 6, tail = 4) {
  if (!addr) return '-';
  if (addr.length <= head + tail + 2) return addr;
  return `${addr.slice(0, head)}...${addr.slice(-tail)}`;
}

/**
 * Format total seconds to exact HH:MM:SS format (e.g. 28:28:13).
 *
 * @param {number|string} totalSeconds
 * @returns {string} e.g. '28:28:13'
 */
export function formatHMS(totalSeconds) {
  const sec = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  if (sec <= 0) return '00:00:00';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Export data array to CSV and trigger browser download.
 *
 * @param {string} filename e.g. 'humanode_validators.csv'
 * @param {Array<object>} rows
 * @param {Array<{ key: string, label: string }>} columns
 */
export function exportToCsv(filename, rows, columns) {
  if (!rows || rows.length === 0) return;

  const header = columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(',');
  const csvRows = rows.map((row) => {
    return columns
      .map((c) => {
        let val = row[c.key];
        if (val === undefined || val === null) val = '';
        if (typeof val === 'object') val = JSON.stringify(val);
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(',');
  });

  const csvContent = '\uFEFF' + [header, ...csvRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
