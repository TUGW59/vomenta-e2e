# Sesli Arama (Voice) — Keşif Arşivi

Bu klasör, **Sesli Arama (Voice)** (`/voice`) bölümünün test edilmeden önceki **keşif kanıtlarını** kalıcı tutar. Uygulama güncellenip testler kırmızıya döndüğünde "olması gereken" haline buradan bakılır.

## İçerik

- **[`NOTLAR.md`](NOTLAR.md)** — İnsan-okur keşif raporu: yapı, 4 dil doğrulaması, 3 katman (L1/L2/L3) matrisi, bulgular ve test çapaları.
- Sesli bölümü çok sayıda alt yüzey içerir (kuyruklar, IVR, DID/numaralar, kayıtlar, SIP, sesli mesaj, yetenekler); ilgili `tests/voice-*.authed.spec.js` paketlerinin tümü bu bölümü kapsar.

## İlgili testler

- `tests/voice/voice.authed.spec.js`
- `tests/voice/voice-subnav.authed.spec.js`
- `tests/voice/voice-queues.authed.spec.js`
- `tests/voice/voice-ivr.authed.spec.js`
- `tests/voice/voice-dids.authed.spec.js`
- `tests/voice/voice-recordings.authed.spec.js`

Keşif kapanış matrisi şablonu: [`../DISCOVERY_COMPLETION_TEMPLATE.md`](../DISCOVERY_COMPLETION_TEMPLATE.md). Tüm dokümanların haritası: [`../README.md`](../README.md).
