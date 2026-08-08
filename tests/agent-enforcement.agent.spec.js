// @ts-check
import { test, expect } from './fixtures/test.js';
import { hasRoleCredentials, environment } from '../config/environment.js';
import { ROLE_PERMISSIONS } from './contracts/role-permissions.js';
import {
  captureAuthorizationHeader,
  authedApiContext,
  apiOrigin,
  permissionKeySet,
} from './support/role-auth.js';

/**
 * ÇAPRAZ-ROL ENFORCEMENT — AGENT (COV-01, RBAC planı FAZ 2/L3).
 *
 * Bu dosya YALNIZ `chromium-agent` projesinde koşar (playwright.config.js
 * optionalRoleProjects) — o proje de ANCAK VOMENTA_AGENT_EMAIL/PASSWORD tanımlıysa
 * oluşur. Yani düşük-yetkili gerçek bir agent oturumuyla, güvenlik modelinin
 * DAVRANIŞINI doğrular: agent, politika dışı bir yetkiye SAHİP OLMAMALI.
 *
 * Neden ayrı dosya + `.agent.spec.js`: eski RBAC spec'i 6 rolü TEK admin hesabıyla
 * "okuyordu" (izin tanımı), enforcement'ı değil. Gerçek agent oturumu, admin'in
 * göremeyeceği tek şeyi kanıtlar: düşük-yetki gerçekten uygulanıyor mu.
 *
 * GÜVENLİK/prod-safe: yalnız GET + gözlem; hiçbir mutasyon yok. Asıl iddia
 * "agent'ın efektif izinleri AGENT politikasının ALT KÜMESİDİR" (fazlası =
 * yetki yükseltme zafiyeti) + tehlikeli izinlerin HİÇBİRİ yok.
 *
 * Credential yoksa bu proje hiç oluşmaz → kapsam boşluğu, HER koşuda çalışan
 * settings-roles-rbac.authed.spec.js içindeki görünür skip ile işaretlenir.
 */

// Belt-and-suspenders: proje yanlışlıkla credential'sız kurulursa bile net skip.
test.skip(
  !hasRoleCredentials('agent'),
  'AGENT credential yok (VOMENTA_AGENT_EMAIL/PASSWORD) — çapraz-rol enforcement koşulamaz.'
);
test.skip(!apiOrigin(), 'API origin bilinmiyor (environment.apiHostname boş) — enforcement bu ortamda koşulamaz.');

// AGENT'ta ASLA bulunmaması gereken yüksek-yetki izinleri (katalogdan; hiçbiri 29-liste değil).
const FORBIDDEN_FOR_AGENT = [
  'settings.users.manage',
  'settings.roles.manage',
  'settings.security.manage',
  'settings.organization.manage',
  'contacts.delete',
  'contacts.documents.delete',
  'tickets.delete',
  'billing.manage',
  'compliance.manage',
];

test.describe('RBAC enforcement — AGENT çapraz-rol @security @regression', () => {
  test('agent oturumunun efektif izinleri AGENT politikasının alt kümesidir (yetki yükseltme yok)', async ({ page }) => {
    const authorization = await captureAuthorizationHeader(page);
    expect(authorization, 'Agent oturumundan Authorization başlığı yakalanamadı').toBeTruthy();

    const ctx = await authedApiContext(/** @type {string} */ (authorization));
    try {
      const res = await ctx.get('/api/v1/roles/me/permissions');
      expect(res.ok(), `Agent kendi izinlerini okuyabilmeli (GET me/permissions) → ${res.status()}`).toBeTruthy();
      const live = permissionKeySet(await res.json());
      expect(live.size, 'Agent efektif izin kümesi boş olmamalı (sanity)').toBeGreaterThan(0);

      const policy = new Set(ROLE_PERMISSIONS.AGENT);
      // GÜVENLİK-KRİTİK YÖN: agent, politikadan FAZLA yetkiye sahip olmamalı.
      const escalated = [...live].filter((k) => !policy.has(k)).sort();
      expect(
        escalated,
        `Agent, AGENT politikası DIŞI izinlere sahip (yetki yükseltme?): ${escalated.join(', ') || '—'}`
      ).toEqual([]);
      // Not: ters yön (politikada var, canlıda yok) güvenlik değil kullanılabilirlik
      // sorunudur; gerçek agent oturumu doğrulanınca tam eşitliğe sıkılaştırılabilir.
    } finally {
      await ctx.dispose();
    }
  });

  test('agent efektif izinleri tehlikeli yüksek-yetki izinlerinin HİÇBİRİNİ içermez', async ({ page }) => {
    const authorization = await captureAuthorizationHeader(page);
    expect(authorization, 'Agent oturumundan Authorization başlığı yakalanamadı').toBeTruthy();

    const ctx = await authedApiContext(/** @type {string} */ (authorization));
    try {
      const res = await ctx.get('/api/v1/roles/me/permissions');
      expect(res.ok(), `GET me/permissions → ${res.status()}`).toBeTruthy();
      const live = permissionKeySet(await res.json());
      const leaked = FORBIDDEN_FOR_AGENT.filter((k) => live.has(k));
      expect(leaked, `Agent'ta bulunmaması gereken tehlikeli izinler VAR: ${leaked.join(', ') || '—'}`).toEqual([]);
    } finally {
      await ctx.dispose();
    }
  });

  // OPT-IN: app'in agent olarak ASLA çağırmayacağı korunan bir uca doğrudan istek atıp
  // 401/403 doğrular. Uç yolu ortama göre değişir → VOMENTA_AGENT_FORBIDDEN_ENDPOINT ile
  // verilir (spekülatif sabit yol yok). Verilmezse görünür skip.
  test('agent, korunan bir yönetim ucuna doğrudan eriştiğinde 401/403 alır (opt-in)', async ({ page }) => {
    const forbidden = environment.agentForbiddenEndpoint;
    test.skip(!forbidden, 'VOMENTA_AGENT_FORBIDDEN_ENDPOINT tanımlı değil — doğrudan-uç enforcement probu atlandı.');

    const authorization = await captureAuthorizationHeader(page);
    expect(authorization, 'Agent oturumundan Authorization başlığı yakalanamadı').toBeTruthy();

    const ctx = await authedApiContext(/** @type {string} */ (authorization));
    try {
      const res = await ctx.get(/** @type {string} */ (forbidden), { maxRedirects: 0 });
      const status = res.status();
      const snippet = (await res.text().catch(() => '')).slice(0, 200);
      expect(
        [401, 403],
        `Agent korunan uçtan REDDEDİLMELİ: GET ${apiOrigin()}${forbidden} → ${status} ${snippet}`
      ).toContain(status);
    } finally {
      await ctx.dispose();
    }
  });
});
