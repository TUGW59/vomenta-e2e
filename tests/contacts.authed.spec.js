// @ts-check
import fs from 'node:fs';
import { test, expect } from './fixtures/test.js';
import { ContactsPage } from './pages/ContactsPage.js';

/**
 * KİŞİLER (`/contacts` = "People") — salt-okunur.
 * Keşif + kanıt: docs/kisiler-kesif/NOTLAR.md (+ screenshots/). Canlı gözlem: 28 Tem 2026, app.vomenta.com.
 *
 * ┌─ HER KONTROL İÇİN 3 KATMAN (AGENTS.md standardı) ──────────────────────────┐
 * │ L1 — TIKLAMA OK : etkileşim çalışır, UI gözlemlenebilir tepki verir.        │
 * │ L2 — ARKA PLAN OK: doğru backend ucu tetiklenir (method+endpoint). Mutasyon │
 * │                    isteği `page.route` ile YAKALANIR (prod'a yazılmaz).      │
 * │ L3 — GÖREV OK   : kontrol amacını gerçekten yerine getirir. Kalıcı kayıt    │
 * │                    (create/delete) → opt-in mutation kategorisi (ayrı spec).       │
 * └────────────────────────────────────────────────────────────────────────────┘
 * L3 kalıcı-kayıt mutasyonları: tests/contacts-mutations.authed.spec.js
 * (yalnızca kimliği doğrulanan staging tenant'ında `npm run test:mutation`).
 * BULGULAR (F1 callContact · F2 contacts.delete) test.fail guard'larıyla altta.
 */

const I18N = ContactsPage.I18N;
const API = ContactsPage.API;

/** api.vomenta.com'a giden GET /contacts isteği (opsiyonel decoded-URL ipucu ile). */
const contactsGet = (r, needle) =>
  r.method() === 'GET' &&
  r.url().includes(API.contacts) &&
  !/\/contacts\/[0-9a-f-]{36}/.test(r.url()) &&
  (!needle || decodeURIComponent(r.url()).includes(needle));

// ───────────────────────────── YAPI ─────────────────────────────
test.describe('Kişiler — yapı', () => {
  test('başlık, alt başlık ve 7 kolon görünüyor @smoke', async ({ app }) => {
    const c = app.contacts;
    await c.open();
    await expect(c.heading).toHaveText(I18N.en.heading);
    await expect(c.page.getByText(I18N.en.subtitle)).toBeVisible();
    for (const col of ContactsPage.COLUMNS) {
      await expect(c.column(col)).toBeVisible();
    }
  });

  test('araç çubuğu butonları ve arama mevcut @critical', async ({ app }) => {
    const c = app.contacts;
    await c.open();
    for (const name of Object.values(I18N.en.toolbar)) {
      await expect(c.toolbarButton(name)).toBeVisible();
    }
    await expect(c.search).toBeVisible();
  });

  test('en az bir kişi listeleniyor @smoke', async ({ app }) => {
    const c = app.contacts;
    await c.open();
    expect(await c.rows.count()).toBeGreaterThan(1);
  });
});

// ──────────────────────── 4 DİL ÇEVİRİ GUARD'LARI ────────────────────────
test.describe("Kişiler — 4 dil çeviri guard'ları @regression", () => {
  for (const [code, t] of Object.entries(I18N)) {
    test(`[${code}] yön + başlık + alt başlık + kolonlar + araç çubuğu + New Contact formu çevrili`, async ({ app }) => {
      const c = app.contacts;
      await c.open();
      if (t.endonym) await c.switchLanguage(t.endonym);

      await expect(c.page.locator('body')).toHaveCSS('direction', t.dir);
      await expect(c.heading).toHaveText(t.heading);
      await expect(c.page.getByText(t.subtitle)).toBeVisible();
      for (const col of t.columns) {
        await expect(c.column(col)).toBeVisible();
      }
      for (const name of Object.values(t.toolbar)) {
        await expect(c.toolbarButton(name)).toBeVisible();
      }
      // Oluşturma formu da çevrili (submit YOK)
      await c.toolbarButton(t.toolbar.add).click();
      await c.page.waitForURL(/\/contacts\/new/, { timeout: 15000 });
      await expect(c.page.getByRole('heading', { name: t.newHeading, exact: true })).toBeVisible();
      for (const label of [t.formLabels[0], t.formLabels[1], t.formLabels[8]]) {
        await expect(c.newFormLabel(label)).toBeVisible();
      }
      await expect(c.page.getByRole('button', { name: t.save, exact: true })).toBeVisible();
      await expect(c.page.getByRole('button', { name: t.cancel, exact: true })).toBeVisible();
    });
  }
});

