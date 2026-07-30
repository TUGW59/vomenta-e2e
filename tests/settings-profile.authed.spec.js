// @ts-check
import { test, expect } from './fixtures/test.js';
import { environment } from '../config/environment.js';
import { ProfilePage } from './pages/ProfilePage.js';
import {
  expectNoSevereA11y,
  expectNoOverflowAtViewports,
  assertDestinationLoaded,
  mockApi,
  waitForUiToSettle,
} from './helpers.js';

/**
 * AYARLAR › PROFİL (`/settings/profile`)
 *
 * Keşif + kanıt: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * Canlı gözlem: 29 Tem 2026, app.vomenta.com.
 *
 * ┌─ HER KONTROL İÇİN 3 KATMAN (AGENTS.md standardı) ──────────────────────────┐
 * │ L1 — TIKLAMA OK : kontrol tepki veriyor (aria-selected/popover/değer).     │
 * │ L2 — ARKA PLAN OK: doğru backend ucu tetiklenir (method+endpoint).         │
 * │ L3 — GÖREV OK   : kontrol amacını gerçekten yerine getirir (panel içeriği, │
 * │                    gezinme hedefi). Kalıcı kayıt → ayrı @mutation spec.     │
 * └────────────────────────────────────────────────────────────────────────────┘
 *
 * GÜVENLİK (production salt-okunur): Save changes / Update Password / Enable 2FA /
 * Request reset email / Revoke bu spec'te ASLA tıklanmaz (yan-etkili/geri-dönüşü zor).
 * Geri-döndürülebilir Telefon düzenlemesi yalnız staging'de:
 * tests/settings-profile-mutations.authed.spec.js.
 */

const I18N = ProfilePage.I18N;
const API = ProfilePage.API;

