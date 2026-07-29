# Gönderici Kimlikleri keşif paketi

Playwright ile `/campaigns/sender-ids` sayfasının yapı, dört dil, responsive,
form, filtre, boş/hata ve sentetik `PENDING` durum keşfidir.

- Bulgular ve kapanış matrisi: [NOTLAR.md](./NOTLAR.md)
- Ham gözlem: [sender-ids-exploration.json](./veri/sender-ids-exploration.json)
- Keşif komutları: `scripts/`
- Ekran kanıtları: `screenshots/`
- Aktif trace'ler: `test-results/investigations/sender-ids-*.zip`

Trace Viewer:

```bash
npx playwright show-trace test-results/investigations/sender-ids-discovery.zip
```

Keşif scriptleri submit/upload/delete isteğini gerçek sunucuya göndermez.
