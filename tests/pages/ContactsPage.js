// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';
import {
  CONTACTS_API,
  CONTACTS_BULK_I18N,
  CONTACTS_COLUMNS,
  CONTACTS_I18N,
  CONTACTS_TAGS,
} from '../data/copy/contacts.js';

/**
 * Kişiler (`/contacts` = "People") sayfa nesnesi.
 *
 * Keşif notları: docs/kisiler-kesif/NOTLAR.md (+ screenshots/).
 * Sayfa taze bağlamda İngilizce açılır; dil kenar çubuğu düğmesinden tek switch ile
 * değiştirilir (repo standardı). API host'u AYRI origin'dedir: https://api.vomenta.com.
 *
 * ÜRÜN METNİ/SÖZLEŞMESİ (I18N/BULK_I18N/API/COLUMNS/TAGS) `tests/data/copy/contacts.js`
 * dosyasında toplanmıştır; buradaki statik üyeler onları yeniden yayınlar (spec'ler
 * değişmeden çalışsın diye). UI yenilenince yalnız o copy dosyası güncellenir.
 */
export class ContactsPage extends BasePage {
  static COLUMNS = CONTACTS_COLUMNS;

  /** Önceden tanımlı etiketler (serbest metin etiket YOK — keşif #8). Veri/isim → çeviri sızıntısı sayılmaz. */
  static TAGS = CONTACTS_TAGS;

  /** 4 dilde doğrulanmış çeviriler (28 Tem 2026 canlı gözlem, app.vomenta.com). */
  static I18N = CONTACTS_I18N;

  /** Toplu-eylem çubuğu (satır checkbox seçilince çıkar) — 4 dil (29 Tem 2026 canlı gözlem). */
  static BULK_I18N = CONTACTS_BULK_I18N;

