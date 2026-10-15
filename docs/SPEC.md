# Foxday — Spesifikasiya (v0.1)

**App adı:** Foxday · **Maskot:** Foxy (tülkü)

> Bu fayl layihənin "yaddaşıdır". Bütün qərarlar burada yazılır. Hər yeni söhbətdə Claude əvvəl bu faylı oxuyur.
> Son yenilənmə: 15 oktyabr 2026

---

## 1. Ümumi baxış

Şəxsi istifadə üçün Android tətbiqi (APK). Bir yerdə bunları izləyir:
- telefon / ekran vaxtı (sosial şəbəkələr, YouTube),
- kuryer qazancı və xərclər,
- vərdişlər və uzunmüddətli məqsədlər,
- sağlamlıq: yuxu, su, addım, kalori.

Motivasiya üçün **tülkü maskot**, animasiyalar, XP və nişanlar.

**İstifadəçi:** Vahid. Varşavada Uber Eats / Glovo kuryeri, elektrikli velosiped.
**Cihaz:** Redmi Note 9S, Android 12 (MIUI).
**Developer mühiti:** Windows, GitHub: `vahid2104`. React təcrübəsi var, mobil ilk dəfədir.

---

## 2. Texnologiya

| Sahə | Seçim | Qeyd |
|---|---|---|
| Framework | **React Native + Expo** (TypeScript) | React bilgisi birbaşa işə yarayır |
| Naviqasiya | `expo-router` | Fayl əsaslı, Next.js kimi |
| Verilənlər bazası | `expo-sqlite` (sadə SQL + `PRAGMA user_version` migrasiyaları) | Hər şey telefonda, offline. Drizzle lazım olmadı — daha sadədir |
| State | **Zustand** | Sadə, React-a tanış |
| Dil (i18n) | `i18next` + `react-i18next` | az (default), en, ru |
| Animasiya | `react-native-reanimated` + **Lottie** | Maskot və təbrik animasiyaları |
| Qrafiklər | `react-native-gifted-charts` | Hesabatlar |
| Bildirişlər | `expo-notifications` | Su, yuxu, limit xəbərdarlıqları |
| Ekran vaxtı | **Xüsusi Kotlin modulu** (Android `UsageStatsManager`) | Expo Modules API ilə; v2 |
| Addımlar | Telefon sensoru / Health Connect | v2 |
| Məzənnə | **NBP API** (Polşa Milli Bankı, pulsuz) | USD gündəlik; AZN həftəlik yenilənir |
| Build | **EAS Build** → APK | Lokal Android Studio lazım deyil |
| Bulud | Google Drive ehtiyat nüsxəsi | v3 |

---

## 3. Versiyalar (mərhələlər)

### v1 — Əsas (MVP)
- Ana ekran ("Bu gün")
- Qazanc və xərclər (+ valyuta çevirmə)
- Vərdişlər (gündəlik) və məqsədlər (uzunmüddətli)
- Su izləmə
- Yuxu (əl ilə daxil etmə)
- Tülkü maskot: əsas əhval vəziyyətləri + sadə təbrik animasiyaları
- Ayarlar: dil, tema, valyuta, bildirişlər
- Sadə həftəlik / aylıq hesabatlar (qazanc + vərdişlər)

### v2 — İzləmə
- Ekran vaxtı: hər app üzrə vaxt, telefonu açma sayı
- App limitləri və xəbərdarlıqlar
- Addım sayğacı və enerji sərfi
- Avtomatik yuxu təxmini (telefon istifadəsinə görə, təsdiqlə)
- Genişləndirilmiş hesabatlar və qrafiklər
- Həftəlik xülasə (bazar günü)

### v3 — Oyunlaşdırma və əlavələr
- XP, səviyyələr, nişanlar
- Maskot böyüyür, yeni görünüşlər açılır
- Kalori qəbulu (sevimli yeməklər siyahısı ilə)
- Əhval qeydi (emoji)
- Ana ekran widget-i
- Google Drive ehtiyat nüsxəsi və bərpa
- JSON / CSV ixrac

