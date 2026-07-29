import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const testsRoot = path.join(root, 'tests');

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const target = path.join(directory, entry.name);
      return entry.isDirectory() ? filesUnder(target) : [target];
    })
  );
  return nested.flat();
}

function lineNumber(source, index) {
  return source.slice(0, index).split('\n').length;
}

const violations = [];
const javascriptFiles = (await filesUnder(testsRoot)).filter((file) =>
  file.endsWith('.js')
);

for (const file of javascriptFiles) {
  const source = await readFile(file, 'utf8');
  const relative = path.relative(root, file);

  const forbidden = [
    {
      pattern: /\btest\.only\s*\(/g,
      message: 'test.only commit edilemez',
    },
    {
      pattern: /\bpage\.waitForTimeout\s*\(/g,
      message: 'sabit bekleme yerine gözlemlenebilir koşul kullanılmalı',
    },
  ];

  if (file.endsWith('.spec.js')) {
    forbidden.push(
      {
        pattern: /from\s+['"]@playwright\/test['"]/g,
        message: 'spec dosyası ortak fixtures/test.js üzerinden import etmeli',
      },
      {
        pattern: /\bprocess\.env\b/g,
        message: 'spec ortam değişkenini config/environment.js üzerinden okumalı',
      },
      {
        pattern: /https:\/\/app\.vomenta\.com/g,
        message: 'spec içinde ortam URL’si sabitlenemez',
      },
      {
        pattern: /\brequest\.(post|put|patch|delete)\s*\(/g,
        message: 'yazma isteği korumalı api fixture üzerinden yapılmalı',
      }
    );

    if (!/from\s+['"][^'"]*fixtures\/test\.js['"]/.test(source)) {
      violations.push({
        file: relative,
        line: 1,
        message: 'spec ortak test fixture’ını kullanmıyor',
      });
    }

    if (source.includes('@mutation')) {
      if (!source.includes('mutationGuard')) {
        violations.push({
          file: relative,
          line: 1,
          message: '@mutation testi mutationGuard kullanmalı',
        });
      }
      if (!source.includes('cleanup')) {
        violations.push({
          file: relative,
          line: 1,
          message: '@mutation testi cleanup kaydetmeli',
        });
      }
    }

    // Navigasyon L3: URL/rota kontrolü yapan spec, hedef içeriğin (başlık) render
    // olduğunu da doğrulamalı. Salt URL eşleşmesi "baştan savma" sayılır (AGENTS.md).
    const usesUrlAssertion =
      /\bwaitForURL\s*\(/.test(source) || /\bpage\.url\s*\(\)/.test(source);
    if (usesUrlAssertion) {
      const hasContentAssertion =
        /getByRole\(\s*['"]heading['"]/.test(source) ||
        source.includes('assertDestinationLoaded') ||
        source.includes('loginHeading');
      if (!hasContentAssertion) {
        violations.push({
          file: relative,
          line: 1,
          message:
            'navigasyon testi URL yanında hedef içeriği (başlık) doğrulamalı — assertDestinationLoaded veya getByRole("heading") kullanın (navigasyon L3)',
        });
      }
    }

    // Stil etiketi → gerekli primitif kontrolü (etiketin "süs" olmadığını garanti eder).
    // NOT: bu etiketler JSDoc'ta ASLA görünmez; ham-substring güvenli. Etiket ALLOWLIST'i ise
    // JSDoc karışmasın diye JSON-liste tabanlı tools/style-coverage.mjs'de uygulanır.
    // @layout kasıtlı hariç: responsive.authed.spec.js taşma yardımcısı DEĞİL, mobil-nav test eder.
    const styleGates = [
      { tag: '@a11y', anyOf: ['severeA11yViolations', 'expectNoSevereA11y', 'AxeBuilder'], message: '@a11y testi axe yardımcısı (severeA11yViolations/expectNoSevereA11y/AxeBuilder) kullanmalı' },
      { tag: '@visual', anyOf: ['toHaveScreenshot', 'toMatchSnapshot'], message: '@visual testi toHaveScreenshot/toMatchSnapshot çağırmalı' },
      { tag: '@clean', anyOf: ['assertClean'], message: '@clean testi diagnostics.assertClean() kullanmalı' },
      { tag: '@data', anyOf: ['captureJson', 'waitForResponse'], message: '@data testi captureJson/waitForResponse ile API yanıtını yakalamalı' },
      { tag: '@errorpath', anyOf: ['mockApi', '.route('], message: '@errorpath testi mockApi/page.route ile yanıtı sahtelemeli' },
      { tag: '@perf', anyOf: ['expectContentWithin'], message: '@perf testi expectContentWithin ile süre bütçesini doğrulamalı' },
    ];
    for (const gate of styleGates) {
      if (source.includes(gate.tag) && !gate.anyOf.some((token) => source.includes(token))) {
        violations.push({ file: relative, line: 1, message: gate.message });
      }
    }
  }

  for (const rule of forbidden) {
    for (const match of source.matchAll(rule.pattern)) {
      violations.push({
        file: relative,
        line: lineNumber(source, match.index ?? 0),
        message: rule.message,
      });
    }
  }

  const localImport = /from\s+['"](\.{1,2}\/[^'"]+)['"]/g;
  for (const match of source.matchAll(localImport)) {
    const importPath = match[1];
    if (!path.extname(importPath)) {
      violations.push({
        file: relative,
        line: lineNumber(source, match.index ?? 0),
        message: `yerel ESM import uzantısı eksik: ${importPath}`,
      });
    }
  }
}

// Orphan-sıfır güvencesi: @mutation lane'i retry ile kayıt çoğaltmamalı (retry → orphan).
// package.json'daki mutation script'leri `--retries=0` taşımalı (kurcalamaya karşı statik kilit).
// Bkz. AGENTS.md → "Mutasyon güvenliği standardı (orphan-sıfır)".
try {
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  for (const scriptName of ['test:mutation', 'test:mutation:prod']) {
    const cmd = pkg.scripts?.[scriptName] ?? '';
    if (cmd && !/--retries[=\s]0\b/.test(cmd)) {
      violations.push({
        file: 'package.json',
        line: 1,
        message: `mutation lane "${scriptName}" --retries=0 içermeli (retry orphan riski yaratır)`,
      });
    }
  }
} catch (error) {
  violations.push({ file: 'package.json', line: 1, message: `okunamadı: ${error.message}` });
}

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(
      `${violation.file}:${violation.line} — ${violation.message}`
    );
  }
  console.error(`\n${violations.length} mimari ihlal bulundu.`);
  process.exit(1);
}

console.log(
  `${javascriptFiles.length} JavaScript dosyası: mimari kalite kapısı geçti.`
);
