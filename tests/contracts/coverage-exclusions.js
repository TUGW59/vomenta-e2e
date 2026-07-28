// @ts-check

/**
 * Kontrol (tuş) kapsama sözleşmesi.
 *
 * "Test edilen" tuşlar rapora testlerin kendisinden otomatik gelir
 * (bkz. tools/generate-coverage.mjs). Bu dosya ise otomatik türetilemeyen iki listeyi
 * DEKLARATİF olarak tutar; böylece kapsama raporu versiyonlanır ve kod incelemesinde görünür.
 */

/**
 * BİLEREK test edilmeyen tuşlar — güvenlik gereği tıklanmaz
 * (veri değiştirir / geri döndürülemez / dış servise gider).
 */
export const COVERAGE_EXCLUSIONS = Object.freeze([
  { control: 'Export / Export All', pages: 'Contacts, Tickets, Reports', reason: 'Dosya indirir', category: 'download' },
  { control: 'Import', pages: 'Contacts', reason: 'Toplu veri içe aktarır', category: 'mutation' },
  { control: 'Create Ticket / Add Contact — kaydet', pages: 'Tickets, Contacts', reason: 'Gerçek kayıt oluşturur', category: 'mutation' },
  { control: 'Send SMS — gönder / Start Call', pages: 'Channels, Voice', reason: 'Gerçek mesaj/çağrı başlatır', category: 'external-side-effect' },
  { control: 'Settings — Save / durum seçimi (Away, Offline)', pages: 'Settings, Header', reason: 'Hesabı/ayarı kalıcı değiştirir', category: 'mutation' },
  { control: 'Google / Microsoft ile giriş', pages: 'Login', reason: 'Dış kimlik doğrulama akışı', category: 'external-auth' },
  { control: 'Silme (Delete)', pages: 'Genel', reason: 'Geri döndürülemez', category: 'destructive' },
]);

/**
 * GÜVENLİ ama henüz test kapsamına alınmamış tuşlar (yapılacak).
 * Bunlar tıklanınca sayfa/dialog açar; zamanla test kapsamına eklenebilir.
 */
export const COVERAGE_TODO = Object.freeze([
  { control: 'New Dashboard / Custom Report / Schedule a Report', pages: 'Reports' },
  { control: 'Bildirimler paneli', pages: 'Header' },
  { control: 'Dil menüsü', pages: 'Header' },
]);
