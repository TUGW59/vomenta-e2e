// @ts-check
import { randomUUID } from 'node:crypto';

function uniqueSuffix() {
  return `${Date.now().toString(36)}_${randomUUID().replaceAll('-', '').slice(0, 10)}`;
}

/** Yeni test verisinin değiştirilemez, aranabilir otomasyon öneki. */
export const TEST_ENTITY_PREFIX = 'VOMENTA_E2E_';

/**
 * Eski koşulardan kalmış orphan'ları da yeni baseline taramalarında görünür tutar.
 * Yeni veri yalnız TEST_ENTITY_PREFIX kullanır.
 */
export const AUTOMATION_ENTITY_PREFIXES = Object.freeze([
  TEST_ENTITY_PREFIX,
  'e2e-',
  'PW_',
  'PW ',
  'pw-',
]);

/** Benzersiz ve kaynak türünü taşıyan kalıcı test varlığı anahtarı üretir. */
export function testEntityName(kind = 'ENTITY') {
  const normalized = String(kind)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'ENTITY';
  return `${TEST_ENTITY_PREFIX}${normalized}_${uniqueSuffix()}`;
}

/**
 * Paralel testlerde çakışmayacak veri üretir.
 * Mutasyon yapan staging testleri sabit isim/e-posta kullanmamalıdır.
 */
export function buildContact(overrides = {}) {
  const key = testEntityName('CONTACT');
  return {
    name: key,
    email: `${key.toLowerCase()}@example.test`,
    phone: '+15550000000',
    ...overrides,
  };
}

/**
 * Kişiler bölümü mutasyon testi için benzersiz kişi (yalnızca opt-in @mutation).
 * Telefon E.164 formatında olmalı (form doğrulaması). Varsayılan numara, kullanıcının
 * bu test için verdiği numaradır. lastName boşluksuz+benzersiz → arama ile güvenle bulunur.
 */
export function buildPeopleContact(overrides = {}) {
  const key = testEntityName('CONTACT');
  return {
    firstName: 'Test',
    lastName: key,
    phone: '+905072507710',
    tag: 'VIP',
    key,
    ...overrides,
  };
}

export function buildTicket(overrides = {}) {
  const key = testEntityName('TICKET');
  return {
    subject: key,
    description: `Playwright automation ${key}`,
    priority: 'normal',
    ...overrides,
  };
}

/**
 * Bekleyen kullanıcı daveti (Bulgu 6 mutasyon reproduksiyonu için).
 * Yalnızca staging'de kullanılır; her çağrıda benzersiz e-posta üretir.
 */
export function buildUserInvite(overrides = {}) {
  const key = testEntityName('INVITE');
  return {
    email: `${key.toLowerCase()}@example.test`,
    role: 'agent',
    key,
    ...overrides,
  };
}

/**
 * Giden kampanya (staging/@mutation akışı için). Benzersiz ad → paralel güvenli.
 * `scheduledStart` bilinçle UZAK GELECEK: kampanya hemen arama başlatmasın.
 */
export function buildCampaign(overrides = {}) {
  const key = testEntityName('CAMPAIGN');
  return {
    name: key,
    channel: 'Voice',
    scheduledStart: '2030-01-01',
    key,
    ...overrides,
  };
}
