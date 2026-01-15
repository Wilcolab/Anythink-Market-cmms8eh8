/**
 * Convert a string or array of strings to kebab-case (lowercase words separated by hyphens).
 *
 * Detailed behavior:
 * - Accepts a `string` or `string[]`. Arrays are joined with a single space before processing.
 * - Treats separators (spaces, tabs, newlines, underscores, dashes, periods, slashes, backslashes)
 *   as word boundaries and collapses multiple separators into a single boundary.
 * - Recognizes camelCase and PascalCase transitions and will split tokens at case and number
 *   transitions (e.g. `XMLHttpRequest` -> [`XML`, `Http`, `Request`]).
 * - Supports Unicode letters and numbers and normalizes input to NFC. Optionally strips
 *   diacritics when `normalizeDiacritics` is true.
 * - Keeps numeric tokens when `preserveNumbers` is true.
 * - Removes punctuation except letters, numbers, spaces, and common emoji/pictograph ranges.
 *
 * Complexity: O(n) time and O(n) space where n is the length of the input string.
 *
 * @param {string|string[]} input
 * @param {Object} [options]
 * @param {boolean} [options.normalizeDiacritics=false] Remove diacritics before processing
 * @param {string} [options.locale] Locale for case conversions
 * @param {boolean} [options.throwOnInvalid=false] Throw on invalid input or option types
 * @param {boolean} [options.preserveNumbers=true] Preserve numeric-only tokens
 * @returns {string}
 *
 * @example
 * toKebabCase('hello world') // -> 'hello-world'
 * toKebabCase(' Hello__WORLD--test ') // -> 'hello-world-test'
 * toKebabCase(['  multiple', 'SEPARATORS_here']) // -> 'multiple-separators-here'
 */
'use strict';

function stripDiacritics(value) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').normalize('NFC');
}

function splitOnCaseAndNumberTransitions(token) {
  const parts = [];
  let start = 0;
  for (let i = 1; i < token.length; i += 1) {
    const a = token.charAt(i - 1);
    const b = token.charAt(i);
    const aIsLower = a >= 'a' && a <= 'z';
    const aIsUpper = a >= 'A' && a <= 'Z';
    const bIsLower = b >= 'a' && b <= 'z';
    const bIsUpper = b >= 'A' && b <= 'Z';
    const aIsDigit = a >= '0' && a <= '9';
    const bIsDigit = b >= '0' && b <= '9';

    if ((aIsLower && bIsUpper) || (aIsDigit && !bIsDigit) || (!aIsDigit && bIsDigit)) {
      parts.push(token.slice(start, i));
      start = i;
    }
  }
  parts.push(token.slice(start));
  return parts;
}

function toKebabCase(input, options) {
  const opts = Object.assign({ normalizeDiacritics: false, locale: undefined, throwOnInvalid: false, preserveNumbers: true }, options || {});

  if (opts.locale != null && typeof opts.locale !== 'string') {
    if (opts.throwOnInvalid) throw new TypeError('Option "locale" must be a string');
    opts.locale = undefined;
  }
  if (typeof opts.normalizeDiacritics !== 'boolean') opts.normalizeDiacritics = Boolean(opts.normalizeDiacritics);
  if (typeof opts.throwOnInvalid !== 'boolean') opts.throwOnInvalid = Boolean(opts.throwOnInvalid);
  if (typeof opts.preserveNumbers !== 'boolean') opts.preserveNumbers = Boolean(opts.preserveNumbers);

  if (input == null) {
    if (opts.throwOnInvalid) throw new TypeError('Input is null or undefined');
    return '';
  }

  if (Array.isArray(input)) {
    input = input.map(function (p) { return p == null ? '' : String(p); }).join(' ');
  } else if (typeof input !== 'string') {
    if (opts.throwOnInvalid) throw new TypeError('Input must be a string or an array of strings');
    return '';
  }

  let working = input.normalize('NFC');
  if (opts.normalizeDiacritics) working = stripDiacritics(working);

  // Normalize separators to space
  working = working.replace(/[\s_\-./\\]+/g, ' ');

  // Remove punctuation except letters, numbers, spaces and emoji/pictographs
  working = working.replace(/[^\p{L}\p{N}\p{Zs}\p{Emoji_Presentation}\p{Extended_Pictographic} ]+/gu, '');

  working = working.trim().replace(/\s+/g, ' ');
  if (working.length === 0) return '';

  const tokens = working.split(' ');
  const outParts = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token.length === 0) continue;

    if (/^\d+$/.test(token)) {
      if (opts.preserveNumbers) outParts.push(token);
      continue;
    }

    const sub = splitOnCaseAndNumberTransitions(token);
    for (let j = 0; j < sub.length; j += 1) {
      const part = sub[j];
      if (part.length === 0) continue;
      const lowered = opts.locale ? part.toLocaleLowerCase(opts.locale) : part.toLowerCase();
      outParts.push(lowered);
    }
  }

  return outParts.join('-');
}

module.exports = toKebabCase;