// ═══════════════ KONTROL: ARAMA (L1 + L2 + L3) ═══════════════
test.describe('Kontrol: Arama @regression', () => {
  test('L1 tıklama OK: terim girince liste süzülür ve "Clear" çıkar', async ({ app }) => {
    const c = app.contacts;
    await c.open();
    const before = await c.rows.count();
    await c.searchFor('Arda');
    await expect(c.clearButton()).toBeVisible({ timeout: 10000 });
    await expect.poll(() => c.rows.count(), { timeout: 10000 }).toBeLessThan(before);
  });

  test('L2 arka plan OK: arama filters={"search":…} ile API sorgusu atıyor @critical', async ({ app, page }) => {
    const c = app.contacts;
    await c.open();
    const req = page.waitForRequest((r) => contactsGet(r, '"search"'), { timeout: 10000 });
    await c.searchFor('Arda');
    await req;
  });

  test('L3 görev OK: eşleşen kişi görünür, eşleşmeyen sorgu boş-durum gösterir', async ({ app }) => {
    const c = app.contacts;
    await c.open();
    const token = await c.firstNameToken();
    expect(token, 'ad hücresinden arama terimi çıkarılabilmeli').toBeTruthy();

    await c.searchFor(token);
    await expect(c.table.getByText(token, { exact: false }).first()).toBeVisible({ timeout: 10000 });

    await c.searchFor('zzz_no_match_xyz_9090');
    await expect(c.page.getByText(I18N.en.emptyHeading)).toBeVisible({ timeout: 10000 });
    await expect(c.page.getByText(I18N.en.emptySub)).toBeVisible();
  });
});

// ═══════════════ KONTROL: TAG FİLTRESİ (L1 + L2 + L3) ═══════════════
// NOT: chip'lerde aria-pressed YOK (Gözlem O1) → aktif durum semantik doğrulanamıyor;
//   frontend'den data-testid/aria-pressed istenmeli. L2 gerçek etkiyi kanıtlar.
test.describe('Kontrol: Tag filtresi @regression', () => {
  test('L1 tıklama OK: 5 tag chip görünür ve tıklanabilir', async ({ app }) => {
    const c = app.contacts;
    await c.open();
    for (const tag of ContactsPage.TAGS) {
      await expect(c.tagChip(tag)).toBeEnabled();
    }
  });

  test('L2 arka plan OK: chip tıklanınca filters={"tags":[…]} sorgusu atılıyor @critical', async ({ app, page }) => {
    const c = app.contacts;
    await c.open();
    const req = page.waitForRequest((r) => contactsGet(r, '"tags"'), { timeout: 10000 });
    await c.tagChip('VIP').click();
    await req;
  });

  test('L3 görev OK: filtre listeyi süzüyor (VIP kişisi yoksa boş-durum)', async ({ app }) => {
    const c = app.contacts;
    await c.open();
    const before = await c.rows.count();
    await c.tagChip('VIP').click();
    // Liste değişir: ya süzülmüş satırlar ya boş-durum
    await expect
      .poll(async () => (await c.page.getByText(I18N.en.emptyHeading).isVisible()) || (await c.rows.count()) !== before, { timeout: 10000 })
      .toBe(true);
  });
});

