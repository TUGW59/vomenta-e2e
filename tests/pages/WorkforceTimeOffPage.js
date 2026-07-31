// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * İş Gücü › İzinler (`/workforce/time-off`) — YENİ ayrı rota (standalone).
 *
 * Eski `/workforce` sekmeli yüzeyindeki "İzinler" sekmesinin dedicated-route
 * karşılığı (paralel, eski yüzey korunuyor). Canlı gözlem 30 Tem 2026: başlık
 * "İzinler", "İzin talep et" butonu + tablo (Ajan · Başlangıç · Bitiş · Neden ·
 * Durum · İnceleyen · İşlemler). Uç: GET `…/wfm/time-off`.
 *
 * L3 = N/A: izin talebi UI'dan SİLİNEMİYOR (terminal duruma gelince yalnız durum
 * değişir); güvenli teardown yolu yok → mutation kapsamı dışı (bkz. eski yüzey notu).
 * Bu sayfa nesnesi yalnız L1 (talep formu açılışı) + L2 (liste API ucu) doğrular.
 */
export class WorkforceTimeOffPage extends BasePage {
  static API = {
    timeOff: '/api/v1/wfm/time-off',
  };

  static L = {
    heading: /(Time Off|İzinler)/,
    requestButton: /^(Request Time Off|İzin talep et)$/,
  };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/workforce/time-off');
    this.heading = page.getByRole('heading', { level: 1 });
  }

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(WorkforceTimeOffPage.L.heading, { timeout: 30000 });
  }

  requestButton() {
    return this.page.getByRole('button', { name: WorkforceTimeOffPage.L.requestButton });
  }

  dialog() {
    return this.page.getByRole('dialog');
  }

  /** "İzin talep et" formunu açar (L1); GÖNDERİLMEZ (kalıcı kayıt, silinemez). */
  async openRequestDialog() {
    await this.requestButton().click();
    const d = this.dialog();
    await expect(d).toBeVisible({ timeout: 10000 });
    return d;
  }
}
