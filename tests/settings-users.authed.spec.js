// @ts-check
import { test, expect } from './fixtures/test.js';
import { environment } from '../config/environment.js';
import { UsersPage } from './pages/UsersPage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  expectDialogKeyboard,
  mockApi,
  waitForUiToSettle,
} from './helpers.js';

/**
 * AYARLAR › KULLANICILAR VE ROLLER (`/settings/users`)
 *
 * Keşif + kanıt: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Canlı gözlem: 29 Tem 2026, app.vomenta.com.
 *
 * ┌─ HER KONTROL İÇİN 3 KATMAN ─────────────────────────────────────────────┐
 * │ L1 tıklama · L2 arka plan (method+endpoint) · L3 görev (kalıcı → @mutation)│
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * GÜVENLİK (production salt-okunur): Invite/Edit/Deactivate ASLA tıklanmaz (davet
 * e-postası gönderir / erişim değiştirir). Invite dialogu yalnızca AÇILIR + boş-submit
 * validasyonu gözlemlenir (Send Invitation disabled) — davet GÖNDERİLMEZ. L3 davet
 * (kalıcı) staging'e bırakıldı: known-bugs-invite.mutation.authed.spec.js.
 */

const I18N = UsersPage.I18N;
const API = UsersPage.API;

// ───────────────────────────── YAPI (@smoke) ─────────────────────────────
test.describe('Kullanıcılar — yapı', () => {
  test('sayfa "Users & Roles" başlığı + üye tablosu ile açılıyor @smoke', async ({ app }) => {
    const u = app.users;
    await u.open();
    await expect(u.heading).toBeVisible();
    await expect(u.page.getByText(I18N.en.subtitle, { exact: false }).first()).toBeVisible();
    await expect(u.table).toBeVisible();
  });

  test('tablo beklenen kolonları gösteriyor + en az bir üye satırı @critical', async ({ app }) => {
    const u = app.users;
    await u.open();
    for (const col of I18N.en.columns) {
      await expect(u.page.getByRole('columnheader', { name: col, exact: true })).toBeVisible();
    }
    await expect(u.rows.first()).toBeVisible();
    // İlk satırın adı boş değil (skeleton'a karşı).
    await expect(u.rows.first()).toContainText(/\S/);
  });
});

// ──────────── 3 KATMAN: ARAMA (@regression) ────────────
test.describe('Kullanıcılar — arama @regression', () => {
  test('L1+L3 görev OK: ada göre arama eşleşen üyeyi süzüyor', async ({ app }) => {
    const u = app.users;
    await u.open();
    await u.searchInput.fill('Arda');
    // L3 doğruluk: eşleşen üye görünür; sonuç kümesi süzülür.
    await expect(u.rows.filter({ hasText: 'Arda' }).first()).toBeVisible({ timeout: 10000 });
  });
});

// ──────────── 3 KATMAN: INVITE DIALOG (L1 + boş-submit) (@regression) ────────────
test.describe('Kullanıcılar — davet dialogu @regression', () => {
  test('L1 tıklama OK: Invite User dialogu açılıyor (Email/Role/Team + Send disabled)', async ({ app }) => {
    const u = app.users;
    await u.open();
    const dialog = await u.openInviteDialog();
    await expect(dialog.getByRole('heading', { name: I18N.en.dialogTitle, exact: true })).toBeVisible();
    await expect(dialog.getByRole('textbox', { name: I18N.en.email, exact: true })).toBeVisible();
    // Boş formda "Send Invitation" DISABLED (istemci-tarafı validasyon; davet GÖNDERİLMEZ).
    await expect(dialog.getByRole('button', { name: I18N.en.send, exact: true })).toBeDisabled();
    await u.page.keyboard.press('Escape');
  });

  test('L3 (kalıcı davet) N/A: prod salt-okunur — staging mutation lane\'ine bırakıldı', async ({ app }) => {
    // Davet GÖNDERMEK e-posta yan-etkisi + kalıcı kayıt üretir → yalnız staging tenant.
    // Bkz. known-bugs-invite.mutation.authed.spec.js (revoke ucu teyidi bekliyor).
    const u = app.users;
    await u.open();
    await expect(u.inviteButton).toBeVisible(); // kontrol mevcut; tıklanmıyor.
  });
});