// ═══════════════ KONTROL: ŞİRKET FİLTRESİ (L1 + L2 + L3) ═══════════════
test.describe('Kontrol: Şirket filtresi @regression', () => {
  test('L1 tıklama OK: dropdown açılıyor (All Companies + en az bir şirket)', async ({ app }) => {
    const c = app.contacts;
    await c.open();
    await c.companyDropdown().click();
    await expect(c.page.getByRole('option').first()).toBeVisible({ timeout: 8000 });
    expect(await c.page.getByRole('option').count()).toBeGreaterThan(1);
    await c.page.keyboard.press('Escape');
  });

  test('L2 arka plan OK: bir şirket seçilince liste yeniden çekiliyor', async ({ app, page }) => {
    const c = app.contacts;
    await c.open();
    await c.companyDropdown().click();
    const option = page.getByRole('option').nth(1); // "All Companies" dışındaki ilk şirket
    const req = page.waitForRequest((r) => contactsGet(r), { timeout: 10000 });
    await option.click();
    await req;
  });

  test('L3 görev OK: seçilen şirket dropdown tetikleyicisinde yansıyor', async ({ app, page }) => {
    const c = app.contacts;
    await c.open();
    await c.companyDropdown().click();
    const option = page.getByRole('option').nth(1);
    const label = (await option.innerText()).trim();
    await option.click();
    await expect(c.page.getByText(label, { exact: false }).first()).toBeVisible({ timeout: 8000 });
  });
});

// ═══════════════ KONTROL: SIRALAMA (L1 + L2 + L3) ═══════════════
test.describe('Kontrol: Sıralama @regression', () => {
  const names = async (c) => (await c.rows.allInnerTexts()).slice(1).join('|');

  test('L1 tıklama OK: sort chip görünür ve tıklanabilir', async ({ app }) => {
    const c = app.contacts;
    await c.open();
    await expect(c.sortChip()).toBeEnabled();
    await c.sortChip().click();
  });

  test('L2 arka plan OK: sort chip yeni sort=[…] ile sorgu atıyor @critical', async ({ app, page }) => {
    const c = app.contacts;
    await c.open();
    const req = page.waitForRequest((r) => contactsGet(r, '"orderBy"') && !decodeURIComponent(r.url()).includes('firstName'), { timeout: 10000 });
    await c.sortChip().click();
    await req;
  });

  test('L3 görev OK: satır sırası değişiyor', async ({ app }) => {
    const c = app.contacts;
    await c.open();
    const before = await names(c);
    await c.sortChip().click();
    await expect.poll(async () => await names(c), { timeout: 10000 }).not.toBe(before);
  });
});

// ═══════════════ KONTROL: GÖRÜNÜM DEĞİŞTİRİCİ (L1 + L3) ═══════════════
// L2: N/A — saf istemci-tarafı görünüm değişimi (ağ isteği yok).
// NOT: butonlar ikon-only, erişilebilir isim YOK (Gözlem O5) → data-testid istenmeli;
//   aktif durum "bg-primary" sınıfıyla (son çare CSS) gözlemlenir.
test.describe('Kontrol: Görünüm değiştirici (liste/ızgara) @regression', () => {
  test('L1 tıklama OK: ızgara butonu tıklanınca aktif duruma geçiyor', async ({ app }) => {
    const c = app.contacts;
    await c.open();
    await expect(c.viewGridButton).toBeVisible();
    await c.viewGridButton.click();
    await expect(c.viewGridButton).toHaveClass(/bg-primary/, { timeout: 8000 });
  });

  test('L3 görev OK: ızgara görünümü tabloyu değiştiriyor, listeye dönünce tablo geri geliyor', async ({ app }) => {
    const c = app.contacts;
    await c.open();
    await c.viewGridButton.click();
    await expect(c.table).toBeHidden({ timeout: 8000 });
    await c.viewListButton.click();
    await expect(c.table).toBeVisible({ timeout: 8000 });
  });
});

