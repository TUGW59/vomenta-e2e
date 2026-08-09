// @ts-check
/**
 * ROL-SCOPED ENFORCEMENT KOŞUCUSU (CI orphan çözümü — fail-closed).
 *
 * Rol-scoped enforcement spec'leri (`*.{admin,supervisor,agent}.spec.js`) yalnız
 * `chromium-<role>` projesinde koşar; bu proje ise ancak `VOMENTA_<ROLE>_EMAIL/PASSWORD`
 * tanımlıysa oluşur (playwright.config.js `optionalRoleProjects` + config/environment.js
 * `configuredRoles()`). Hiçbir workflow bu projeleri hedeflemediği için spec'ler CI'da
 * HİÇ koşmuyordu (credential olsa bile). Bu script o boşluğu kapatır:
 *
 *   - Credential'lı rol YOKSA → GÖRÜNÜR skip + exit 0 (asla `--project` hatası üretmez;
 *     kapsam boşluğu sessizce buharlaşmaz, dürüstçe raporlanır).
 *   - Credential'lı rol VARSA → her biri için `chromium-<role>` projesini koşar;
 *     herhangi biri kırmızıysa exit 1 (fail-closed).
 *
 * `configuredRoles()` üzerinden DİNAMİK: credential eklenince ilgili rol otomatik
 * kapsanır (hardcode yok). Bkz. ADR-0030 (RBAC), COV-01.
 *
 * Çalıştır:  node tools/run-role-enforcement.mjs
 */
import { spawnSync } from 'node:child_process';
import { configuredRoles } from '../config/environment.js';

const roles = configuredRoles().filter((r) => r !== 'default');

if (roles.length === 0) {
  console.log(
    "[role-enforcement] Rol credential'ı yok (VOMENTA_<ROLE>_EMAIL/PASSWORD tanımsız) → " +
      "rol-scoped enforcement spec'leri ATLANDI (fail-closed, görünür). " +
      'Credential eklenince bu lane otomatik koşar. exit 0.'
  );
  process.exit(0);
}

console.log(`[role-enforcement] Credential'lı roller: ${roles.join(', ')}`);
let failed = 0;
for (const role of roles) {
  const project = `chromium-${role}`;
  console.log(`\n[role-enforcement] ▶ ${project}`);
  const res = spawnSync(
    'npx',
    ['playwright', 'test', `--project=${project}`, '--retries=0', '--workers=1'],
    { stdio: 'inherit', env: process.env }
  );
  if (res.status === 0) {
    console.log(`[role-enforcement] ✓ ${project} PASS`);
  } else {
    failed += 1;
    console.error(`[role-enforcement] ✗ ${project} FAIL (exit ${res.status})`);
  }
}

if (failed > 0) {
  console.error(`[role-enforcement] ${failed}/${roles.length} rol projesi kırmızı.`);
  process.exit(1);
}
console.log(`[role-enforcement] Tüm rol projeleri yeşil (${roles.length}).`);
