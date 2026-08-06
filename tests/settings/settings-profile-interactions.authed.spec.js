// @ts-check
import { test } from '../fixtures/test.js';
import { assertTabsExclusive } from '../support/interactions.js';
import { ProfilePage } from '../pages/ProfilePage.js';

/**
 * AYARLAR → PROFİL (`/settings/profile`) — L2 ETKİLEŞİM DERİNLİĞİ
 * (WP-L2-WAVE-1 / ADR-0014, FAZ 1). SALT-OKUNUR.
 *
 * Gerçek etkileşim boyutu SEKME'dir (@ix-tabs): Profile / Security / Sessions / Notifications
 * seçimi dışlayıcıdır (tek aria-selected) ve her panel kendi içerik imzasını gösterir
 * (Personal Information / Change Password / Active Sessions / Notification Preferences).
 * Mutasyon YAPILMAZ (Save/Update Password/2FA production'da tıklanmaz).
 */

const I18N = ProfilePage.I18N;

test.describe('Profil — sekme etkileşim derinliği', () => {
  test('4 sekme dışlayıcı seçilir + panel içerik imzası değişir @ix-tabs', async ({ app }) => {
    const a = app.profile;
    await a.open();
    await assertTabsExclusive(a.page, (name) => a.tab(name), ProfilePage.TABS, I18N.en.sig);
  });
});
