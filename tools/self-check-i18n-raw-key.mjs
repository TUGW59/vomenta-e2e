// @ts-check
/**
 * self-check: i18n ham-anahtar sezgisi (ADR-0032 P1).
 * `isRawI18nKey`/`findRawI18nKeys` sözleşmesini kilitler — gerçek anahtarları yakalar,
 * meşru noktalı dizelerde (e-posta/alan adı/dosya/sürüm/URL/cümle) yanlış-pozitif ÜRETMEZ.
 */
import assert from 'node:assert/strict';
import {
  isRawI18nKey,
  findRawI18nKeys,
  KNOWN_I18N_NAMESPACES,
} from '../tests/support/i18n-raw-key.js';

// ── POZİTİF: gerçek ham i18n anahtarları (canlı bulgulardan — F-001/018/021/024/026/028, B3) ──
const RAW_KEYS = [
  'channels.emailPage.defaultSignatureText', // F-001 / B9
  'voiceRegulatory.title',
  'voiceRegulatory.startKyc', // F-018 / VOICE-REGULATORY-BROKEN
  'reports.queueReports', // F-021
  'reports.aiInsightsDesc', // REPORTS-AIKEY
  'dashboard.setupStepQueue', // F-024
  'supervisor.voice.offline', // F-026 (tüm-küçük ama bilinen ad-uzayı)
  'contacts.delete', // F-028 / CONTACTS-F2
  'inbox.noMessagesYet', // B3
  'common.previousPage', // VOICEMAIL-PAGER-I18N
];
for (const k of RAW_KEYS) {
  assert.equal(isRawI18nKey(k), true, `ham anahtar yakalanmalı: ${k}`);
}

// ── NEGATİF: meşru noktalı dizeler anahtar SAYILMAMALI ──
const NOT_KEYS = [
  'marketing@vomenta.com', // e-posta
  'test.vomenta.com', // alan adı
  'app.dev.vomenta.com', // alt alan adı
  'smtp-relay.gmail.com', // tireli host
  'startupxyz.io', // TLD .io
  'financehub.com',
  'discovery-report.json', // dosya (tire + .json)
  'package.json',
  'v1.2.3', // sürüm
  '99.9', // ondalık
  '1.5', // ondalık
  'https://app.vomenta.com/settings', // URL (: ve /)
  '/settings/audit', // path
  'Bir cümle noktayla biter.', // boşluklu cümle
  'Sale / Completed', // boşluk + slash
  'README', // noktasız
  'READMEFILE.MD', // tüm büyük + .md uzantısı
  'user.name@example.com', // e-posta (@)
];
for (const s of NOT_KEYS) {
  assert.equal(isRawI18nKey(s), false, `meşru dize anahtar SAYILMAMALI: ${s}`);
}

// ── Tür güvenliği + findRawI18nKeys (benzersiz + sıralı) ──
assert.equal(isRawI18nKey(null), false);
assert.equal(isRawI18nKey(undefined), false);
assert.equal(isRawI18nKey(42), false);
assert.equal(isRawI18nKey(''), false);
assert.deepEqual(
  findRawI18nKeys(['contacts.delete', 'iyi metin', 'contacts.delete', 'channels.emailPage.x', 'a@b.com']),
  ['channels.emailPage.x', 'contacts.delete']
);

// ── Ad-uzayı listesi dolu ve camelCase kaçış yolu çalışıyor ──
assert.ok(KNOWN_I18N_NAMESPACES.size >= 15, 'bilinen i18n ad-uzayları tanımlı olmalı');
assert.equal(isRawI18nKey('bilinmeyenNs.startKyc'), true, 'bilinmeyen ad-uzayı ama camelCase → anahtar');
assert.equal(isRawI18nKey('bilinmeyen.dusuk'), false, 'bilinmeyen ad-uzayı + camelCase yok → anahtar değil');

console.log('self-check-i18n-raw-key: OK — sezgi 10 pozitif + 18 negatif + tür/benzersizlik vakasını geçti.');
