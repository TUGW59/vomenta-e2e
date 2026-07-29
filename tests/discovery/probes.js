// @ts-check
import { scanOverflow, severeA11yViolations, waitForUiToSettle } from '../helpers.js';
import { safeInternalPath } from './safety.js';

const SAFE_ACTION_NAMES =
  /^(search|filter|refresh|close|cancel|back|next|previous|menu|more|settings|dashboard|inbox|voice|channels|ai|campaigns|contacts|tickets|analytics|reports|supervisor|workforce|english|türkçe|français|العربية)$/i;

function sanitizeName(value) {
  const normalized = String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, 100);
  if (!normalized) return '<unnamed>';
  return SAFE_ACTION_NAMES.test(normalized) ? normalized : '<redacted-name>';
}

export function structuralAria(snapshot) {
  return String(snapshot)
    .split('\n')
    .slice(0, 500)
    .map((line) =>
      line
        .replace(/"[^"]*"/g, '"<name>"')
        .replace(/'[^']*'/g, "'<name>'")
        .replace(/(:\s+).+$/, '$1<content>')
        .replace(/\b\d+(?:[.,]\d+)*\b/g, '<value>')
    )
    .join('\n');
}

export function canonicalAriaStructure(snapshot) {
  return [...new Set(
    structuralAria(snapshot)
      .split('\n')
      .map((line) => {
        const indent = Math.min(Math.floor((line.match(/^\s*/)?.[0].length || 0) / 2), 8);
        return `${indent}:${line.trim()}`;
      })
      .filter(Boolean)
  )].sort().join('\n');
}

/**
 * Güvenli genel taramanın üretebildiği durumları ve sayfaya özgü keşfe kalan
 * durumları açıkça ayırır. Bu matris "keşif tamamlandı" iddiası değildir.
 * @param {{ checkboxCount:number, disclosureCount:number, dialogCount:number }} inventory
 */
function preliminaryStateMatrix(inventory) {
  return [
    {
      state: 'Varsayılan / veri-dolu veya görünür boş-durum',
      status: 'Kapsandı',
      reason: 'Ana document render olduktan ve iki animation frame yerleştikten sonra prob alındı.',
    },
    {
      state: 'Seçim sonrası kontroller / toplu eylem',
      status: 'N/A',
      reason: inventory.checkboxCount
        ? `${inventory.checkboxCount} checkbox gözlendi; genel production crawler seçim yapmaz, sayfaya özgü güvenli keşif gerekir.`
        : 'Render edilen durumda checkbox gözlenmedi; veri-dolu özel fixture ile yeniden değerlendirilmelidir.',
    },
    {
      state: 'Hover / focus ile beliren kontroller',
      status: 'N/A',
      reason: 'Genel crawler bilinmeyen hedeflerde hover/focus üretmez; sayfaya özgü kontrol matrisi gerekir.',
    },
    {
      state: 'Kebab / context menüsü ve alt eylemler',
      status: 'N/A',
      reason: inventory.disclosureCount
        ? `${inventory.disclosureCount} disclosure/menu adayı gözlendi; olası mutasyon eylemleri nedeniyle otomatik açılmadı.`
        : 'Render edilen durumda semantik disclosure/menu kontrolü gözlenmedi.',
    },
    {
      state: 'Dialog / drawer / expanded / detail',
      status: 'N/A',
      reason: inventory.dialogCount
        ? `${inventory.dialogCount} açık dialog gözlendi; içerik varsayılan prob kapsamına alındı. Tetikleyici akış sayfaya özgü doğrulanmalıdır.`
        : 'Varsayılan durumda açık dialog gözlenmedi; bilinmeyen tetikleyiciler production crawler tarafından çalıştırılmaz.',
    },
    {
      state: 'Boş / loading / hata / yetkisiz',
      status: 'N/A',
      reason: 'Bu durumlar kontrollü route/mock ve rol fixture’ı gerektirir; canlı crawler sahte hata veya oturum değişikliği üretmez.',
    },
    {
      state: 'Masaüstü / tablet / mobil ve dört dil + RTL',
      status: 'N/A',
      reason: 'Ön-tarama mevcut proje viewport/dilinde çalışır; kapanış için sayfaya özgü @layout ve @i18n testleri zorunludur.',
    },
  ];
}

