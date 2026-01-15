/**
 * Convert a string or array of strings to camelCase (lowerCamelCase by default).
 *
 * Detailed behavior:
 * - Accepts a `string` or `string[]`. Arrays are joined with a single space before processing.
 * - Treats separators (spaces, tabs, newlines, underscores, dashes, periods, slashes, backslashes)
 *   as word boundaries and collapses multiple separators into a single boundary.
 * - Recognizes camelCase and PascalCase transitions and will split tokens at case and number
 *   transitions (e.g. `XMLHttpRequest` -> [`XML`, `Http`, `Request`]).
 * - Supports Unicode letters and numbers (uses Unicode property escapes) and normalizes input
 *   to NFC. Optionally strips diacritics when `normalizeDiacritics` is true.
 * - Optionally preserves multi-letter uppercase acronyms when `preserveAcronyms` is true.
 * - By default produces lowerCamelCase (first character lowercased). Set `pascalCase: true` to
 *   force PascalCase (UpperCamelCase).
 * - Keeps numbers as tokens when `preserveNumbers` is true.
 * - Removes punctuation except letters, numbers, spaces, and common emoji/pictograph ranges.
 *
 * Complexity: O(n) time and O(n) space where n is the length of the input string. The
 * implementation performs linear normalization, tokenization, and assembly without recursion.
 *
 * API:
 *   toCamelCase(input: string | string[], options?: {
 *     preserveAcronyms?: boolean,
 *     locale?: string,
 *     normalizeDiacritics?: boolean,
 *     throwOnInvalid?: boolean,
 *     preserveNumbers?: boolean,
 *     pascalCase?: boolean
 *   }) : string
 *
 * Options:
 * - `preserveAcronyms` (boolean, default=false): If true, keeps consecutive uppercase
 *   letter groups (e.g. `HTTP`) intact rather than splitting/normalizing them.
 * - `locale` (string, optional): Locale to use for case conversions (passed to
 *   `toLocaleLowerCase`/`toLocaleUpperCase`).
 * - `normalizeDiacritics` (boolean, default=false): If true, removes diacritic marks
 *   from letters (é -> e) before processing.
 * - `throwOnInvalid` (boolean, default=false): If true, invalid input types or option
 *   types will cause a `TypeError` to be thrown. Otherwise the function returns `''`.
 * - `preserveNumbers` (boolean, default=true): If true, numeric-only tokens are preserved
 *   in-place as tokens.
 * - `pascalCase` (boolean, default=false): If true, produce PascalCase (first word capitalized).
 *
 * Error handling:
 * - If `input` is `null`/`undefined` or not a `string`/`string[]` and `throwOnInvalid` is true,
 *   the function throws a `TypeError` with a descriptive message. Otherwise it returns `''`.
 * - Option types are validated; when invalid and `throwOnInvalid` is true a `TypeError` is thrown.
 *
 * Examples:
 *   toCamelCase('hello world') -> 'helloWorld'
 *   toCamelCase(' Hello__WORLD--test ') -> 'helloWorldTest'
 *   toCamelCase('user_id') -> 'userId'
 *   toCamelCase('XML_http_request', { preserveAcronyms: true, pascalCase: true }) -> 'XMLHttpRequest'
 *   toCamelCase(['  multiple', 'SEPARATORS_here']) -> 'multipleSeparatorsHere'
 *   toCamelCase(null, { throwOnInvalid: false }) -> ''
 *
 * @module toCamelCase
 */

/* eslint-disable max-statements */

'use strict';

/**
 * @typedef {Object} ToCamelOptions
 * @property {boolean} [preserveAcronyms=false] Keep multi-letter uppercase acronyms as-is
 * @property {string} [locale] Locale used for toLowerCase/toUpperCase
 * @property {boolean} [normalizeDiacritics=false] Remove diacritics from letters
 * @property {boolean} [throwOnInvalid=false] Throw on invalid input types
 * @property {boolean} [preserveNumbers=true] Keep numeric tokens in place
 * @property {boolean} [pascalCase=false] Force PascalCase (UpperCamelCase)
 */

