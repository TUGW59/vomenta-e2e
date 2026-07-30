// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './BasePage.js';

/**
 * Otomasyon Kuralları (`/settings/automations`) sayfa nesnesi.
 *
 * Keşif notları: docs/ayarlar-kesif/NOTLAR.md (+ screenshots/).
 * 2 sekme: **Rules** (boş-durum "No automation rules configured" + New Rule dialog) ·
 * **SLA Policies** (veri dolu tablo). New Rule dialog: Rule Name/Description/Trigger/Conditions/
 * Actions/Save Rule. Taze bağlamda İngilizce açılır.
 *
 * GÜVENLİK: New Rule / Save Rule production'da GÖNDERİLMEZ. Dialog yalnızca AÇILIR + disabled.
 */
export class AutomationsPage extends BasePage {
  static I18N = {
    en: {
      endonym: null, dir: 'ltr', heading: 'Automation Rules',
      subtitle: 'Automate workflows based on triggers and conditions',
      newRule: 'New Rule', tabs: ['Rules', 'SLA Policies'], dialogTitle: 'New Automation Rule',
      emptyRules: 'No automation rules configured',
    },
    tr: {
      endonym: 'Türkçe', dir: 'ltr', heading: 'Otomasyon Kuralları',
      subtitle: 'Tetikleyiciler ve koşullara dayalı iş akışlarını otomatikleştirin',
      newRule: 'Yeni Kural', tabs: ['Kurallar', 'SLA Politikaları'], dialogTitle: null, emptyRules: null,
    },
    fr: {
      endonym: 'Français', dir: 'ltr', heading: "Règles d'automatisation",
      subtitle: 'Automatisez les flux de travail basés sur des déclencheurs et des conditions',
      newRule: 'Nouvelle règle', tabs: ['Règles', 'Politiques SLA'], dialogTitle: null, emptyRules: null,
    },
    ar: {
      endonym: 'العربية', dir: 'rtl', heading: 'قواعد الأتمتة',
      subtitle: 'أتمتة سير العمل بناءً على المشغلات والشروط',
      newRule: 'قاعدة جديدة', tabs: ['القواعد', 'سياسات SLA'], dialogTitle: null, emptyRules: null,
    },
  };

  static API = { rules: '/api/v1/automation', sla: '/api/v1/sla' };

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page, '/settings/automations');
    this.heading = page.getByRole('heading', { level: 1 });
    this.newRuleButton = page.getByRole('button', { name: AutomationsPage.I18N.en.newRule, exact: true });
  }

  async open() {
    await super.open();
    await expect(this.heading).toHaveText(AutomationsPage.I18N.en.heading, { timeout: 30000 });
  }

  tab(name) {
    return this.page.getByRole('tab', { name, exact: true });
  }

  async selectTab(name) {
    const tab = this.tab(name);
    await expect(async () => {
      await tab.click();
      await expect(tab).toHaveAttribute('aria-selected', 'true', { timeout: 2000 });
    }).toPass({ timeout: 15000 });
    return tab;
  }

  async openNewRuleDialog() {
    const dialog = this.page.getByRole('dialog');
    await expect(async () => {
      await this.newRuleButton.click();
      await expect(dialog).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 15000 });
    return dialog;
  }
}