/**
 * Yüklenmiş tek sayfadan salt-okunur, maskelenmiş sensör çıktısı üretir.
 * @param {import('@playwright/test').Page} page
 * @param {{ baseURL:string, route:string, events:any[], slowThresholdMs:number }} options
 */
export async function probePage(page, { baseURL, route, events, slowThresholdMs }) {
  await waitForUiToSettle(page);
  const finalPath = new URL(page.url()).pathname;

  const [overflow, a11y, aria, frames, domInventory, links] = await Promise.all([
    scanOverflow(page, { axis: 'x' }),
    severeA11yViolations(page),
    page.locator('body').ariaSnapshot({ timeout: 10_000 }).catch(() => ''),
    Promise.resolve(
      page.frames().map((frame) => ({
        main: frame === page.mainFrame(),
        sameOrigin: (() => {
          try {
            return new URL(frame.url()).origin === new URL(baseURL).origin;
          } catch {
            return false;
          }
        })(),
      }))
    ),
    page.evaluate(() => {
      const controls = [...document.querySelectorAll(
        'button, a[href], input, select, textarea, [role], [aria-expanded]'
      )];
      const roleFor = (element) =>
        element.getAttribute('role') ||
        ({ BUTTON: 'button', A: 'link', INPUT: 'input', SELECT: 'combobox', TEXTAREA: 'textbox' }[
          element.tagName
        ] ?? 'generic');
      const nameFor = (element) =>
        element.getAttribute('aria-label') ||
        element.getAttribute('title') ||
        element.textContent ||
        element.getAttribute('placeholder') ||
        '';
      return {
        titlePresent: Boolean(document.title),
        mainPresent: Boolean(document.querySelector('main')),
        shadowRootCount: [...document.querySelectorAll('*')].filter((el) => el.shadowRoot).length,
        checkboxCount: controls.filter(
          (el) => el.getAttribute('role') === 'checkbox' || el.getAttribute('type') === 'checkbox'
        ).length,
        disclosureCount: controls.filter(
          (el) =>
            el.hasAttribute('aria-expanded') ||
            ['menu', 'menuitem'].includes(el.getAttribute('role') || '')
        ).length,
        dialogCount: document.querySelectorAll('[role="dialog"], dialog[open]').length,
        controls: controls.slice(0, 200).map((element) => ({
          role: roleFor(element),
          name: nameFor(element),
          visible: Boolean(element.getClientRects().length),
          expanded: element.getAttribute('aria-expanded'),
          pressed: element.getAttribute('aria-pressed'),
          selected: element.getAttribute('aria-selected'),
        })),
      };
    }),
    page.locator('a[href]').evaluateAll((anchors) =>
      anchors.slice(0, 500).map((anchor) => anchor.getAttribute('href') || '')
    ),
  ]);

  const timing = events
    .filter(
      (event) =>
        event.type === 'request-timing' &&
        Number.isFinite(event.durationMs) &&
        event.initiatorPath === finalPath
    )
    .map(({ method, resourceType, url, durationMs }) => ({ method, resourceType, url, durationMs }))
    .sort((a, b) => b.durationMs - a.durationMs);
  const endpoints = [...new Set(
    timing
      .filter((item) => ['fetch', 'xhr'].includes(item.resourceType))
      .map((item) => `${item.method} ${item.url}`)
  )].sort();

  const errors = events.filter((event) => event.type !== 'request-timing');
  const controls = domInventory.controls
    .filter((control) => control.visible)
    .map((control) => ({ ...control, name: sanitizeName(control.name) }));

  return {
    route,
    finalPath,
    document: {
      titlePresent: domInventory.titlePresent,
      mainPresent: domInventory.mainPresent,
    },
    errors,
    network: {
      requestCount: timing.length,
      endpoints,
      slowThresholdMs,
      slowRequests: timing.filter((item) => item.durationMs >= slowThresholdMs).slice(0, 25),
      slowestRequests: timing.slice(0, 10),
    },
    overflow,
    accessibility: a11y.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodeCount: violation.nodes.length,
    })),
    ariaStructure: structuralAria(aria),
    frames,
    shadowRootCount: domInventory.shadowRootCount,
    controls,
    stateMatrix: preliminaryStateMatrix(domInventory),
    discoveredPaths: [...new Set(
      links.map((href) => safeInternalPath(href, baseURL)).filter(Boolean)
    )].sort(),
  };
}