// ═══════════════ KONTROL: ADD CONTACT (L1 + L2) ═══════════════
// L3 görev OK: kalıcı kayıt (kişi oluşturma) → opt-in mutation kategorisi.
//   Bkz. tests/contacts-mutations.authed.spec.js.
test.describe('Kontrol: Add Contact @regression', () => {
  test('L1 tıklama OK: New Contact formunu açıyor (9 alan + Kaydet/İptal)', async ({ app }) => {
    const c = app.contacts;
    await c.open();
    await c.openNewContactForm();
    for (const label of I18N.en.formLabels) {
      await expect(c.newFormLabel(label)).toBeVisible();
    }
    await expect(c.page.getByRole('button', { name: I18N.en.save, exact: true })).toBeVisible();
    await expect(c.page.getByRole('button', { name: I18N.en.cancel, exact: true })).toBeVisible();
  });

  test("L2 arka plan OK: Save doğru uca POST gönderiyor (prod'a YAZILMAZ)", async ({ app, page }) => {
    const c = app.contacts;
    await c.open();
    let posted = false;
    await page.route(`**${API.contacts}`, async (route) => {
      if (route.request().method() === 'POST') {
        posted = true;
        await route.fulfill({ status: 201, contentType: 'application/json', body: '{"id":"mock"}' });
      } else {
        await route.continue();
      }
    });
    await c.openNewContactForm();
    await c.fillNewContact({ firstName: 'PW', lastName: 'Mock' });
    await c.page.getByRole('button', { name: I18N.en.save, exact: true }).click();
    await expect.poll(() => posted, { timeout: 10000 }).toBe(true);
  });
});

// ═══════════════ KONTROL: IMPORT (L1) ═══════════════
// L2 + L3: N/A — içe aktarma dosya yükler ve veri oluşturur (mutation); canlıda tetiklenmez.
test.describe('Kontrol: Import @regression', () => {
  test('L1 tıklama OK: /contacts/import sayfasını (dosya girişli) açıyor', async ({ app }) => {
    const c = app.contacts;
    await c.open();
    await c.importButton().click();
    await c.page.waitForURL(/\/contacts\/import/, { timeout: 15000 });
    await expect(c.page.getByRole('heading', { name: /Import Contacts/i })).toBeVisible();
    await expect(c.page.locator('input[type="file"]')).toHaveCount(1);
  });
});

