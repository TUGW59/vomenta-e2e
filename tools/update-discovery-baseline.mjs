import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  DISCOVERY_BASELINE_PATH,
  makeDiscoveryBaseline,
} from '../tests/discovery/baseline.js';

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) return filesUnder(target);
      return entry.name === 'discovery-report.json' ? [target] : [];
    })
  );
  return nested.flat();
}

const explicitPath = process.argv[2];
const candidates = explicitPath
  ? [path.resolve(explicitPath)]
  : await filesUnder(path.resolve('test-results'));

if (candidates.length === 0) {
  throw new Error(
    'Discovery raporu bulunamadı. Önce `npm run test:discovery` çalıştırın.'
  );
}

const dated = await Promise.all(
  candidates.map(async (file) => ({ file, mtimeMs: (await stat(file)).mtimeMs }))
);
dated.sort((a, b) => b.mtimeMs - a.mtimeMs);
const reportPath = dated[0].file;
const report = JSON.parse(await readFile(reportPath, 'utf8'));
const baseline = makeDiscoveryBaseline(report);

await writeFile(
  DISCOVERY_BASELINE_PATH,
  `${JSON.stringify(baseline, null, 2)}\n`,
  'utf8'
);

console.log(
  `Discovery baseline güncellendi: ${Object.keys(baseline.routes).length} rota → ` +
  `${DISCOVERY_BASELINE_PATH.pathname}`
);
