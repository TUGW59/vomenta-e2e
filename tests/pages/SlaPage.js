// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * SLA Politikaları (`/settings/sla`) sayfa nesnesi.
 *
 * Keşif notları: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * KPI tile'ları (Total/Active Policies) + politika tablosu + "New Policy" dialog
 * (New SLA Policy: name/first-response/resolution/priority/channels/active). Sekme YOK.
 *
 * GÜVENLİK: New Policy / Create policy production'da GÖNDERİLMEZ. Dialog yalnızca AÇILIR + disabled.
 */
export class SlaPage extends BasePage {
  static I18N = {
    en: {
      endonym: null, dir: 'ltr', heading: 'SLA Policies',
      subtitle: 'Define response and resolution time targets',
      newPolicy: 'New Policy', dialogTitle: 'New SLA Policy',
      columns: ['Name', 'First Response', 'Resolution', 'Next response (min, optional)', 'Priority', 'Channels', 'Active'],
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr', heading: 'SLA Politikaları',
      subtitle: 'Yanıt ve çözüm süresi hedeflerini tanımlayın',
      newPolicy: 'Yeni Politika', dialogTitle: null,
      columns: ['Ad', 'İlk yanıt', 'Çözüm', 'Sonraki yanıt (dk, isteğe bağlı)', 'Öncelik', 'Kanallar', 'Aktif'],
    },
    fr: {
      endonym: 'Français', dir: 'ltr', heading: 'Politiques SLA',
      subtitle: 'Définissez les objectifs de temps de réponse et de résolution',
      newPolicy: 'Nouvelle politique', dialogTitle: null,
      columns: ['Nom', 'Première réponse', 'Résolution', 'Réponse suivante (min, optionnel)', 'Priorité', 'Canaux', 'Actif'],
    },
    ar: {
      endonym: 'العربية', dir: 'rtl', heading: 'سياسات اتفاقية الخدمة',
      subtitle: 'حدد أهداف وقت الاستجابة والحل',
      newPolicy: 'سياسة جديدة', dialogTitle: null,
      columns: ['الاسم', 'أول استجابة', 'الحل', 'الاستجابة التالية (دقيقة، اختياري)', 'الأولوية', 'القنوات', 'نشط'],
    },
  };

  static API = { sla: '/api/v1/automations/sla-policies' };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/settings/sla');
    this.heading = page.getByRole('heading', { level: 1 });
    this.newPolicyButton = page.getByRole('button', { name: SlaPage.I18N.en.newPolicy, exact: true });
    this.table = page.locator('main table').first();
    this.rows = this.table.locator('tbody tr');
  }

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(SlaPage.I18N.en.heading, { timeout: 30000 });
  }

  async openNewPolicyDialog() {
    const dialog = this.page.getByRole('dialog');
    await expect(async () => {
      await this.newPolicyButton.click();
      await expect(dialog).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    return dialog;
  }
}