  /** Kontrollerin vurduğu backend uçları (Network ile doğrulandı, 28–29 Tem 2026). */
  static API = CONTACTS_API;

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/contacts');
    this.heading = page.getByRole('heading', { level: 1 });
    this.table = page.getByRole('table');
    this.rows = page.getByRole('row');
    this.search = page.getByPlaceholder(/Search by name|Ad, e-posta|Rechercher par nom|البحث بالاسم/);
    // Boş-durum: İngilizce başlık (dile göre değişir; testte I18N'den okunur)
    this.emptyState = page.getByText('No contacts found');
    // Görünüm değiştirici (ikon-only; erişilebilir isim YOK → Gözlem O5, data-testid istenmeli)
    this.viewListButton = page.locator('main button:has(svg.lucide-list)');
    this.viewGridButton = page.locator('main button:has(svg.lucide-layout-grid)');
    // Sayfalama (ikon-only; Gözlem O2)
    this.prevPage = page.locator('main button:has(svg.lucide-chevron-left)');
    this.nextPage = page.locator('main button:has(svg.lucide-chevron-right)');
  }

  async open() {
    this.startAuthCapture();
    await super.open();
    await expect(this.heading).toHaveText(ContactsPage.I18N.en.heading, { timeout: 30000 });
    await expect(this.table).toBeVisible({ timeout: 30000 });
    // Veri-dolu veya gerçek boş-durum sinyali gelmeden liste hazır sayılmaz.
    await expect
      .poll(
        async () =>
          (await this.rows.nth(1).getByRole('cell').nth(1).textContent().catch(() => ''))?.trim() ||
          ((await this.page
            .getByText(ContactsPage.I18N.en.emptyHeading, { exact: true })
            .isVisible()
            .catch(() => false))
            ? 'empty'
            : ''),
        { timeout: 30000 }
      )
      .not.toBe('');
  }

  column(name) {
    return this.page.getByRole('columnheader', { name, exact: true });
  }

  /** Araç çubuğu birincil butonları (Segments / Import / Export / Add Contact). */
  toolbarButton(name) {
    return this.page.getByRole('button', { name, exact: true });
  }

  addContactButton(name = 'Add Contact') { return this.toolbarButton(name); }
  importButton(name = 'Import') { return this.toolbarButton(name); }
  exportButton(name = 'Export') { return this.toolbarButton(name); }
  segmentsButton(name = 'Segments') { return this.toolbarButton(name); }

  /** Tag filtre chip'i (VIP/Enterprise/...). NOT: aria-pressed YOK (Gözlem O1) → aktif durum
   *  L1'de semantik doğrulanamaz; L2 (network) gerçek etkiyi kanıtlar. */
  tagChip(name) {
    return this.page.getByRole('button', { name, exact: true });
  }

  /** Sıralama chip'i (döngü butonu: tıklayınca orderBy değişir). Kolon başlığından (th) farklı. */
  sortChip() {
    return this.page.getByRole('button', { name: 'Name', exact: true });
  }

  /** Şirket filtresi (SPAN tetikleyici → role=option listesi). */
  companyDropdown() {
    return this.page.getByText(/All Companies|Tüm Şirketler|Toutes les entreprises|جميع الشركات/).first();
  }

  /** İlk veri satırındaki ara (telefon) butonu — BULGU F1: aria-label ham anahtar "callContact".
   *  TIKLANMAZ (gerçek arama başlatabilir). */
  firstCallButton() {
    return this.rows.nth(1).locator('button:has(svg.lucide-phone)');
  }

  /** "Clear" (filtre temizle) butonu — arama/filtre etkinken görünür. */
  clearButton(name = 'Clear') { return this.toolbarButton(name); }

  // ───────────────────── Satır seçimi + toplu-eylem çubuğu ─────────────────────
  /** Bir satırın seçim checkbox'ı (satır indeksi 1'den başlar; 0 = başlık/select-all). */
  rowCheckbox(index = 1) {
    return this.rows.nth(index).getByRole('checkbox').first();
  }

  /** Başlık (tümünü seç) checkbox'ı. */
  selectAllCheckbox() {
    return this.rows.first().getByRole('checkbox').first();
  }

  /** Ada/metne göre DOĞRU satırı seçer (sıralamadan bağımsız — toplu sil/güncellemede kritik). */
  async selectRowByText(token) {
    const row = this.rows.filter({ hasText: token }).first();
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.getByRole('checkbox').first().click();
  }

  /** Toplu-eylem çubuğu — "N selected" metni + Sil butonu içeren kap (data-testid yok → içerikle). */
  bulkBar() {
    return this.page
      .locator('div')
      .filter({ has: this.page.getByRole('button', { name: /^(Delete|Sil|Supprimer|حذف)$/ }) })
      .filter({ hasText: /(selected|seçildi|sélectionné|محدد)/ })
      .last();
  }

  /** Toplu çubuk butonu (Assign/Tag/Add to Campaign/Export/Delete) — çubuğa sabitli. */
  bulkButton(name) {
    return this.bulkBar().getByRole('button', { name, exact: true });
  }

  /** "N selected" sayaç metni. */
  selectedCount() {
    return this.page.getByText(/\d+\s*(selected|seçildi|sélectionné|محدد)/).first();
  }

  /** İlk kişinin ad hücresindeki en uzun kelimeyi arama terimi olarak döndürür. */
  async firstNameToken() {
    const text = (await this.rows.nth(1).getByRole('cell').nth(1).innerText())
      .replace(/\s+/g, ' ')
      .trim();
    return text.split(' ').sort((a, b) => b.length - a.length)[0];
  }

  async searchFor(term) {
    await this.search.fill(term);
  }

  /** Arama response'u tamamlandıktan sonra eşleşen veri satırı sayısını döndürür. */
  async searchAndCount(term) {
    const response = this.page.waitForResponse(
      (candidate) =>
        candidate.request().method() === 'GET' &&
        candidate.url().includes(ContactsPage.API.contacts),
      { timeout: 15000 }
    );
    await this.search.fill(term);
    await response;
    return this.rows.filter({ hasText: term }).count();
  }

  /** Yeni ve eski otomasyon öneklerine ait kişi orphan toplamı. */
  async automationContactCount(prefixes) {
    await this.open();
    let total = 0;
    for (const prefix of prefixes) {
      total += await this.searchAndCount(prefix);
    }
    return total;
  }

  /** "Showing 1–6 of 6 contacts" bilgisi (dile göre değişir; sadece sayı çıkarımı için). */
  async shownCount() {
    const t = await this.page.locator('main').innerText();
    const m = t.match(/(\d+)[–-](\d+)\D+(\d+)/);
    return m ? { from: +m[1], to: +m[2], total: +m[3] } : null;
  }

  /** Satıra tıklayıp kişi detayına gider; /contacts/{uuid} + içerik (sekmeler) yüklenene kadar
   *  bekler. Detay id'sini döndürür. */
  async openFirstContact() {
    await this.rows.nth(1).click();
    await this.page.waitForURL(/\/contacts\/[0-9a-f-]{36}/, { timeout: 15000 });
    // Detay içeriği hazır olsun (skeleton değil): ilk sekme görünene kadar bekle
    await expect(this.page.getByRole('tab').first()).toBeVisible({ timeout: 15000 });
    return this.page.url().split('/contacts/')[1].split('?')[0];
  }

  /** New Contact formunu açar (araç çubuğu Add Contact → /contacts/new). */
  async openNewContactForm() {
    await this.addContactButton().click();
    await this.page.waitForURL(/\/contacts\/new/, { timeout: 15000 });
    await expect(this.page.getByRole('heading', { name: 'New Contact' })).toBeVisible({ timeout: 15000 });
  }

  newFormLabel(text) {
    return this.page.locator('label', { hasText: new RegExp(`^${text}`) }).first();
  }

  // ───────────────────────── Dil ─────────────────────────
  languageTrigger() {
    return this.page.locator('button', { hasText: /English|Türkçe|Français|العربية/ }).last();
  }

  /** Dili endonim etiketiyle değiştirir (İngilizce başlangıçtan tek switch güvenilirdir).
   *  Onay: kenar çubuğu dil düğmesi hedef endonim'i gösterene kadar bekle — başlık değişimi
   *  Fransızca'da güvenilmez (fr başlık da "Contacts"). */
  async switchLanguage(endonym) {
    const trigger = this.languageTrigger();
    await expect(async () => {
      await trigger.click();
      await this.page.getByText(endonym, { exact: true }).first().click({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    await expect(this.languageTrigger()).toContainText(endonym, { timeout: 10000 });
  }

  // ───────────────────── Mutasyon yardımcıları (yalnızca opt-in @mutation) ─────────────────────
  // NOT: Kişiler API'si ayrı origin'de (api.vomenta.com) ve Bearer token ile korunuyor; session
  //   cookie oraya gitmez. Bu yüzden cleanup, canlı istekten YAKALANAN Authorization başlığıyla
  //   page.request üzerinden yapılır (Bkz. NOTLAR — cookie/Bearer). page.request.* Page Object'te
  //   kullanılır (mimari doğrulayıcı yalnızca *.spec.js'te yazma isteğini yasaklar).

  /** Canlı api.vomenta.com isteklerinden Authorization (Bearer) başlığını yakalamaya başlar. */
  startAuthCapture() {
    if (this._authCaptureOn) return;
    this._authCaptureOn = true;
    this.page.on('request', (r) => {
      const h = r.headers()['authorization'];
      if (h && r.url().includes('api.vomenta.com')) this._auth = h;
    });
  }

  /** Kişiyi API ile siler (yakalanan Bearer ile). 204/200 bekler. */
  async deleteContactViaApi(id) {
    if (!id) return null;
    const resp = await this.page.request.delete(`${ContactsPage.API.host}${ContactsPage.API.contacts}/${id}`, {
      headers: this._auth ? { authorization: this._auth } : {},
    });
    return resp.status();
  }

  /** Ada göre eşleşen TÜM kişileri siler — bulletproof cleanup (POST id çıkarımından bağımsız). */
  async deleteContactsByName(token) {
    for (let i = 0; i < 10; i++) {
      await this.page.goto(this.path, { waitUntil: 'commit' });
      await this.page.waitForLoadState('domcontentloaded').catch(() => {});
      await this.table.waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
      const respP = this.page
        .waitForResponse((r) => r.url().includes(ContactsPage.API.contacts) && r.request().method() === 'GET' && decodeURIComponent(r.url()).includes(token), { timeout: 8000 })
        .catch(() => null);
      await this.search.fill(token);
      await respP;
      const row = this.rows.filter({ hasText: token }).first();
      if (!(await row.isVisible().catch(() => false))) break;
      await row.click();
      await this.page.waitForURL(/\/contacts\/[0-9a-f-]{36}/, { timeout: 10000 }).catch(() => {});
      const id = (this.page.url().match(/\/contacts\/([0-9a-f-]{36})/) || [])[1];
      if (!id) break;
      await this.deleteContactViaApi(id);
    }
  }

  /** New Contact formunu doldurur (submit YOK). data: {firstName,lastName,phone?,email?,tag?}
   *  Alanlar label ile ilişkili değil → placeholder ile doldurulur. Telefon E.164 olmalı. */
  async fillNewContact(data) {
    await this.page.getByPlaceholder('Enter first name').fill(data.firstName);
    await this.page.getByPlaceholder('Enter last name').fill(data.lastName);
    if (data.phone) await this.page.getByPlaceholder(/\+1 \(555\)/).fill(data.phone);
    if (data.email) await this.page.getByPlaceholder('email@example.com').fill(data.email);
    if (data.tag) await this.selectTag(data.tag);
  }

  /** New/Edit formundaki Tags combobox'ından önceden tanımlı bir etiket seçer. */
  async selectTag(tag) {
    const combo = this.page
      .locator('div.space-y-2', { has: this.page.locator('label', { hasText: 'Tags' }) })
      .getByRole('combobox')
      .first();
    await combo.click();
    await this.page.getByRole('option', { name: tag, exact: true }).click();
    await this.page.keyboard.press('Escape').catch(() => {});
  }

  /** Seçili kişileri toplu etiketler: Etiket → "Add Tag" dialog → tag seç → Confirm.
   *  GERÇEK PATCH /contacts/bulk (yalnızca mutation). */
  async bulkAddTag(tag) {
    await this.bulkButton(ContactsPage.BULK_I18N.en.tag).click();
    const dialog = this.page.getByRole('dialog').filter({ hasText: /Add Tag/ }).first();
    await dialog.getByRole('combobox').first().click();
    await this.page.getByRole('option', { name: tag, exact: true }).click();
    await dialog.getByRole('button', { name: 'Confirm', exact: true }).click();
    await expect(dialog).toBeHidden({ timeout: 10000 });
  }

  /** Seçili kişileri toplu siler: Sil → "Delete Contacts" alertdialog → Confirm.
   *  GERÇEK DELETE /contacts/{id} (yalnızca mutation). */
  async bulkDeleteConfirm() {
    await this.bulkButton(ContactsPage.BULK_I18N.en.delete).click();
    const alert = this.page.getByRole('alertdialog').first();
    await alert.getByRole('button', { name: 'Confirm', exact: true }).click();
    await expect(alert).toBeHidden({ timeout: 10000 });
  }

  /** Formu kaydeder (GERÇEK POST — yalnızca mutation). POST yanıtından oluşturulan id'yi döndürür
   *  (yanıt: {data:{contact:{id}}}); kaydettikten sonra uygulama /contacts listesine yönlendirir. */
  async saveNewContact() {
    const respP = this.page.waitForResponse(
      (r) => new RegExp(`${ContactsPage.API.contacts}$`).test(new URL(r.url()).pathname) && r.request().method() === 'POST',
      { timeout: 20000 }
    );
    await this.page.getByRole('button', { name: /Save Contact|Kişiyi kaydet|Enregistrer le contact|حفظ جهة الاتصال/ }).click();
    const resp = await respP;
    if (resp.status() !== 201) throw new Error(`Kişi oluşturma POST beklenmedik durum: ${resp.status()}`);
    const body = await resp.json().catch(() => ({}));
    return body?.data?.contact?.id ?? null;
  }
}
