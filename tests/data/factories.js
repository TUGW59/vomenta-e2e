// @ts-check

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Paralel testlerde çakışmayacak veri üretir.
 * Mutasyon yapan staging testleri sabit isim/e-posta kullanmamalıdır.
 */
export function buildContact(overrides = {}) {
  const suffix = uniqueSuffix();
  return {
    name: `PW Contact ${suffix}`,
    email: `pw-${suffix}@example.test`,
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
  const suffix = uniqueSuffix().replace(/[^a-z0-9]/gi, '');
  return {
    firstName: 'PW',
    lastName: `Auto${suffix}`,
    phone: '+905072507710',
    tag: 'VIP',
    ...overrides,
  };
}

export function buildTicket(overrides = {}) {
  const suffix = uniqueSuffix();
  return {
    subject: `PW Ticket ${suffix}`,
    description: `Playwright automation ${suffix}`,
    priority: 'normal',
    ...overrides,
  };
}

/**
 * Bekleyen kullanıcı daveti (Bulgu 6 mutasyon reproduksiyonu için).
 * Yalnızca staging'de kullanılır; her çağrıda benzersiz e-posta üretir.
 */
export function buildUserInvite(overrides = {}) {
  const suffix = uniqueSuffix();
  return {
    email: `pw-invite-${suffix}@example.test`,
    role: 'agent',
    ...overrides,
  };
}

/**
 * Gönderici Kimliği talebi (staging/@mutation akışı için).
 * Alphanumeric sender ID en fazla 11 karakter olmalı → benzersiz ama kısa üretilir.
 * Yalnız harf/rakam (alfanümerik kuralı). "PW" öneki + kısa benzersiz sonek.
 */
export function buildSenderId(overrides = {}) {
  const suffix = uniqueSuffix().replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 9);
  return {
    senderId: `PW${suffix}`.slice(0, 11),
    senderType: 'ALPHANUMERIC',
    purpose: `Playwright automation ${suffix}`,
    ...overrides,
  };
}

/**
 * DNC (Aranmayacak) kaydı (staging/@mutation akışı için). Benzersiz E.164 numara üretir.
 * 555-01xx aralığı kurgusaldır (gerçek aboneye atanmaz) → güvenli test verisi.
 */
export function buildDncEntry(overrides = {}) {
  // 555-0100..555-8199 arası kurgusal; benzersizlik için sonek'ten türet.
  const n = parseInt(uniqueSuffix().replace(/[^0-9]/g, '').slice(-4) || '0', 10) % 8000 + 100;
  return {
    phoneNumber: `+1555${String(n).padStart(7, '0')}`.slice(0, 12),
    reason: 'Customer Request',
    ...overrides,
  };
}

/**
 * Giden kampanya (staging/@mutation akışı için). Benzersiz ad → paralel güvenli.
 * `scheduledStart` bilinçle UZAK GELECEK: kampanya hemen arama başlatmasın.
 */
export function buildCampaign(overrides = {}) {
  const suffix = uniqueSuffix();
  return {
    name: `PW Campaign ${suffix}`,
    channel: 'Voice',
    scheduledStart: '2030-01-01',
    ...overrides,
  };
}
