// @ts-check
/**
 * KİŞİLER (/contacts) — ürün-metni ve sözleşme sabitleri (ÖRNEK MERKEZİLEŞTİRME).
 *
 * Amaç: UI metinleri (başlık/placeholder/etiket/çeviri) ve backend uçları gibi
 * "ürün gerçeği" tek bir yerde toplansın. UI yenilenince (ör. dev'deki yeni tasarım)
 * yalnızca BU dosya güncellenir; Page Object mantığı ve spec'ler değişmez.
 *
 * Page Object (`tests/pages/ContactsPage.js`) bu değerleri statik üye olarak yeniden
 * yayınlar (`ContactsPage.I18N` vb.), böylece mevcut spec'ler kırılmadan çalışır.
 *
 * Gözlem provenance: 28–29 Tem 2026, canlı PRODUCTION (app.vomenta.com). Dev'in
 * yenilenmiş arayüzü farklılık gösterebilir → dev'e geçişte bu dosya doğrulanmalı
 * (bkz. docs/ENVIRONMENTS.md → "Yenilenmiş UI adaptasyonu").
 */

/** Kontrollerin vurduğu backend uçları (Network ile doğrulandı). API host'u AYRI origin. */
export const CONTACTS_API = Object.freeze({
  host: 'https://api.vomenta.com',
  contacts: '/api/v1/contacts', // liste (GET), oluştur (POST)
  contactsBulk: '/api/v1/contacts/bulk', // toplu etiket/ata/kampanya (PATCH)
  contactsExport: '/api/v1/contacts/export', // Export (POST → CSV; veri değiştirmez)
  companies: '/api/v1/companies',
  users: '/api/v1/users',
});

/** Liste kolonları (İngilizce varsayılan). */
export const CONTACTS_COLUMNS = Object.freeze([
  'Name', 'Email', 'Phone', 'Company', 'Tags', 'Owner', 'Last Contact',
]);

/** Önceden tanımlı etiketler (serbest metin etiket YOK — keşif #8). */
export const CONTACTS_TAGS = Object.freeze([
  'VIP', 'Enterprise', 'Customer', 'Lead', 'Prospect',
]);

/** 4 dilde doğrulanmış çeviriler. */
export const CONTACTS_I18N = Object.freeze({
  en: {
    endonym: null, dir: 'ltr',
    heading: 'Contacts',
    subtitle: 'Manage your contacts and customer information',
    searchPlaceholder: 'Search by name, email, or phone...',
    columns: ['Name', 'Email', 'Phone', 'Company', 'Tags', 'Owner', 'Last Contact'],
    toolbar: { segments: 'Segments', import: 'Import', export: 'Export', add: 'Add Contact' },
    emptyHeading: 'No contacts found',
    emptySub: 'Try adjusting your search or filters',
    clear: 'Clear',
    newHeading: 'New Contact', save: 'Save Contact', cancel: 'Cancel',
    formLabels: ['First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Title', 'Tags', 'Owner', 'Notes'],
  },
  tr: {
    endonym: 'Türkçe', dir: 'ltr',
    heading: 'Kişiler',
    subtitle: 'Kişilerinizi ve müşteri bilgilerinizi yönetin',
    searchPlaceholder: 'Ad, e-posta veya telefon ile ara...',
    columns: ['Ad', 'E-posta', 'Telefon', 'Şirket', 'Etiketler', 'Sorumlu', 'Son İletişim'],
    toolbar: { segments: 'Segmentler', import: 'İçe Aktar', export: 'Dışa Aktar', add: 'Kişi Ekle' },
    emptyHeading: 'Kişi bulunamadı',
    emptySub: 'Arama veya filtrelerinizi ayarlamayı deneyin',
    clear: 'Temizle',
    newHeading: 'Yeni kişi', save: 'Kişiyi kaydet', cancel: 'İptal',
    formLabels: ['Ad', 'Soyad', 'E-posta', 'Telefon', 'Şirket', 'Ünvan', 'Etiketler', 'Sorumlu', 'Notlar'],
  },
  fr: {
    endonym: 'Français', dir: 'ltr',
    heading: 'Contacts',
    subtitle: 'Gérez vos contacts et informations client',
    searchPlaceholder: 'Rechercher par nom, e-mail ou téléphone...',
    columns: ['Nom', 'E-mail', 'Téléphone', 'Entreprise', 'Étiquettes', 'Responsable', 'Dernier contact'],
    toolbar: { segments: 'Segments', import: 'Importer', export: 'Exporter', add: 'Ajouter un contact' },
    emptyHeading: 'Aucun contact trouvé',
    emptySub: "Essayez d'ajuster votre recherche ou vos filtres",
    clear: 'Effacer',
    newHeading: 'Nouveau contact', save: 'Enregistrer le contact', cancel: 'Annuler',
    formLabels: ['Prénom', 'Nom', 'E-mail', 'Téléphone', 'Entreprise', 'Fonction', 'Étiquettes', 'Responsable', 'Notes'],
  },
  ar: {
    endonym: 'العربية', dir: 'rtl',
    heading: 'جهات الاتصال',
    subtitle: 'إدارة جهات الاتصال ومعلومات العملاء',
    searchPlaceholder: 'البحث بالاسم أو البريد أو الهاتف...',
    columns: ['الاسم', 'البريد الإلكتروني', 'الهاتف', 'الشركة', 'العلامات', 'المسؤول', 'آخر تواصل'],
    toolbar: { segments: 'الشرائح', import: 'استيراد', export: 'تصدير', add: 'إضافة جهة اتصال' },
    emptyHeading: 'لم يتم العثور على جهات اتصال',
    emptySub: 'حاول تعديل البحث أو عوامل التصفية',
    clear: 'مسح',
    newHeading: 'جهة اتصال جديدة', save: 'حفظ جهة الاتصال', cancel: 'إلغاء',
    formLabels: ['الاسم الأول', 'اسم العائلة', 'البريد الإلكتروني', 'الهاتف', 'الشركة', 'المسمى الوظيفي', 'العلامات', 'المسؤول', 'ملاحظات'],
  },
});

/** Toplu-eylem çubuğu metinleri — 4 dil. */
export const CONTACTS_BULK_I18N = Object.freeze({
  en: { selected: 'selected', assign: 'Assign', tag: 'Tag', addToCampaign: 'Add to Campaign', export: 'Export', delete: 'Delete' },
  tr: { selected: 'seçildi', assign: 'Ata', tag: 'Etiket', addToCampaign: 'Kampanyaya Ekle', export: 'Dışa Aktar', delete: 'Sil' },
  fr: { selected: 'sélectionné', assign: 'Attribuer', tag: 'Étiquette', addToCampaign: 'Ajouter à la campagne', export: 'Exporter', delete: 'Supprimer' },
  ar: { selected: 'محدد', assign: 'تعيين', tag: 'علامة', addToCampaign: 'إضافة إلى الحملة', export: 'تصدير', delete: 'حذف' },
});