---

## 4. Modullar (ətraflı)

### 4.1 Ana ekran — "Bu gün"
- Maskot (günün vəziyyətinə görə əhvalı dəyişir)
- **Günün balı** 0–100 (v1-də sadə düstur, bax §7)
- Bugünkü qazanc (PLN) və iş saatı
- Bugünkü vərdişlər: bir toxunuşla "etdim"
- Su: `+1 stəkan` düyməsi, irəliləyiş halqası
- Dünən gecəki yuxu
- Sürətli əlavə düyməsi (+): gəlir, xərc, su, task

### 4.2 Qazanc və xərclər
**Gəlir (iş sessiyası):**
- Tarix
- Platforma: Uber Eats / Glovo / Wolt / Digər
- Məbləğ, tip (ayrıca), iş saatı (başla–bitir və ya ümumi müddət)
- Sifariş sayı, km (istəyə görə), qeyd

**Xərc:**
- Məbləğ, valyuta, kateqoriya, qeyd
- Kateqoriyalar: Velosiped (şarj, təmir, təkər, hissələr) · Yemək · Telefon/internet · Ev/kirayə · Nəqliyyat · Pul köçürməsi (ailəyə və s.) · Digər
- Kateqoriyaları redaktə etmək mümkündür

**Valyuta:**
- Əsas valyuta: **PLN**. Hesabatlar PLN ilə.
- Əlavə: AZN, USD. Daxil edəndə valyuta seçilir və o günün məzənnəsi yadda saxlanılır. Köhnə qeydlər sonradan dəyişmir.
- İnternet yoxdursa sonuncu məlum məzənnə istifadə olunur.

**Hesablanan göstəricilər:**
- Saatlıq qazanc, sifariş başına qazanc
- Xalis qazanc (gəlir − xərc)
- Platformalar üzrə bölgü
- Ən gəlirli günlər və saatlar (istilik xəritəsi; v2)
- Həftəlik / aylıq qazanc hədəfi və irəliləyiş

### 4.3 Vərdişlər və məqsədlər
**Vərdiş (təkrarlanan):**
- Ad, ikon, rəng
- Tezlik: hər gün / həftənin seçilmiş günləri / həftədə N dəfə
- İstəyə görə xatırlatma saatı
- Gün ərzində: ✅ etdim / ❌ etmədim / ⏭ keç (istirahət günü)
- Streak: ardıcıl günlər + ən uzun streak
- Təqvim görünüşü (ay üzrə rəngli xanalar)

**Məqsəd (uzunmüddətli):**
- Ad, son tarix
- Növ: **addımlı** (alt-tasklar) və ya **rəqəmli** (məs. 0 / 1000 PLN)
- Faizlə irəliləyiş, qalan gün sayı
- Vaxtında bitməyəndə maskot reaksiyası

**Hesabat:** həftəlik / aylıq tamamlanma faizi, ən yaxşı və ən zəif vərdişlər.

### 4.4 Sağlamlıq
- **Su:** gündəlik hədəf (default 2 L, stəkan = 250 ml), xatırlatmalar (məs. hər 2 saatdan bir, 09:00–21:00)
- **Yuxu:** yatma və oyanma vaxtı, müddət avtomatik hesablanır, keyfiyyət 1–5 ulduz, yuxu hədəfi
- **Addım / enerji (v2):** e-velosipeddə kalori sərfi adi velosipeddən aşağı hesablanır
- **Kalori (v3)**

### 4.5 Ekran vaxtı (v2)
- `Usage Access` icazəsi (bir dəfə, ayarlardan)
- Gündəlik ümumi vaxt və app-lər üzrə siyahı
- İzlənən app-lər: Instagram, TikTok, YouTube, Facebook və s. (istifadəçi seçir)
- Hər app üçün gündəlik limit
- Bildiriş: limitin 80%-ində xəbərdarlıq, 100%-ində "limit bitdi"
- Telefonu açma sayı
- Həftəlik müqayisə