/**
 * Remove diacritics (accents) from a Unicode string.
 * Uses Unicode NFD decomposition then strips combining diacritic marks.
 * @param {string} value
 * @returns {string}
 */
function stripDiacritics(value) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').normalize('NFC');
}

/**
 * Split a token into subwords using camelCase transitions and number transitions.
 * Preserves acronym groups when requested.
 * @param {string} token
 * @param {boolean} preserveAcronyms
 * @returns {string[]}
 */
function splitOnCaseAndNumberTransitions(token, preserveAcronyms) {
  const segments = [];
  let segmentStart = 0;
  const length = token.length;

  function pushSegment(end) {
    if (end > segmentStart) {
      segments.push(token.slice(segmentStart, end));
    }
    segmentStart = end;
  }

  for (let index = 1; index < length; index += 1) {
    const prev = token.charAt(index - 1);
    const curr = token.charAt(index);
    const next = index + 1 < length ? token.charAt(index + 1) : '';

    const prevIsUpper = prev >= 'A' && prev <= 'Z';
    const prevIsLower = prev >= 'a' && prev <= 'z';
    const currIsUpper = curr >= 'A' && curr <= 'Z';
    const currIsLower = curr >= 'a' && curr <= 'z';
    const prevIsDigit = prev >= '0' && prev <= '9';
    const currIsDigit = curr >= '0' && curr <= '9';

    // Split when letter-case transition lower->upper (fooBar)
    if (prevIsLower && currIsUpper) {
      pushSegment(index);
      continue;
    }

    // Split when letter<->digit transition
    if ((prevIsDigit && !currIsDigit) || (!prevIsDigit && currIsDigit)) {
      pushSegment(index);
      continue;
    }

    // Handle UpperUpperLower -> split between the last upper and the lower
    if (prevIsUpper && currIsUpper && next && next >= 'a' && next <= 'z') {
      pushSegment(index);
      continue;
    }

    // Otherwise continue the segment
  }

  // push remaining
  pushSegment(length);
  return segments;
}

/**
 * Main API
 * @param {string|string[]} input
 * @param {ToCamelOptions} [options]
 * @returns {string}
 */
