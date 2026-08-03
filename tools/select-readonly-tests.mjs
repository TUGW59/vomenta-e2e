// @ts-check
/**
 * GÜVENLİ READ-ONLY TEST SEÇİCİ — CLI (ADR-0015, FAZ 1).
 *
 * Bir profil için deterministik, fail-closed spec-dosyası seçimini CI job
 * summary'sine yazılabilecek GÜVENLİ JSON/MD olarak basar. Seçime mutation/
 * external-cost girerse veya güvenli seçim 0 ise NON-ZERO ile çıkar.
 *
 * Kullanım:
 *   node tools/select-readonly-tests.mjs --profile=readonly-full-chromium [--format=json|md]
 *   node tools/select-readonly-tests.mjs --list-profiles
 *   (npm run ci:readonly:select -- --profile=...)
 *
 * NOT: Çıktı SEÇİLEN SPEC DOSYALARIDIR; çalıştırılan/geçen test değildir. Bu katman
 * production'a dokunmaz, test koşmaz (listed != selected != executed).
 */
import { selectProfile, assertNoExecutedClaim, PROFILE_NAMES, PROFILES } from './readonly-manifest-lib.mjs';
import { buildFromDisk } from './generate-readonly-manifest.mjs';

function parseArgs(argv) {
  const out = { format: 'json' };
  for (const a of argv) {
    if (a === '--list-profiles') out.listProfiles = true;
    else if (a.startsWith('--profile=')) out.profile = a.slice('--profile='.length);
    else if (a.startsWith('--format=')) out.format = a.slice('--format='.length);
    else if (a === '--staging') out.isProduction = false;
  }
  return out;
}

function renderMd(sel) {
  const lines = [];
  lines.push(`### Seçim: \`${sel.profile}\``);
  lines.push('');
  lines.push(sel.description);
  lines.push('');
  lines.push(`- Projeler: ${sel.projects.map((p) => `\`${p}\``).join(', ')}`);
  lines.push(`- grep: ${sel.grep ? `\`${sel.grep}\`` : '—'}`);
  lines.push(`- Ortam: ${sel.environment}${sel.policyGated ? ' (policy-gated)' : ''}`);
  lines.push(`- Seçilen spec dosyası: **${sel.selectedSpecFileCount}** (executed değil)`);
  lines.push('');
  for (const f of sel.selectedSpecFiles) lines.push(`- \`${f}\``);
  lines.push('');
  return lines.join('\n');
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.listProfiles) {
    for (const name of PROFILE_NAMES) {
      console.log(`${name}\t${PROFILES[name].description}`);
    }
    return;
  }

  if (!args.profile) {
    console.error(
      `✗ --profile gerekli. İzinli profiller:\n  ${PROFILE_NAMES.join('\n  ')}`
    );
    process.exit(2);
  }
  if (!['json', 'md'].includes(args.format)) {
    console.error(`✗ --format json|md olmalı (verilen: ${args.format}).`);
    process.exit(2);
  }

  const manifest = buildFromDisk();
  const sel = selectProfile(manifest, args.profile, {
    isProduction: args.isProduction !== false,
  });
  assertNoExecutedClaim(sel);

  if (args.format === 'json') process.stdout.write(`${JSON.stringify(sel, null, 2)}\n`);
  else process.stdout.write(`${renderMd(sel)}\n`);
}

try {
  main();
} catch (err) {
  console.error(`✗ Seçim başarısız (fail-closed): ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