### 4.6 Maskot — tülkü 🦊
| Vəziyyət | Nə vaxt |
|---|---|
| 😄 Sevincli / rəqs edir | Task tamamlandı, gün uğurlu |
| 🙂 Normal | Default |
| 😴 Yuxulu | Az yuxu, gecə gec saat |
| 😟 Kədərli / yorğun | Vərdişlər buraxıldı, streak qırıldı |
| 🎉 Təbrik | Məqsəd bitdi, rekord streak, qazanc hədəfi |
| 📱 Narazı | Ekran limiti aşıldı (v2) |

- Task tamamlananda: konfetti + maskot reaksiyası + qısa vibrasiya
- Task vaxtında bitməyəndə: maskot kədərlənir, motivasiya verən mesaj (cəza yox, yumşaq)
- Animasiyalar Lottie ilə. Hazır pulsuz fayllar və ya Figma-da özümüz çəkəcəyik.

### 4.7 Ayarlar
- Dil: Azərbaycan / English / Русский
- Tema: Sistem (default) / İşıqlı / Qaranlıq
- Əsas valyuta (PLN) və əlavə valyutalar
- Su, yuxu və qazanc hədəfləri
- Bildirişlər (hər birini ayrıca açıb-bağlamaq)
- Məlumat: ixrac / ehtiyat nüsxə (v3)

---

## 5. Verilənlər modeli (ilkin)

```
work_sessions   id, date, platform, amount, tip, currency, rate_to_pln,
                start_time, end_time, duration_min, orders, km, note
expenses        id, date, amount, currency, rate_to_pln, category_id, note
categories      id, name, icon, color, type
habits          id, name, icon, color, frequency, days, target_per_week,
                reminder_time, created_at, archived
habit_logs      id, habit_id, date, status (done|missed|skipped)
goals           id, name, type (steps|numeric), target, current, unit,
                deadline, created_at, completed_at
goal_steps      id, goal_id, title, done, order
water_logs      id, date, time, ml
sleep_logs      id, date, bed_time, wake_time, duration_min, quality
exchange_rates  date, currency, rate_to_pln
settings        key, value
-- v2
app_usage       date, package, minutes, opens
app_limits      package, daily_limit_min
```

---

## 6. Ekranlar (v1)

**Alt naviqasiya, 5 tab:**
1. **Bu gün** (ana ekran)
2. **Pul** — gəlir/xərc siyahısı, aylıq xülasə
3. **(+)** — sürətli əlavə menyusu (ortada)
4. **Hədəflər** — vərdişlər + məqsədlər
5. **Sağlamlıq** — su, yuxu

**Digər ekranlar:**
- İş sessiyası əlavə et / redaktə et
- Xərc əlavə et / redaktə et
- Vərdiş yarat / redaktə et, vərdiş detalı (təqvim + streak)
- Məqsəd yarat / redaktə et, məqsəd detalı
- Yuxu qeydi
- Hesabatlar (həftəlik / aylıq): qazanc, vərdişlər
- Ayarlar
- İlk açılış (onboarding): dil, ad, hədəflər, maskotla tanışlıq — 3–4 ekran
- Təbrik / modal pəncərələr

---

## 7. Günün balı (v1 düsturu)

```
bal = 40 × (tamamlanan vərdişlər / bugünkü vərdişlər)
    + 25 × min(su / su hədəfi, 1)
    + 25 × min(yuxu / yuxu hədəfi, 1)
    + 10 × (bu gün nəsə qeyd edilibsə 1, yoxsa 0)
```
Vərdiş yoxdursa vərdiş hissəsi tam (40) sayılır; "keçildi" günləri hesablamaya daxil deyil.
v2-də ekran vaxtı və addımlar da əlavə olunacaq.

---

## 8. Dizayn sistemi (ilkin)