function toCamelCase(input, options) {
  const opts = Object.assign({
    preserveAcronyms: false,
    locale: undefined,
    normalizeDiacritics: false,
    throwOnInvalid: false,
    preserveNumbers: true,
    pascalCase: false
  }, options || {});

  // Validate options types
  if (typeof opts.preserveAcronyms !== 'boolean') {
    if (opts.throwOnInvalid) throw new TypeError('Option "preserveAcronyms" must be a boolean');
    opts.preserveAcronyms = Boolean(opts.preserveAcronyms);
  }
  if (opts.locale != null && typeof opts.locale !== 'string') {
    if (opts.throwOnInvalid) throw new TypeError('Option "locale" must be a string');
    opts.locale = undefined;
  }
  if (typeof opts.normalizeDiacritics !== 'boolean') {
    if (opts.throwOnInvalid) throw new TypeError('Option "normalizeDiacritics" must be a boolean');
    opts.normalizeDiacritics = Boolean(opts.normalizeDiacritics);
  }
  if (typeof opts.throwOnInvalid !== 'boolean') {
    opts.throwOnInvalid = Boolean(opts.throwOnInvalid);
  }
  if (typeof opts.preserveNumbers !== 'boolean') {
    opts.preserveNumbers = Boolean(opts.preserveNumbers);
  }
  if (typeof opts.pascalCase !== 'boolean') {
    opts.pascalCase = Boolean(opts.pascalCase);
  }

  // Validate input
  if (input == null) {
    if (opts.throwOnInvalid) throw new TypeError('Input is null or undefined');
    return '';
  }

  if (Array.isArray(input)) {
    // join tokens with single space to normalize separators
    input = input.map(function (part) {
      if (part == null) return '';
      if (typeof part !== 'string') return String(part);
      return part;
    }).join(' ');
  } else if (typeof input !== 'string') {
    if (opts.throwOnInvalid) throw new TypeError('Input must be a string or an array of strings');
    return '';
  }

  // Normalize unicode
  let working = input.normalize('NFC');

  if (opts.normalizeDiacritics) {
    working = stripDiacritics(working);
  }

  // Replace common separators with single space
  working = working.replace(/[\s_\-./\\]+/g, ' ');

  // Remove punctuation except letters, numbers, spaces and common emoji ranges
  // Keep letters (\p{L}), numbers (\p{N}), space separator, and emoji/pictograph ranges
  working = working.replace(/[^\p{L}\p{N}\p{Zs}\p{Emoji_Presentation}\p{Extended_Pictographic} ]+/gu, '');

  // Trim and collapse multi-space
  working = working.trim().replace(/\s+/g, ' ');

  if (working.length === 0) return '';

  const rawTokens = working.split(' ');

  // For each token, further split on camelCase & number boundaries
  const words = [];
  for (let i = 0; i < rawTokens.length; i += 1) {
    const token = rawTokens[i];
    if (token.length === 0) continue;

    // If token is pure number
    if (/^\d+$/.test(token)) {
      if (opts.preserveNumbers) {
        words.push(token);
      }
      continue;
    }

    const subParts = splitOnCaseAndNumberTransitions(token, opts.preserveAcronyms);

    for (let j = 0; j < subParts.length; j += 1) {
      const part = subParts[j];
      if (part.length === 0) continue;
      words.push(part);
    }
  }

  if (words.length === 0) return '';

  // Assemble result respecting preserveAcronyms and pascalCase
  function lowerWithLocale(value) {
    return opts.locale ? value.toLocaleLowerCase(opts.locale) : value.toLowerCase();
  }
  function upperFirst(value) {
    if (value.length === 0) return value;
    const first = value.charAt(0);
    const rest = value.slice(1);
    return (opts.locale ? first.toLocaleUpperCase(opts.locale) : first.toUpperCase()) + (opts.locale ? rest.toLocaleLowerCase(opts.locale) : rest.toLowerCase());
  }

  const normalizedWords = words.map(function (w) {
    // If preserveAcronyms and token is all uppercase and length>1, keep it as-is
    if (opts.preserveAcronyms && /^[A-Z0-9]+$/.test(w) && w.length > 1) return w;
    return lowerWithLocale(w);
  });

  let result = '';

  for (let k = 0; k < normalizedWords.length; k += 1) {
    const word = normalizedWords[k];
    if (k === 0) {
      if (opts.preserveAcronyms && /^[A-Z0-9]+$/.test(words[0]) && words[0].length > 1) {
        // keep first acronym as-is
        result += words[0];
      } else if (opts.pascalCase) {
        result += upperFirst(word);
      } else {
        result += word; // already lowercased
      }
    } else {
      // If original corresponding word was an acronym and preserveAcronyms, keep as original
      if (opts.preserveAcronyms && /^[A-Z0-9]+$/.test(words[k]) && words[k].length > 1) {
        result += words[k];
      } else {
        result += upperFirst(word);
      }
    }
  }

  return result;
}


/**
 * Convert a string or array of strings to dot.case (lowercase words separated by dots).
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
 * toDotCase('hello world') // -> 'hello.world'
 * toDotCase(' Hello__WORLD--test ') // -> 'hello.world.test'
 * toDotCase(['  multiple', 'SEPARATORS_here']) // -> 'multiple.separators.here'
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

function toDotCase(input, options) {
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

  return outParts.join('.');
}

module.exports = toCamelCase;
module.exports = toDotCase;