// ──────────────────── 4 DİL ÇEVİRİ GUARD'LARI (@i18n) ────────────────────
test.describe("Kullanıcılar — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + alt başlık + kolonlar + Invite + dialog çevrili`, async ({ app }) => {
      const u = app.users;
      await u.open();
      if (t.endonym) await u.switchLanguage(t.endonym);

      await expect(u.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(u.page.getByRole('heading', { level: 1, name: t.heading })).toBeVisible();
      await expect(u.page.getByText(t.subtitle, { exact: false }).first()).toBeVisible();
      for (const col of t.columns) {
        await expect(u.page.getByRole('columnheader', { name: col, exact: true })).toBeVisible();
      }
      // Davet dialog başlığı + gönder butonu da çevrili (submit YOK).
      const invite = u.page.getByRole('button', { name: t.invite, exact: true });
      await expect(invite).toBeVisible();
      await expect(async () => {
        await invite.click();
        await expect(u.page.getByRole('dialog')).toBeVisible({ timeout: 2000 });
      }).toPass({ timeout: 15000 });
      const dialog = u.page.getByRole('dialog');
      await expect(dialog.getByRole('heading', { name: t.dialogTitle, exact: true })).toBeVisible();
      await expect(dialog.getByRole('button', { name: t.send, exact: true })).toBeVisible();
      await u.page.keyboard.press('Escape');
    });
  }
});

// ─── BULGU: davet dialogundaki "Close" (X) butonu ÇEVRİLMİYOR (i18n/a11y sızıntısı) ───
// en/tr/fr/ar hepsinde erişilebilir isim "Close" kalıyor (Kapat/إغلاق/Fermer değil).
// Düzelince "beklenmedik geçiş" verir → test.fail kaldırılıp kalıcı guard olur.
test.describe('Kullanıcılar — çeviri sızıntısı (bilinen hata) @i18n @known-bug', () => {
  test('davet dialogundaki kapat butonu Türkçede "Kapat" olmalı (şu an "Close")', async ({ app }) => {
    test.fail(true, 'Bulgu: davet dialogu kapat butonunun erişilebilir ismi 4 dilde de İngilizce "Close" kalıyor.');
    const u = app.users;
    await u.open();
    await u.switchLanguage(I18N.tr.endonym);
    const dialog = await u.openInviteDialog();
    // Beklenen (doğru davranış): Türkçe "Kapat". Guard kırmızı kalır ta ki çeviri eklenene dek.
    await expect(dialog.getByRole('button', { name: 'Kapat', exact: true })).toBeVisible({ timeout: 5000 });
  });
});

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
test.describe('Kullanıcılar — erişilebilirlik @a11y', () => {
  test('sayfada ve davet dialogunda ciddi/kritik a11y ihlali yok', async ({ app }) => {
    const u = app.users;
    await u.open();
    await expectNoSevereA11y(u.page);
    await u.openInviteDialog();
    await expectNoSevereA11y(u.page);
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
test.describe('Kullanıcılar — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstünde sayfa yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/settings/users');
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
test.describe('Kullanıcılar — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    const u = app.users;
    await u.open();
    await waitForUiToSettle(u.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: HATA-YOLU (@errorpath) ═══════════════
test.describe('Kullanıcılar — hata-yolu @errorpath', () => {
  test('kullanıcı listesi 500 dönerse kabuk sağlam kalıyor (login\'e düşmüyor)', async ({ app, page }) => {
    await mockApi(page, `**${API.users}**`, { status: 500 });
    const u = app.users;
    await page.goto('/settings/users', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(u.shell.loginHeading).toBeHidden();
  });
});

// ═══════════════ STİL: KLAVYE/ODAK (@keyboard) ═══════════════
test.describe('Kullanıcılar — klavye/odak @keyboard', () => {
  test('davet dialogu odak tuzağı ve Escape ile kapanma', async ({ app }) => {
    const u = app.users;
    await u.open();
    const dialog = await u.openInviteDialog();
    await expectDialogKeyboard(u.page, dialog);
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe('Kullanıcılar — deep-link @deeplink', () => {
  test('/settings/users doğrudan açılınca liste yükleniyor (login\'e düşmüyor)', async ({ app, page }) => {
    const u = app.users;
    await page.goto('/settings/users', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(u.shell.loginHeading).toBeHidden();
    await expect(u.heading).toBeVisible();
  });
});

// ═══════════════ STİL: GÖRSEL REGRESYON (@visual) — GECE (darwin, CI'da atla) ═══════════════
// Not: "Last Login" göreli/mutlak zaman ve satır verisi oynak → tablo yerine davet dialogu
// (kararlı) snapshot'lanır.
test.describe('Kullanıcılar — görsel @visual', () => {
  test('davet dialogu görünümü değişmedi', async ({ app }) => {
    test.skip(!environment.runVisualTests, 'Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı.');
    const u = app.users;
    await u.open();
    const dialog = await u.openInviteDialog();
    await waitForUiToSettle(u.page);
    await expect(dialog).toHaveScreenshot('users-invite-dialog.png', { maxDiffPixels: 200 });
  });
});
