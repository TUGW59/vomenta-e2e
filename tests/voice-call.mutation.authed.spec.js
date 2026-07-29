// @ts-check
import { test, expect } from './fixtures/test.js';
import { environment } from '../config/environment.js';

/**
 * VOICE / MESAJ — GERÇEK ÇAĞRI & SMS E2E (L3, DIŞA-DÖNÜK MUTATION) — YALNIZCA STAGING
 *
 * Bu testler GERÇEK bir giden çağrı başlatır / SMS gönderir → PRODUCTION'DA ASLA ÇALIŞMAZ.
 * Üç kat koruma:
 *   1) `@mutation` → prod'da `playwright.config` grepInvert ile tamamen dışlanır.
 *   2) `mutationGuard` → yanlışlıkla prod'da koşulursa hata fırlatır (çift kilit: ADR-0002).
 *   3) `test.fixme` → staging'de bile seçiciler DOĞRULANANA kadar çalışmaz.
 *
 * Numara `environment.testPhone` (`VOMENTA_TEST_PHONE`) — koda YAZILMAZ, `.env`'de tutulur,
 * git'e girmez. AYRILMIŞ bir test numarası olmalı (kişisel numara değil).
 *
 * Çalıştırma (staging, doğrulama sonrası fixme kaldırılınca):
 *   BASE_URL=<staging-url> ALLOW_MUTATING_TESTS=true VOMENTA_TEST_PHONE=+90XXXXXXXXXX \
 *   npx playwright test voice-call.mutation.authed.spec.js --project=chromium-authed
 *
 * Seçiciler softphone'un SALT-OKUNUR haritasından türetildi ("Open softphone" + "Start Call").
 * Staging ilk koşusunda doğrulanıp gerekiyorsa düzeltilecek; sonra `test.fixme` kaldırılacak.
 * Bkz. AGENTS.md → mutation çift-kilit + "Form gönderim / dışa-dönük eylem" güvenliği.
 */
test.describe('Voice/Mesaj — dışa-dönük gerçek çağrı/SMS (staging) @regression @mutation', () => {
  test.describe.configure({ retries: 0 });
  test('L3: softphone ile test numarası aranıyor ve çağrı kuruluyor', async ({
    app,
    page,
    mutationGuard,
    testEntity,
  }) => {
    test.fixme(true, 'Yalnızca staging: gerçek çağrı prod\'da yasak; seçiciler staging\'de doğrulanacak.');
    mutationGuard('Voice: gerçek giden çağrı');
    test.skip(!environment.testPhone, 'VOMENTA_TEST_PHONE tanımlı değil.');

    await page.goto('/', { waitUntil: 'commit' });
    await app.shell.expectReady();

    // 1) Softphone panelini aç.
    await page.getByRole('button', { name: 'Open softphone' }).click();

    // 2) Test numarasını gir (staging'de dialer input seçicisi doğrulanacak).
    const dialer = page.locator('input[type="tel"], input[placeholder*="number" i], input[placeholder*="numara" i]').first();
    await dialer.fill(environment.testPhone);

    // 3) Çağrıyı başlatmadan ÖNCE kapatmayı cleanup'a kaydet (test ne olursa olsun kapatsın).
    testEntity.cleanup(async () => {
      const hangup = page.getByRole('button', { name: /Hang up|End call|End|Kapat|Bitir/i }).first();
      if (await hangup.count()) await hangup.click().catch(() => {});
    }, 'voice-call-hangup');

    // 4) Çağrıyı başlat.
    await page.getByRole('button', { name: 'Start Call', exact: true }).click();

    // 5) L3 görev OK: çağrı gerçekten kuruldu (aktif çağrı göstergesi).
    await expect(
      page.getByText(/Calling|Ringing|In call|Connected|Aranıyor|Çalıyor|Görüşme/i).first()
    ).toBeVisible({ timeout: 20000 });
  });

  test('L3: test numarasına SMS gönderiliyor (channels.sms.send)', async ({
    app,
    page,
    mutationGuard,
    testEntity,
  }) => {
    test.fixme(true, 'Yalnızca staging: gerçek SMS prod\'da yasak; SMS compose seçicileri staging\'de doğrulanacak.');
    mutationGuard('Channels: gerçek SMS gönderimi');
    test.skip(!environment.testPhone, 'VOMENTA_TEST_PHONE tanımlı değil.');

    await page.goto('/channels/sms', { waitUntil: 'commit' });
    await app.shell.expectReady();

    // SMS compose akışı staging'de doğrulanacak: alıcı numara + mesaj + Gönder.
    // Gönderilen kaydın temizliği (varsa taslak/log) burada cleanup'a bağlanacak.
    testEntity.cleanup(async () => {
      // TODO(staging): gerekiyorsa gönderim taslağını/kaydını temizle.
    }, 'sms-conversation-cleanup');

    const recipient = page.locator('input[type="tel"], input[placeholder*="number" i], input[placeholder*="numara" i]').first();
    await recipient.fill(environment.testPhone);
    await page.getByRole('textbox', { name: /message|mesaj/i }).first().fill('E2E staging test');
    await page.getByRole('button', { name: /send|gönder/i }).first().click();

    await expect(page.getByText(/sent|delivered|queued|gönderildi|kuyruk/i).first()).toBeVisible({ timeout: 20000 });
  });
});