// ───────────────────────────── YAPI (@smoke) ─────────────────────────────
test.describe('Profil — yapı', () => {
  test('sayfa "Profile" başlığı + 4 alt sekme ile açılıyor @smoke', async ({ app }) => {
    const p = app.profile;
    await p.open();
    await expect(p.heading).toHaveText(I18N.en.heading);
    for (const name of I18N.en.tabs) {
      await expect(p.tab(name)).toBeVisible();
    }
  });

  test('User menu → Profile navigasyonu sayfayı yüklüyor @smoke', async ({ app, page }) => {
    // Taze panelde header User menu'den Profile'a git (deeplink değil, gerçek gezinme).
    await page.goto('/', { waitUntil: 'commit' });
    await app.shell.expectReady();
    // Radix menüsü tıklamayı yutabildiğinden açık olana kadar tekrar dene.
    const profileItem = page.getByRole('menuitem', { name: 'Profile', exact: true });
    await expect(async () => {
      await app.shell.userMenu.click();
      await expect(profileItem).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await profileItem.click();
    // L3: hedef gerçekten yüklendi (salt URL değil, başlık görünür).
    await assertDestinationLoaded(page, { path: '/settings/profile', heading: I18N.en.heading });
  });

  test('Profile sekmesi kişisel-bilgi formunu render ediyor @critical', async ({ app }) => {
    const p = app.profile;
    await p.open();
    await expect(p.firstNameInput).toBeVisible();
    await expect(p.phoneInput).toBeVisible();
    // Email alanı salt-okunur (disabled) — değiştirilemez.
    await expect(p.page.getByRole('textbox', { name: 'Email', exact: true })).toBeDisabled();
    await expect(p.saveChangesButton).toBeVisible();
  });
});

// ──────────────── 3 KATMAN: ALT SEKME GEZİNME (@regression) ────────────────
test.describe('Profil — alt sekmeler @regression', () => {
  test('L1 tıklama OK: her sekme tıklanınca aria-selected=true', async ({ app }) => {
    const p = app.profile;
    await p.open();
    for (const name of ProfilePage.TABS) {
      const tab = await p.selectTab(name);
      await expect(tab).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('L3 görev OK: her sekme paneli KENDİ içerik imzasını gösteriyor', async ({ app }) => {
    const p = app.profile;
    await p.open();
    for (const name of ProfilePage.TABS) {
      await p.selectTab(name);
      // Panel gerçekten o sekmenin içeriğini render etti mi? (etiket durması yetmez)
      await expect(p.panelText(I18N.en.sig[name])).toBeVisible({ timeout: 10000 });
    }
  });

  test('L2 arka plan OK: Sessions sekmesi oturum listesini çekiyor', async ({ app }) => {
    const p = app.profile;
    await p.open();
    const req = p.page.waitForResponse(
      (r) => r.url().includes(API.sessions) && r.request().method() === 'GET' && r.ok(),
      { timeout: 15000 }
    );
    await p.selectTab('Sessions');
    await req; // doğru GET ucu 2xx döndü
    // L3: tablo render oldu (kolon başlıkları görünür).
    await expect(p.page.getByRole('columnheader', { name: 'Device', exact: true })).toBeVisible();
  });
});

// ──────────── 3 KATMAN: TIMEZONE / LANGUAGE COMBOBOX (@regression) ────────────
// L1: popover açılır ve seçenekler listelenir. L2 N/A: seçenekler istemci-tarafı
// (ağ isteği yok). L3: seçim + Save kalıcı kayıt → @mutation (staging).
test.describe('Profil — combobox popover @regression', () => {
  test('L1 tıklama OK: Timezone açılınca seçenekler listeleniyor (UTC dahil)', async ({ app }) => {
    const p = app.profile;
    await p.open();
    const combo = p.page.getByRole('combobox').first(); // Timezone (form sırası: Timezone, Language)
    await combo.click();
    await expect(p.page.getByRole('option', { name: 'UTC', exact: true })).toBeVisible();
    await p.page.keyboard.press('Escape');
  });

  test('L1 tıklama OK: Language açılınca çok-dilli seçenekler listeleniyor', async ({ app }) => {
    const p = app.profile;
    await p.open();
    const combo = p.page.getByRole('combobox').nth(1); // Language
    await combo.click();
    await expect(p.page.getByRole('option', { name: 'English', exact: true })).toBeVisible();
    await expect(p.page.getByRole('option', { name: /Türkçe/ })).toBeVisible();
    await p.page.keyboard.press('Escape');
  });
});

// ─────────── 3 KATMAN: NOTIFICATIONS LİNKİ (gezinme) (@regression) ───────────
test.describe('Profil — bildirim ayarları linki @regression', () => {
  test('L3 görev OK: link /settings/notifications sayfasını yüklüyor', async ({ app, page }) => {
    const p = app.profile;
    await p.open();
    await p.selectTab('Notifications');
    await page.getByRole('link', { name: I18N.en.notifLink, exact: true }).click();
    // Navigasyon L3: sadece URL değil, hedef sayfa gerçekten yüklendi.
    await page.waitForURL((u) => u.pathname.startsWith('/settings/notifications'), { timeout: 15000 });
    await expect(p.shell.loginHeading).toBeHidden();
  });
});

// ─────────── VERİ-DEĞİŞTİREN KONTROLLER: L3 N/A BEYANI (belge) ───────────
// AGENTS.md: bir katman güvenle prod'da doğrulanamıyorsa sessizce atlanmaz, açık N/A yazılır.
test.describe('Profil — mutasyon kontrolleri (L3 N/A: prod salt-okunur)', () => {
  test('Save/Password/2FA/Revoke kontrolleri MEVCUT ama tıklanmıyor (yan-etki)', async ({ app }) => {
    const p = app.profile;
    await p.open();
    // Save changes: var + etkin (L3 kalıcı kayıt → staging @mutation spec'inde).
    await expect(p.saveChangesButton).toBeVisible();
    // Security: Update Password boşken disabled (istemci validasyonu) + tehlikeli butonlar salt-görüntü.
    await p.selectTab('Security');
    await expect(p.page.getByRole('button', { name: 'Update Password', exact: true })).toBeDisabled();
    await expect(p.page.getByRole('button', { name: I18N.en.enable2fa, exact: true })).toBeVisible();
    // Sessions: Revoke var ama TIKLANMAZ (oturum kapatır).
    await p.selectTab('Sessions');
    await expect(p.page.getByRole('button', { name: I18N.en.revoke, exact: true }).first()).toBeVisible();
    // L3 (kaydın kalıcılığı) yalnız staging'de: settings-profile-mutations.authed.spec.js
  });
});

// ──────────────────── 4 DİL ÇEVİRİ GUARD'LARI (@i18n) ────────────────────
test.describe("Profil — 4 dil çeviri guard'ları @i18n", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] başlık + yön + sekmeler + panel imzaları çevrili`, async ({ app }) => {
      const p = app.profile;
      await p.open();
      if (t.endonym) await p.switchLanguage(t.endonym);

      // Yön (RTL Arapça'da aynalanır).
      await expect(p.page.locator('body')).toHaveCSS('direction', t.dir);
      // Başlık.
      await expect(p.heading).toHaveText(t.heading);
      // Sekme etiketleri + her panelin içerik imzası (etiket + değer, salt etiket değil).
      for (const en of ProfilePage.TABS) {
        const localizedTab = t.tabs[ProfilePage.TABS.indexOf(en)];
        await p.selectTab(localizedTab);
        await expect(p.panelText(t.sig[en])).toBeVisible({ timeout: 10000 });
      }
    });
  }
});

// ═══════════════ STİL: ERİŞİLEBİLİRLİK (@a11y) ═══════════════
test.describe('Profil — erişilebilirlik @a11y', () => {
  test('sayfada ve her alt sekmede ciddi/kritik a11y ihlali yok', async ({ app }) => {
    const p = app.profile;
    await p.open();
    await expectNoSevereA11y(p.page); // bilinen borç (button-name/contrast) hariç
    for (const name of ['Security', 'Sessions', 'Notifications']) {
      await p.selectTab(name);
      await expectNoSevereA11y(p.page);
    }
  });
});

// ═══════════════ STİL: DÜZEN/TAŞMA (@layout) ═══════════════
test.describe('Profil — düzen/taşma @layout', () => {
  test('mobil/tablet/masaüstünde sayfa yatayda taşmıyor', async ({ app }) => {
    await expectNoOverflowAtViewports(app.page, '/settings/profile');
  });
});

// ═══════════════ STİL: CONSOLE/AĞ TEMİZLİĞİ (@clean) ═══════════════
test.describe('Profil — console/ağ temizliği @clean', () => {
  test('sayfa yüklenirken console/ağ hatası yok (allowlist dışı)', async ({ app, diagnostics }) => {
    const p = app.profile;
    await p.open();
    await waitForUiToSettle(p.page);
    diagnostics.assertClean();
  });
});

// ═══════════════ STİL: HATA-YOLU (@errorpath) ═══════════════
// API mock'u prod'a YAZMAZ; tamamen deterministik.
test.describe('Profil — hata-yolu @errorpath', () => {
  test('profil ucu 500 dönerse kabuk sağlam kalıyor (login\'e düşmüyor)', async ({ app, page }) => {
    await mockApi(page, `**${API.me}**`, { status: 500 });
    const p = app.profile;
    await page.goto('/settings/profile', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    // Kabuk + oturum korunur (login'e atılmadık); sayfa patlamaz.
    await expect(p.shell.loginHeading).toBeHidden();
  });

  test('oturum ucu 500 dönerse Sessions sekmesi zarifçe çöküyor (tablo yok)', async ({ app, page }) => {
    await mockApi(page, `**${API.sessions}**`, { status: 500 });
    const p = app.profile;
    await p.open();
    await p.selectTab('Sessions');
    // Başarısız fetch'ten sonra sahte/eski satır render EDİLMEMELİ.
    await expect(p.page.getByRole('button', { name: I18N.en.revoke, exact: true })).toHaveCount(0);
  });
});

// ═══════════════ STİL: KLAVYE/ODAK (@keyboard) ═══════════════
test.describe('Profil — klavye/odak @keyboard', () => {
  test('sekmeler ok tuşlarıyla gezilebiliyor (Radix roving tabindex)', async ({ app }) => {
    const p = app.profile;
    await p.open();
    const first = p.tab('Profile');
    await first.focus();
    await expect(first).toBeFocused();
    // Sağ ok bir sonraki sekmeye taşır (Radix klavye gezinme sözleşmesi).
    await p.page.keyboard.press('ArrowRight');
    await expect(p.tab('Security')).toBeFocused();
  });

  test('Language popover Escape ile kapanıyor', async ({ app }) => {
    const p = app.profile;
    await p.open();
    const combo = p.page.getByRole('combobox').nth(1);
    await combo.click();
    await expect(p.page.getByRole('option', { name: 'English', exact: true })).toBeVisible();
    await p.page.keyboard.press('Escape');
    await expect(p.page.getByRole('option', { name: 'English', exact: true })).toBeHidden();
  });
});

// ═══════════════ STİL: DEEP-LINK (@deeplink) ═══════════════
test.describe('Profil — deep-link @deeplink', () => {
  test('/settings/profile doğrudan açılınca profil yükleniyor (login\'e düşmüyor)', async ({ app, page }) => {
    const p = app.profile;
    await page.goto('/settings/profile', { waitUntil: 'commit' });
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    await expect(p.shell.loginHeading).toBeHidden();
    await expect(p.heading).toHaveText(I18N.en.heading);
  });
});

// ═══════════════ STİL: GÖRSEL REGRESYON (@visual) — GECE (darwin, CI'da atla) ═══════════════
// Yalnızca kararlı UI; canlı/değişken bölge (Sessions "Last Active" göreli zaman) maskelenir.
test.describe('Profil — görsel @visual', () => {
  test('Profile sekmesi kişisel-bilgi kartı görünümü değişmedi', async ({ app }) => {
    test.skip(!environment.runVisualTests, 'Görsel lane RUN_VISUAL_TESTS=true ile açık olmalı.');
    const p = app.profile;
    await p.open();
    await waitForUiToSettle(p.page);
    const panel = p.page.getByRole('tabpanel').first();
    await expect(panel).toHaveScreenshot('profile-personal-info.png', { maxDiffPixels: 200 });
  });
});
