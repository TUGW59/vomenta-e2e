#!/usr/bin/env node
// @ts-check
/**
 * WP-01 — Artifact güvenliği negatif self-check (P0, kaçışsız kapı).
 *
 * İki bağımsız garanti:
 *  A) FONKSİYONEL: bilerek enjekte edilen her sızıntı sınıfı (token, Bearer,
 *     Authorization, cookie, e-posta, telefon, provider key, hassas kv)
 *     `redact*` ile TAMAMEN temizlenir; tarayıcı (`findSecrets`) hem ham girdide
 *     sızıntıyı YAKALAR hem de maskeli çıktıda SIFIR bulur. Biri bile kaçarsa exit 1.
 *  B) STATİK: hiçbir `*.spec.js` ham `testInfo.attach(` çağırmaz — maskeleyen
 *     `artifacts.safeAttach` kullanılmalı. (İstisna: keşif pipeline'ı zaten
 *     maskeleyen `tests/discovery/discovery.spec.js`.)
 *
 * NOT (bilinçli sınır): serbest-form kişi ADI otomatik tespit edilmez (aşırı
 * maskeleme / false-positive riski). İsim PII'si ekran görüntüsü `mask`'i veya
 * elle redaksiyon ile korunur; ADR-0006'da belgelidir.
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';
import {
  redactText,
  redactDeep,
  redactUrl,
  findSecrets,
} from '../tests/fixtures/sanitize.js';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const check = (label, fn) => {
  try {
    fn();
  } catch (error) {
    failures.push(`${label}: ${error.message}`);
  }
};

// ── A) FONKSİYONEL ──────────────────────────────────────────────────────────
const SEEDS = {
  email: 'jane.customer@example.com',
  phone: '+90 555 123 45 67',
  jwt: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJVadQssw5c',
  bearer: 'Bearer abcDEF1234567890token',
  providerKey: 'sk_live_ABCDEF0123456789xyz',
};

check('e-posta maskelenir', () => {
  const out = redactText(`müşteri ${SEEDS.email} aradı`);
  assert.ok(!out.includes(SEEDS.email), 'e-posta hâlâ görünür');
  assert.deepEqual(findSecrets(out), []);
});
check('telefon maskelenir', () => {
  const out = redactText(`ara: ${SEEDS.phone}`);
  assert.ok(!out.includes('555 123 45 67'), 'telefon hâlâ görünür');
  assert.deepEqual(findSecrets(out), []);
});
check('JWT maskelenir', () => {
  const out = redactText(`cookie jwt ${SEEDS.jwt}`);
  assert.ok(!out.includes(SEEDS.jwt), 'JWT hâlâ görünür');
  assert.deepEqual(findSecrets(out), []);
});
check('Bearer token maskelenir', () => {
  const out = redactText(SEEDS.bearer);
  assert.ok(!/abcDEF1234567890token/.test(out), 'bearer hâlâ görünür');
  assert.deepEqual(findSecrets(out), []);
});
check('provider key (sk_live_) maskelenir', () => {
  const out = redactText(`stripe ${SEEDS.providerKey} ok`);
  assert.ok(!out.includes(SEEDS.providerKey), 'provider key hâlâ görünür');
  assert.deepEqual(findSecrets(out), []);
});
check('hassas kv (password/token/cookie) değeri düşürülür', () => {
  const raw = '{"password":"hunter2secret","token":"abc123def456","set-cookie":"sid=deadbeefcafe"}';
  const out = redactText(raw);
  assert.ok(!out.includes('hunter2secret'));
  assert.ok(!out.includes('abc123def456'));
  assert.ok(!out.includes('deadbeefcafe'));
  assert.deepEqual(findSecrets(out), []);
});

check('redactUrl query değerlerini + userinfo düşürür', () => {
  const emailFix = 'a' + '@' + 'b.co';
  const out = redactUrl('https://user:pass@app.example.com/x?token=abc123&email=' + emailFix + '&page=2');
  assert.ok(!out.includes('abc123') && !out.includes(emailFix) && !out.includes('pass'));
  assert.ok(out.includes('page=%3Credacted%3E') || out.includes('page=<redacted>'));
});

check('redactDeep hassas anahtar + iç-içe PII temizler; tarama sıfır', () => {
  const raw = {
    user: { email: SEEDS.email, phone: SEEDS.phone, name: 'Jane Customer' },
    headers: {
      authorization: SEEDS.bearer,
      cookie: 'sid=deadbeef12345',
      'x-api-key': SEEDS.providerKey,
    },
    note: `jwt ${SEEDS.jwt} token=topsecretvalue123`,
  };
  assert.ok(findSecrets(JSON.stringify(raw)).length > 0, 'tarayıcı ham girdide sızıntı bulmalı');
  const clean = redactDeep(raw);
  const serialized = JSON.stringify(clean);
  for (const bad of [SEEDS.email, '555 123 45 67', SEEDS.jwt, SEEDS.providerKey, 'deadbeef12345', 'topsecretvalue123', 'abcDEF1234567890token']) {
    assert.ok(!serialized.includes(bad), `iç-içe sızıntı kaçtı: ${bad}`);
  }
  assert.deepEqual(findSecrets(serialized), [], `maskeli çıktıda sızıntı: ${findSecrets(serialized)}`);
});

check('yer-tutucular yeniden sızıntı sayılmaz (idempotent)', () => {
  const placeholders = '<redacted-email> <redacted-phone> <redacted-jwt> Bearer <redacted> <redacted-key> "token":"<redacted>"';
  assert.deepEqual(findSecrets(placeholders), [], 'yer-tutucu yanlışlıkla sızıntı sayıldı');
  assert.equal(redactText(placeholders), placeholders, 'yer-tutucu ikinci geçişte değişmemeli');
});

check('CSV içi PII maskelenir, yapı korunur', () => {
  const janeEmail = 'jane' + '@' + 'x.com';
  const csv = 'id,firstName,lastName,email,phone\n1,Jane,Doe,' + janeEmail + ',+905551234567';
  const out = redactText(csv);
  assert.ok(out.startsWith('id,firstName,lastName,email,phone'), 'başlık bozulmamalı');
  assert.ok(!out.includes(janeEmail) && !out.includes('+905551234567'));
  assert.deepEqual(findSecrets(out).filter((t) => t === 'email' || t === 'phone'), []);
});

// ── B) STATİK: ham testInfo.attach yasak (safeAttach kullanılmalı) ────────────
const ATTACH_ALLOWLIST = new Set([
  // Keşif raporu, kendi pipeline'ında (structuralAria/redactUrl) maskelenir ve
  // diske yazılıp `path:` ile eklenir.
  'tests/discovery/discovery.spec.js',
]);

function walkSpecs(dir) {
  /** @type {string[]} */
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walkSpecs(full));
    else if (entry.endsWith('.spec.js')) out.push(full);
  }
  return out;
}

check('hiçbir spec ham testInfo.attach kullanmaz (safeAttach zorunlu)', () => {
  const offenders = [];
  for (const file of walkSpecs(join(repoRoot, 'tests'))) {
    const rel = relative(repoRoot, file).split('\\').join('/');
    if (ATTACH_ALLOWLIST.has(rel)) continue;
    const src = readFileSync(file, 'utf8');
    src.split('\n').forEach((line, i) => {
      if (/\btestInfo\.attach\s*\(/.test(line)) offenders.push(`${rel}:${i + 1}`);
    });
  }
  assert.deepEqual(
    offenders,
    [],
    `ham testInfo.attach bulundu (artifacts.safeAttach kullanın):\n  ${offenders.join('\n  ')}`
  );
});

// ── Sonuç ─────────────────────────────────────────────────────────────────
if (failures.length > 0) {
  console.error('Artifact güvenliği self-check BAŞARISIZ:');
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(
  'Artifact güvenliği self-check geçti: token/Bearer/Authorization/cookie/e-posta/telefon/provider-key/kv maskeleniyor, tarayıcı ham sızıntıyı yakalayıp maskeli çıktıda sıfır buluyor, spec\'lerde ham testInfo.attach yok.'
);