- **Figma frame ölçüsü:** 393 × 873 (Redmi Note 9S ekranına uyğun)
- **Əsas rəng:** yumşaq narıncı (təxmini `#FF8A3D`), qaranlıq temada bir az tutqun
- **Köməkçi rənglər:** sakit neytrallar (isti boz / krem); uğur üçün yaşıl, xəbərdarlıq üçün qırmızı-mərcan
- **Şrift:** Nunito — yumru, mehriban üslub (Azərbaycan hərfləri və kiril dəstəklənir)
- **Üslub:** yumşaq künclər (16–24 px), kart əsaslı, böyük toxunma zonaları (velosipeddən sonra tələsik istifadə üçün)
- **Tema:** İşıqlı + Qaranlıq, sistemə görə avtomatik

---

## 8.1 Figma dizaynı (v1)

**Fayl:** [Foxday — App Design](https://www.figma.com/design/sU7tqQTSQo1QuOAgedgBVD)

**Səhifələr:**
- **Cover** — üz qabığı
- **Components** — ikonlar (19 ədəd), Foxy (Happy / Normal / Sad / Sleepy), Button, Habit Row (Todo / Done / Missed), Tab Bar (4 aktiv vəziyyət)
- **Screens** (3 sıra):
  - *Əsas ekranlar:* 01 Bu gün · 02 Pul · 03 Hədəflər · 04 Sağlamlıq · 05 Bu gün (qaranlıq) · 06 Sürətli əlavə · 07 Təbrik · 08 Buraxılan vərdiş
  - *Formalar və detallar:* 09 Gəlir əlavə et · 10 Xərc əlavə et (AZN → PLN çevirmə) · 11 Vərdiş yarat · 12 Yuxu qeydi · 13 Vərdiş detalı (təqvim) · 14 Məqsəd detalı · 15 Hesabat (ay) · 16 Ayarlar
  - *Onboarding:* 17 Xoş gəldin · 18 Dil və ad · 19 Hədəflər · 20 İcazələr (MIUI)

**Dizayn tokenləri (Figma Variables):**
- `Primitives` — orange, neutral (isti), green, red, blue, purple
- `Color` — Light / Dark modları: `bg/*`, `text/*`, `border/default`, `accent/*`, `track/default`
- `Dimensions` — spacing 4/8/12/16/20/24/32, radius 8/12/16/24/full
- Mətn stilləri (Nunito): Display 32, Heading 1–3, Body, Body Strong, Caption, Label
- Kölgələr: `Shadow/Card`, `Shadow/Floating`

Kodda bu tokenlər eyni adlarla `theme.ts` faylına köçürüləcək.

---

## 9. Redmi / MIUI qeydləri

MIUI arxa fonda işləyən tətbiqləri aqressiv şəkildə bağlayır. Bildirişlər və ekran vaxtı limitləri düzgün işləsin deyə:
- Ayarlar → Tətbiqlər → [app] → **Autostart: aktiv**
- Batareya qənaəti → **"Məhdudiyyət yoxdur"**
- App bunları ilk açılışda izah edən bir ekran göstərəcək.

---

## 9.1 İrəliləyiş

- [x] Layihə skeleti, tema, dillər, alt menyu
- [x] Pul modulu (gəlir, xərc, məzənnə, Pul ekranı, Bu gün qazanc kartı)
- [x] Vərdişlər (hər gün / seçilmiş günlər, seriya, təqvim, keçmək, arxiv) və məqsədlər (rəqəmli + addımlı)
- [x] Su və yuxu, Sağlamlıq tabı, günün balı tam real
- [x] Bildirişlər: su (09–21, 2 saatdan bir), vərdiş saatı, axşam 21:30
- [x] Foxy animasiyaları: konfetti ilə təbrik, buraxılan vərdiş modalı (Reanimated ilə, Lottie lazım olmadı)
- [x] Ayarlar, onboarding (4 ekran), əməliyyat redaktəsi, həftəlik/aylıq hesabat
- [x] "Həftədə N dəfə" tezliyi (seriya həftələrlə sayılır, günlər "buraxılmış" sayılmır)
- [x] Ayarlarda "Test bildirişi" düyməsi
- [x] Aylıq abunəliklər: ödəniş günü, 3 gün qabaq və həmin gün xatırlatma, "Ödədim" → avtomatik xərc
- [x] XP, səviyyələr (Foxy-yə şərf/tac), 12 nişan
- [x] Kalori (tez əlavə), əhval (1–5), CSV ixracı (pul, vərdişlər, sağlamlıq)
- [x] Ekran vaxtı (yerli Kotlin modulu `modules/foxday-tracker`): app-lər üzrə vaxt, açılma sayı, həftə qrafiki, app limitləri (80% / 100% bildiriş)
- [x] Addım sayğacı (TYPE_STEP_COUNTER), km və təxmini kalori (addım + velosiped iş vaxtı)
- [x] Arxa fon tapşırığı (~15 dəq): addımları yazır, limitləri yoxlayır
- [ ] APK build (EAS) — ekran vaxtı və addımlar yalnız APK-da işləyir (Expo Go-da "APK-da işləyəcək")

## 9.2 Növbəti planlar (backlog) — hissə-hissə ediləcək

> 2026-10-16-da qeyd olundu. APK yalnız app tam istədiyim səviyyəyə çatanda qurulacaq.

### A. Uzunmüddətli tasklar və steplər
- Uzunmüddətli task (layihə) əlavə etmək: ad, təsvir, deadline (istəyə görə)
- Taskın içində steplər: əlavə et, sırala, tamamla
- Hər stepə işlədikcə vaxt əlavə etmək: taymer (başlat / dayandır) və ya əllə "45 dəq"
- Task üzrə ümumi sərf olunan vaxt, irəliləyiş (%) və steplər üzrə vaxt bölgüsü
- Qeyd: mövcud "addımlı məqsədlər" (goal_steps) bunun əsası ola bilər, ya da ayrıca `tasks` modulu

### B. Gündəlik vaxt qrafiki (timeline)
- Günün saatları üzrə diaqram və ya cədvəl: hansı saatlarda nə ilə məşğul olmuşam
- Mənbələr: kuryer iş sessiyaları (başlama–bitmə), yuxu, task steplərinə yazılan vaxtlar, planlaşdırılmış tasklar
- Rənglər kateqoriyaya görə (iş, task, yuxu, boş vaxt)
- Gün / həftə görünüşü, "bu həftə ən çox nəyə vaxt getdi" xülasəsi

### C. Ağıllı planlaşdırma (boş vaxta görə məsləhət)
- Task yazanda: təxmini lazım olan vaxt + deadline
- App boş vaxtlarımı tapır (iş, yuxu və digər planlı tasklardan kənar) və deadline-a qədər ən uyğun vaxtı (1–3 variant) təklif edir
- Mən təsdiq edəndə task həmin gün və saata yazılır və həmin vaxt bildiriş gəlir
- Uzun tasklar bir neçə hissəyə bölünüb müxtəlif günlərə düşə bilər
- Açıq suallar: iş saatlarım sabit deyil — boş vaxt keçmiş iş sessiyalarına görə təxmin edilsin, yoxsa "işləmədiyim saatlar"ı özüm qeyd edim? Gün ərzində hansı saatlar planlaşdırmaya açıqdır (məs. 08:00–23:00)?

### D. Təxirə salma
- Planlı taskı başqa günə / saata keçirmək (bir toxunuşla "sabah", "bu axşam" və ya özüm seçim)
- Təxirə salanda app yenidən boş vaxt təklif edə bilər; deadline-a yaxınlaşırsa xəbərdarlıq
- Bildirişin üstündən birbaşa "Təxirə sal" düyməsi
- Neçə dəfə təxirə salındığı qeyd olunsun (Foxy yumşaq xatırlatma edə bilər)

## 9.3 APK build qeydləri (sonraya)

Hər şey hazır olanda Windows-da, foxday qovluğunda:

```
git pull
npm install
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```

- "Create an EAS project?" → **Yes**; "Generate a new Android Keystore?" → **Yes**
- 10–20 dəq sonra link/QR çıxır → telefonda aç, APK-nı quraşdır (naməlum mənbələrə icazə)
- Build `app.json`-a layihə ID-si yazır → `git add app.json`, `git commit -m "EAS layihəsi"`, `git push`
- Kotlin modulu (ekran vaxtı, addımlar) ilk dəfə EAS-da kompilyasiya olunacaq — xəta olsa log Claude-a göndərilsin

Quraşdırandan sonra:
- Expo Go-dakı məlumatlar APK-ya keçmir (təmiz başlayır)
- Onboarding-də icazələr: Bildirişlər, Ekran vaxtı (Foxday → "İstifadəyə icazə ver"), Addım sayğacı
- Redmi: Foxday üçün Autostart aktiv, batareya "Məhdudiyyət yoxdur"
- Ayarlar → Test bildirişi ilə yoxla

## 10. Açıq suallar

- [x] App-in adı → **Foxday**
- [x] Maskotun adı → **Foxy**
- [ ] Gündəlik su hədəfi, yuxu hədəfi, aylıq qazanc hədəfi (default dəyərlər)
- [ ] Hansı app-lər ekran vaxtında izlənəcək (v2)

---

## 11. Qərarlar jurnalı

| Tarix | Qərar |
|---|---|
| 2026-10-15 | React Native + Expo, TypeScript |
| 2026-10-15 | Dillər: az (default), en, ru |
| 2026-10-15 | Valyuta: PLN əsas; AZN, USD əlavə; NBP məzənnəsi |
| 2026-10-15 | Məlumatlar telefonda; Google Drive ehtiyat nüsxəsi v3-də |
| 2026-10-15 | Ekran vaxtı limitləri və xəbərdarlıqlar — bəli (v2) |
| 2026-10-15 | Tema: sistem + manual; narıncı əsas rəng |
| 2026-10-15 | Maskot: tülkü |
| 2026-10-15 | Obsidian lazım deyil; `docs/` qovluğunda markdown (Obsidian vault kimi açıla bilər) |
| 2026-10-15 | 3 mərhələ: v1 əsas → v2 izləmə → v3 oyunlaşdırma |
| 2026-10-15 | Ad: Foxday, maskot: Foxy |
| 2026-10-15 | Şrift: Nunito; Figma-da v1 dizayn sistemi və 20 ekran hazırlandı |
| 2026-10-15 | Expo SDK 57 layihəsi quruldu, GitHub: vahid2104/foxday |
| 2026-10-15 | Baza: Drizzle əvəzinə sadə SQL; pul qəpiklə (tam ədəd) saxlanılır; hər əməliyyat öz məzənnəsi ilə |
| 2026-10-15 | Pul modulu hazır: gəlir/xərc formaları, NBP məzənnəsi (USD — A, AZN — B cədvəli, keşlə), Pul ekranı |
| 2026-10-15 | React Compiler: bazadan oxuyan hook `'use no memo'` ilə işləyir (əks halda ekran yenilənmir) |
| 2026-10-16 | v1 tamamlandı: vərdişlər, məqsədlər, su, yuxu, bildirişlər, animasiyalar, ayarlar, onboarding, hesabat |
| 2026-10-16 | Animasiyalar Lottie əvəzinə Reanimated ilə (fayl lazım deyil, Expo Go-da işləyir) |
| 2026-10-16 | Tam versiya APK-dan əvvəl: abunəliklər, XP/nişanlar, kalori/əhval/CSV, ekran vaxtı, addımlar |
| 2026-10-16 | Ekran vaxtı və addımlar üçün öz Kotlin modulumuz (Expo Modules API); Health Connect lazım olmadı |
| 2026-10-16 | APK build-i təxirə salındı — app tam istənilən səviyyəyə çatanda qurulacaq |
| 2026-10-16 | Backlog: uzunmüddətli tasklar + steplər + vaxt yazma, gündəlik timeline, ağıllı planlaşdırma, təxirə salma |
| 2026-10-16 | Addımlar: sensor telefon yandırılandan bəri sayır → hər oxunuşda fərq yazılır, reboot nəzərə alınır |
