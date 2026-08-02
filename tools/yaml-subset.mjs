// @ts-check
/**
 * MİNİMAL YAML ALT-KÜME PARSER — GitHub Actions workflow'ları için (WP-CI).
 *
 * mapping / sequence / block-scalar (`|`, `>`) destekler; akış (`[a, b]`) değerini
 * ham string bırakır. `import.meta`/ağ/side-effect YOKTUR — saf fonksiyon.
 *
 * Not: aynı alt-küme mantığı WP-SEC-B `self-check-artifact-allowlist.mjs` içinde
 * de gömülüdür; buraya çıkarılmasının nedeni, o dosyanın import edildiğinde kendi
 * self-check'ini ÇALIŞTIRMASIdır (yan etki). WP-CI enforcement'ı o yan etkiye
 * bağlanmasın diye bağımsız ve saf bir kopya tutulur.
 */

function tokenize(text) {
  return text.split(/\r?\n/).map((raw) => {
    const expanded = raw.replace(/\t/g, '  ');
    const trimmed = expanded.trim();
    const indent = expanded.length - expanded.trimStart().length;
    return { raw: expanded, trimmed, indent, blank: trimmed === '', comment: trimmed.startsWith('#') };
  });
}
function nextStructural(toks, i) {
  while (i < toks.length && (toks[i].blank || toks[i].comment)) i++;
  return i;
}
function stripQuotes(s) {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t.slice(1, -1);
  return t;
}
function consumeBlockScalar(toks, start, keyIndent) {
  const parts = [];
  let i = start;
  while (i < toks.length) {
    const t = toks[i];
    if (t.blank) {
      parts.push('');
      i++;
      continue;
    }
    if (t.indent > keyIndent) {
      parts.push(t.trimmed);
      i++;
    } else break;
  }
  while (parts.length && parts[0] === '') parts.shift();
  while (parts.length && parts[parts.length - 1] === '') parts.pop();
  return { text: parts.join('\n'), end: i };
}
function parseBlock(toks, start, minIndent) {
  let i = nextStructural(toks, start);
  if (i >= toks.length || toks[i].indent < minIndent) return { node: null, end: i };
  const baseIndent = toks[i].indent;
  const isSeq = toks[i].trimmed === '-' || toks[i].trimmed.startsWith('- ');
  if (isSeq) {
    const arr = [];
    while (i < toks.length) {
      i = nextStructural(toks, i);
      if (i >= toks.length || toks[i].indent < baseIndent) break;
      const t = toks[i];
      if (!(t.trimmed === '-' || t.trimmed.startsWith('- '))) break;
      const rest = t.trimmed === '-' ? '' : t.trimmed.slice(2);
      if (rest === '') {
        const { node, end } = parseBlock(toks, i + 1, baseIndent + 1);
        arr.push(node);
        i = end;
      } else if (/^["']?[\w.-]+["']?\s*:(\s|$)/.test(rest)) {
        const virt = toks.slice();
        virt[i] = { ...t, trimmed: rest, indent: baseIndent + 2, blank: false, comment: false };
        const { node, end } = parseBlock(virt, i, baseIndent + 2);
        arr.push(node);
        i = end;
      } else {
        arr.push(stripQuotes(rest));
        i++;
      }
    }
    return { node: arr, end: i };
  }
  const obj = {};
  while (i < toks.length) {
    i = nextStructural(toks, i);
    if (i >= toks.length || toks[i].indent < baseIndent) break;
    if (toks[i].indent > baseIndent) break;
    const t = toks[i];
    if (t.trimmed === '-' || t.trimmed.startsWith('- ')) break;
    const m = t.trimmed.match(/^("?)([^:"]+)\1\s*:(.*)$/);
    if (!m) {
      i++;
      continue;
    }
    const key = m[2].trim();
    const rest = m[3].trim();
    if (rest === '') {
      const look = nextStructural(toks, i + 1);
      if (look < toks.length && toks[look].indent > baseIndent) {
        const { node, end } = parseBlock(toks, i + 1, baseIndent + 1);
        obj[key] = node;
        i = end;
      } else {
        obj[key] = null;
        i++;
      }
    } else if (/^[|>][+-]?$/.test(rest)) {
      const { text, end } = consumeBlockScalar(toks, i + 1, baseIndent);
      obj[key] = text;
      i = end;
    } else {
      obj[key] = stripQuotes(rest);
      i++;
    }
  }
  return { node: obj, end: i };
}

/**
 * YAML alt-kümesini nesneye çevirir.
 * @param {string} text
 * @returns {any}
 */
export function parseYamlSubset(text) {
  const toks = tokenize(text);
  return parseBlock(toks, 0, 0).node || {};
}