// ═══════════════ KONTROL: EXPORT (L1 + L2 + L3) ═══════════════
// Export POST /contacts/export atar + CSV indirir; veri DEĞİŞTİRMEZ → canlıda güvenli.
test.describe('Kontrol: Export @regression', () => {
  test('L1 tıklama OK: Export tıklanınca indirme başlıyor', async ({ app, page }) => {
    const c = app.contacts;
    await c.open();
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      c.exportButton().click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('L2 arka plan OK: Export POST /contacts/export ucunu tetikliyor @critical', async ({ app, page }) => {
    const c = app.contacts;
    await c.open();
    const req = page.waitForRequest(
      (r) => r.method() === 'POST' && r.url().includes(API.contactsExport),
      { timeout: 15000 }
    );
    await c.exportButton().click();
    await req;
  });

  test('L3 görev OK: indirilen CSV içeriği doğru (başlık + kodlama), bozulma yok', async ({ app, page }, testInfo) => {
    const c = app.contacts;
    await c.open();
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      c.exportButton().click(),
    ]);
    const csv = fs.readFileSync(await download.path(), 'utf8');
    // Excel-uyumlu başlangıç + tam kolon başlığı (backend kolonları değişirse guard kırılır)
    expect(csv.startsWith('﻿sep=,'), 'CSV UTF-8 BOM + sep=, ile başlamalı').toBe(true);
    expect(csv).toContain('id,firstName,lastName,email,phone,company,title,tags,source,isActive,createdAt');
    // Bozulma yok: Unicode replacement char bulunmamalı
    expect(csv.includes('�'), 'kodlama bozulması (\\uFFFD) olmamalı').toBe(false);
    expect(csv.split('\n').length, 'en az bir veri satırı olmalı').toBeGreaterThan(3);
    await testInfo.attach('contacts-export.csv', { body: csv, contentType: 'text/csv' });
  });

  test('L3 görev OK: farklı dilde indirme dili değiştirmez / bozulmaz (en == ar başlık)', async ({ app, page }) => {
    const c = app.contacts;
    // İngilizce indir
    await c.open();
    const [dlEn] = await Promise.all([page.waitForEvent('download', { timeout: 15000 }), c.exportButton().click()]);
    const en = fs.readFileSync(await dlEn.path(), 'utf8');
    // Arapça'ya geç, tekrar indir (buton adı da Arapça: تصدير)
    await c.switchLanguage(I18N.ar.endonym);
    const [dlAr] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      c.exportButton(I18N.ar.toolbar.export).click(),
    ]);
    const ar = fs.readFileSync(await dlAr.path(), 'utf8');
    const header = (s) => s.split('\n').slice(0, 2).join('\n'); // BOM+sep + kolon başlığı
    expect(header(ar), 'export başlığı UI diline göre değişmemeli').toBe(header(en));
    expect(ar.includes('�'), 'Arapça indirmede kodlama bozulması olmamalı').toBe(false);
  });
});

// ═══════════════ KONTROL: SEGMENTS (L1) ═══════════════
test.describe('Kontrol: Segments @regression', () => {
  test('L1 tıklama OK: /contacts/segments sayfasını açıyor', async ({ app }) => {
    const c = app.contacts;
    await c.open();
    await c.segmentsButton().click();
    await c.page.waitForURL(/\/contacts\/segments/, { timeout: 15000 });
    await expect(c.page.getByRole('heading', { name: /Segments/i }).first()).toBeVisible();
  });
});

// ═══════════════ KONTROL: SATIR → DETAY (L1 + L2 + L3) ═══════════════
test.describe('Kontrol: Satır → kişi detayı @regression', () => {
  test('L1 tıklama OK: satıra tıklayınca /contacts/{id} detayına gidiyor', async ({ app }) => {
    const c = app.contacts;
    await c.open();
    await c.rows.nth(1).click();
    await c.page.waitForURL(/\/contacts\/[0-9a-f-]{36}/, { timeout: 15000 });
  });

  test('L2 arka plan OK: detay kişi + timeline uçlarından veri çekiyor @critical', async ({ app, page }) => {
    const c = app.contacts;
    await c.open();
    const detail = page.waitForRequest((r) => /\/api\/v1\/contacts\/[0-9a-f-]{36}$/.test(r.url()) && r.method() === 'GET', { timeout: 10000 });
    const timeline = page.waitForRequest((r) => /\/contacts\/[0-9a-f-]{36}\/timeline/.test(r.url()), { timeout: 10000 });
    await c.rows.nth(1).click();
    await Promise.all([detail, timeline]);
  });

  test('L3 görev OK: detay sayfası kişi adını ve sekmeleri gösteriyor', async ({ app }) => {
    const c = app.contacts;
    await c.open();
    // Satır ad hücresi avatar baş harflerini de içerir; ters-içerme ile doğrula (hücre metni h1'i içermeli)
    const rowCellText = (await c.rows.nth(1).getByRole('cell').nth(1).innerText()).replace(/\s+/g, ' ').trim();
    await c.openFirstContact(); // içerik (ilk sekme) hazır olana kadar bekler
    const h1 = (await c.page.getByRole('heading', { level: 1 }).innerText()).trim();
    expect(rowCellText, 'detay başlığı listedeki kişi adıyla eşleşmeli').toContain(h1);
    for (const tab of ['Timeline', 'Details', 'Notes', 'Tickets', 'Activity']) {
      await expect(c.page.getByRole('tab', { name: tab, exact: true })).toBeVisible({ timeout: 10000 });
    }
  });
});

