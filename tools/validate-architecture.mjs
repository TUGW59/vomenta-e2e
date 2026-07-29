import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  mutationLaneMessages,
  mutationSafetyMessages,
} from './architecture-rules.mjs';
import { MUTATION_LIFECYCLE_EXCLUSIONS } from '../tests/contracts/mutation-lifecycle.js';

const root = process.cwd();
const testsRoot = path.join(root, 'tests');
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));

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

    for (const message of mutationSafetyMessages(source, {
      lifecycleExclusion: MUTATION_LIFECYCLE_EXCLUSIONS[relative] || null,
    })) {
      violations.push({ file: relative, line: 1, message });
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

for (const [relative, exclusion] of Object.entries(
  MUTATION_LIFECYCLE_EXCLUSIONS
)) {
  const { mode, reason } = exclusion;
  if (!['fixme', 'read-only'].includes(mode)) {
    violations.push({
      file: 'tests/contracts/mutation-lifecycle.js',
      line: 1,
      message: `${relative} mutation yaşam-döngüsü istisnasının mode değeri fixme veya read-only olmalı`,
    });
  }
  if (!reason.startsWith('N/A: ')) {
    violations.push({
      file: 'tests/contracts/mutation-lifecycle.js',
      line: 1,
      message: `${relative} mutation yaşam-döngüsü istisnası "N/A: <gerekçe>" biçiminde olmalı`,
    });
    continue;
  }
  if (!javascriptFiles.some((file) => path.relative(root, file) === relative)) {
    violations.push({
      file: 'tests/contracts/mutation-lifecycle.js',
      line: 1,
      message: `mutation yaşam-döngüsü istisnası bilinmeyen spec'e bağlı: ${relative}`,
    });
  }
}

for (const message of mutationLaneMessages(packageJson.scripts)) {
  violations.push({ file: 'package.json', line: 1, message });
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
