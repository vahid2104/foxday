# 🦊 Foxday

Gündəlik rutin, kuryer qazancı və sağlamlıq üçün şəxsi Android tətbiqi — Foxy ilə.

- Spesifikasiya: [`docs/SPEC.md`](docs/SPEC.md)
- Dizayn: [Figma — Foxday App Design](https://www.figma.com/design/sU7tqQTSQo1QuOAgedgBVD)

## Telefonda işə salmaq (Expo Go)

1. Telefona Play Store-dan **Expo Go** yüklə.
2. Kompüterdə (PowerShell):
   ```powershell
   cd foxday
   npm install
   npx expo start
   ```
3. Ekranda çıxan **QR kodu** Expo Go ilə skan et. Telefon və kompüter eyni Wi-Fi şəbəkəsində olmalıdır.
4. Kodu dəyişib yadda saxlayanda app telefonda avtomatik yenilənir.

Eyni Wi-Fi-da qoşulmursa: `npx expo start --tunnel`.

## APK hazırlamaq

```powershell
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```
Build bitəndə Expo linkdən `.apk` faylını telefona yükləyib quraşdır.

## Faydalı əmrlər

| Əmr | Nə edir |
|---|---|
| `npx expo start` | İnkişaf serverini açır |
| `npx tsc --noEmit` | TypeScript səhvlərini yoxlayır |
| `npx expo lint` | Kod üslubunu yoxlayır |

## Struktur

```
src/
  app/            ekranlar (expo-router: hər fayl bir ekrandır)
    (tabs)/       Bu gün · Pul · Hədəflər · Sağlamlıq
    add.tsx       sürətli əlavə menyusu
  components/     Foxy, ikonlar, alt menyu, UI hissələri
  theme/          Figma-dakı rəng, ölçü və şrift tokenləri
  i18n/           az / en / ru tərcümələr
  store/          ayarlar (telefonda saxlanılır)
docs/SPEC.md      layihənin bütün qərarları
```