// ═══════════════ KONTROL: SAYFALAMA (L1) ═══════════════
// L3 görev OK: N/A — hesapta yalnızca 6 kişi (tek sayfa); ikinci sayfaya geçiş bu veriyle
//   doğrulanamaz. Veri > 1 sayfa olunca L3 (sayfa değişimi) eklenmeli.
// NOT: prev/next ikon-only, erişilebilir isim YOK (Gözlem O2) → data-testid istenmeli.
test.describe('Kontrol: Sayfalama @regression', () => {
  test('L1 OK: tek sayfada prev/next pasif ve sayaç "of N" gösteriyor', async ({ app }) => {
    const c = app.contacts;
    await c.open();
    const count = await c.shownCount();
    expect(count, 'sayfalama sayacı okunmalı').not.toBeNull();
    await expect(c.prevPage).toBeDisabled();
    await expect(c.nextPage).toBeDisabled();
  });
});

// ═══════════════ KONTROL: SATIR SEÇİMİ + TOPLU-EYLEM ÇUBUĞU ═══════════════
// Satır checkbox'ı seçilince çıkan çubuk: Ata · Etiket · Kampanyaya Ekle · Dışa Aktar · Sil.
// L2: N/A (seçim saf istemci-tarafı). Toplu eylemlerin L2/L3 mutasyonları → contacts-mutations spec.
test.describe('Kontrol: Satır seçimi + toplu çubuk @regression', () => {
  test('L1 tıklama OK: bir satır seçilince "1 selected" + 5 toplu buton çıkıyor', async ({ app }) => {
    const c = app.contacts;
    await c.open();
    await c.rowCheckbox(1).click();
    await expect(c.selectedCount()).toBeVisible();
    const b = ContactsPage.BULK_I18N.en;
    for (const name of [b.assign, b.tag, b.addToCampaign, b.delete]) {
      await expect(c.bulkButton(name)).toBeVisible();
    }
  });

  test('L3 görev OK: "tümünü seç" tüm satırları seçiyor (sayaç = toplam)', async ({ app }) => {
    const c = app.contacts;
    await c.open();
    const total = (await c.shownCount())?.total ?? 0;
    await c.selectAllCheckbox().click();
    await expect(c.selectedCount()).toContainText(String(total));
  });
});

// 4 dilde toplu çubuk etiketleri
test.describe('Kişiler — toplu çubuk 4 dil guard @regression', () => {
  for (const [code, t] of Object.entries(ContactsPage.BULK_I18N)) {
    test(`[${code}] toplu çubuk buton etiketleri çevrili`, async ({ app }) => {
      const c = app.contacts;
      await c.open();
      if (I18N[code].endonym) await c.switchLanguage(I18N[code].endonym);
      await c.rowCheckbox(1).click();
      await expect(c.selectedCount()).toContainText(t.selected);
      for (const name of [t.assign, t.tag, t.addToCampaign, t.delete]) {
        await expect(c.bulkButton(name)).toBeVisible();
      }
    });
  }
});

// ═══════ KONTROL: TOPLU DİYALOGLAR (Ata / Etiket / Kampanyaya Ekle) — L1 ═══════
// L1: dialog açılır (picker + Confirm/Cancel); UYGULAMA YOK (Cancel). L2/L3 → mutation spec.
test.describe('Kontrol: Toplu eylem diyalogları @regression', () => {
  for (const cse of [
    { btn: 'assign', heading: 'Assign Owner' },
    { btn: 'tag', heading: 'Add Tag' },
    { btn: 'addToCampaign', heading: 'Add to Campaign' },
  ]) {
    test(`L1 tıklama OK: "${cse.heading}" diyaloğu açılıyor (Confirm/Cancel)`, async ({ app }) => {
      const c = app.contacts;
      await c.open();
      await c.rowCheckbox(1).click();
      await c.bulkButton(ContactsPage.BULK_I18N.en[cse.btn]).click();
      const dialog = c.page.getByRole('dialog').filter({ hasText: cse.heading }).first();
      await expect(dialog.getByRole('heading', { name: cse.heading })).toBeVisible();
      await expect(dialog.getByRole('button', { name: 'Confirm', exact: true })).toBeVisible();
      await dialog.getByRole('button', { name: 'Cancel', exact: true }).click(); // UYGULAMA YOK
    });
  }
});

