// @ts-check
import { TEST_ENTITY_PREFIX } from '../data/factories.js';

/**
 * Mutasyon cleanup kayıt defteri. Playwright'tan bağımsız tutulur; böylece kritik
 * sıra ve orphan-sıfır garantileri hızlı self-check ile sınanır.
 */
export function createTestEntityRegistry({ prefix = TEST_ENTITY_PREFIX } = {}) {
  const actions = [];
  const created = [];

  const cleanup = (action, label = 'isimsiz cleanup') => {
    if (typeof action !== 'function') {
      throw new TypeError(`testEntity.cleanup("${label}") bir fonksiyon almalı`);
    }
    actions.push({ action, label });
  };

  /**
   * Kalıcı bir test varlığının tüm yaşam döngüsünü tek çağrıda yönetir:
   * başlangıç baseline=0 → rollback kaydı → action → create baseline=1 →
   * teardown rollback → bitiş baseline=0.
   */
  const create = async ({
    label,
    key,
    prefixNaReason,
    baseline,
    cleanup: rollback,
    action,
  }) => {
    if (
      !label ||
      typeof baseline !== 'function' ||
      typeof rollback !== 'function' ||
      typeof action !== 'function'
    ) {
      throw new TypeError(
        'testEntity.create({ label, key|prefixNaReason, baseline, cleanup, action }) eksiksiz olmalı'
      );
    }

    if (key) {
      if (typeof key !== 'string' || !key.startsWith(prefix)) {
        throw new TypeError(
          `testEntity.create key değeri zorunlu otomasyon önekiyle başlamalı: ${prefix}`
        );
      }
    } else if (
      typeof prefixNaReason !== 'string' ||
      !prefixNaReason.startsWith('N/A: ') ||
      prefixNaReason.length < 8
    ) {
      throw new TypeError(
        'İsimsiz kalıcı varlık açık `prefixNaReason: "N/A: <gerekçe>"` beyanı taşımalı'
      );
    }

    const readBaseline = async (stage) => {
      const value = await baseline();
      if (!Number.isInteger(value) || value < 0) {
        throw new TypeError(
          `${label} ${stage} baseline sayacı negatif olmayan tamsayı döndürmeli`
        );
      }
      return value;
    };

    const before = await readBaseline('başlangıç');
    if (before !== 0) {
      throw new Error(
        `${label} mutasyonu etkinleştirilmedi: başlangıç baseline=${before}, beklenen=0. ` +
          'Önce orphan test verisini araştırın ve güvenle temizleyin.'
      );
    }

    let entity;
    cleanup(async () => {
      const failures = [];
      try {
        await rollback({ key, entity });
      } catch (error) {
        failures.push(
          `rollback: ${error instanceof Error ? error.message : String(error)}`
        );
      }

      try {
        const after = await readBaseline('bitiş');
        if (after !== before) {
          failures.push(`orphan baseline: başlangıç=${before}, bitiş=${after}`);
        }
      } catch (error) {
        failures.push(
          `bitiş baseline okunamadı: ${error instanceof Error ? error.message : String(error)}`
        );
      }

      if (failures.length > 0) {
        throw new Error(failures.join('; '));
      }
    }, label);

    entity = await action({ key });

    const afterCreate = await readBaseline('create-sonrası');
    if (afterCreate !== 1) {
      throw new Error(
        `${label} create doğrulaması başarısız: baseline=${afterCreate}, beklenen=1`
      );
    }

    created.push({
      label,
      key: key || null,
      prefixNaReason: prefixNaReason || null,
    });
    return entity;
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

  return {
    cleanup,
    create,
    teardown,
    get created() {
      return [...created];
    },
  };
}
