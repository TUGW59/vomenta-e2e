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