// ═══════════════ KONTROL: TOPLU DIŞA AKTAR (seçili) — L1 + L2 ═══════════════
test.describe('Kontrol: Toplu Dışa Aktar @regression', () => {
  test('L1 tıklama OK: seçili export indirme başlatıyor', async ({ app, page }) => {
    const c = app.contacts;
    await c.open();
    await c.rowCheckbox(1).click();
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      c.bulkButton(ContactsPage.BULK_I18N.en.export).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('L2 arka plan OK: toplu export POST /contacts/export tetikliyor @critical', async ({ app, page }) => {
    const c = app.contacts;
    await c.open();
    await c.rowCheckbox(1).click();
    const req = page.waitForRequest((r) => r.method() === 'POST' && r.url().includes(API.contactsExport), { timeout: 15000 });
    await c.bulkButton(ContactsPage.BULK_I18N.en.export).click();
    await req;
  });
});

// ═══════════════ KONTROL: TOPLU SİL — onay (L1) ═══════════════
// L1: alertdialog "Delete Contacts" çıkar; İPTAL edilir (gerçek silme YOK). L3 → mutation spec.
test.describe('Kontrol: Toplu Sil (onay) @regression', () => {
  test("L1 tıklama OK: Sil onay alertdialog'u açıyor; İptal listeyi değiştirmiyor", async ({ app }) => {
    const c = app.contacts;
    await c.open();
    const before = (await c.shownCount())?.total;
    await c.rowCheckbox(1).click();
    await c.bulkButton(ContactsPage.BULK_I18N.en.delete).click();
    const alert = c.page.getByRole('alertdialog').first();
    await expect(alert.getByRole('heading', { name: /Delete Contacts/i })).toBeVisible();
    await alert.getByRole('button', { name: 'Cancel', exact: true }).click(); // gerçek silme YOK
    await c.open();
    expect((await c.shownCount())?.total).toBe(before);
  });
});

// ═══════════════════════ BULGULAR (test.fail guard) ═══════════════════════
test.describe('Kişiler — bilinen çeviri sızıntıları (BULGU) @regression', () => {
  test('BULGU F1: satır ara butonu erişilebilir ismi ham anahtar "callContact" olmamalı', async ({ app }) => {
    test.fail(true, 'callContact ham i18n anahtarı (a11y+i18n); düzelince bu test yeşile döner → guard kalıcılaşır');
    const c = app.contacts;
    await c.open();
    const label = await c.firstCallButton().getAttribute('aria-label');
    expect(label, 'ara butonu aria-label ham anahtar olmamalı').not.toBe('callContact');
  });

  test('BULGU F2: kişi detayı sil butonu ham anahtar "contacts.delete" göstermemeli', async ({ app }) => {
    test.fail(true, 'contacts.delete ham i18n anahtarı (görünür metin); düzelince yeşile döner → guard kalıcılaşır');
    const c = app.contacts;
    await c.open();
    await c.openFirstContact();
    // Quick Actions render olsun (kardeş "Merge Contacts" butonu doğru etiketli) — sonra sızıntıyı kontrol et
    await expect(c.page.getByRole('button', { name: 'Merge Contacts' })).toBeVisible({ timeout: 15000 });
    await expect(c.page.getByText('contacts.delete', { exact: true })).toHaveCount(0);
  });
});
