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
