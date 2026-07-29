// @ts-check

/**
 * Mutasyon cleanup kayıt defteri. Playwright'tan bağımsız tutulur; böylece kritik
 * sıra garantisi (önce rollback kaydı, sonra action) hızlı self-check ile sınanır.
 */
export function createTestEntityRegistry() {
  const actions = [];

  const cleanup = (action, label = 'isimsiz cleanup') => {
    if (typeof action !== 'function') {
      throw new TypeError(`testEntity.cleanup("${label}") bir fonksiyon almalı`);
    }
    actions.push({ action, label });
  };

  const create = async ({ label, cleanup: rollback, action }) => {
    if (!label || typeof rollback !== 'function' || typeof action !== 'function') {
      throw new TypeError('testEntity.create({ label, cleanup, action }) eksiksiz olmalı');
    }
    cleanup(rollback, label);
    return action();
  };

  const teardown = async () => {
    const errors = [];
    for (const { action, label } of actions.reverse()) {
      try {
        await action();
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        errors.push({ label, detail });
      }
    }
    return errors;
  };

  return { cleanup, create, teardown };
}
