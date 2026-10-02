# Everest CDI Mock — frontend loyihasining to'liq tavsifi

> Bu fayl loyihaga yangi kirgan dasturchi (yoki AI agent) uchun yagona kirish nuqtasi.
> Undan keyin kodni ochish mumkin, lekin undan oldin emas.
>
> Oxirgi yangilanish: 2026-09-23.

---

## 1. Loyiha nima

**Everest CDI Mock** — IELTS mock imtihonlarini boshqarish tizimi. Test markazi nomzodni ro'yxatga oladi, bron qiladi, imtihonni kompyuterda o'tkazadi, baholaydi va natijani yetkazadi.

Bu **frontend** — React SPA. Backend alohida (Spring), REST API orqali gaplashadi.

Ikki mutlaqo boshqacha yuzasi bor va ular bitta kod bazasida yashaydi:

| Yuza | Kim ishlatadi | Tili | Qayerda |
|---|---|---|---|
| **Admin panel** | ADMIN, BRANCH_ADMIN, SPEAKER | uz / ru / en | `/dashboard/*` |
| **Imtihon** | Nomzod (ROLE_USER) | Faqat inglizcha (ataylab) | `/`, `/exam/:id`, `/listening|reading|writing/:id` |

Imtihon yuzasi tarjima qilinmagan — haqiqiy IELTS CD imtihoni inglizcha, nomzod shu muhitga o'rganishi kerak.

---

## 2. Texnologiyalar

```
React 19  ·  Vite 6  ·  Redux Toolkit  ·  React Router v7
Ant Design 5  ·  Slate.js 0.114 (rich-text)  ·  Axios  ·  dayjs
react-toastify  ·  styled-components  ·  @ant-design/plots (grafiklar)
DnD: @dnd-kit/core + react-dnd + @hello-pangea/dnd (uchtasi ham ishlatiladi)
```

**TypeScript yo'q. Test yo'q.** Bu ongli holat emas, shunchaki shunday bo'lgan — yangi kod yozganda buni hisobga oling: xatoni tutadigan yagona to'siq `npm run build` va `npx eslint`.

Hajmi: 162 fayl, ~34 700 qator.

---

## 3. Ishga tushirish

```bash
npm install
npm run dev      # vite --mode development
npm run build    # vite build --mode production
npm run lint     # eslint .
npm run preview
```

**Muhit o'zgaruvchilari** — bitta:

| Fayl | Qiymat |
|---|---|
| `.env.development` | `VITE_API_URL=http://localhost:6464/` |
| `.env.production` | `VITE_API_URL=https://api.everestexams.uz/` |

`src/services/api.js` da `apiUrl` sifatida o'qiladi. URL oxiridagi `/` muhim — kodda endpointlar `api/v1/...` deb, bosh slashsiz yoziladi.

---

## 4. Papka xaritasi

```
src/
  App.jsx                 marshrutlar, ConfigProvider (tema + til)
  main.jsx                Redux Provider + BrowserRouter
  services/api.js         axios instansiyasi va interceptorlar
  store/                  5 ta slice: auth, app, exam, question, answer
  routes/                 ProtectedRouted.jsx
  data/role.js            Role konstantalari
  i18n/                   lang.js · translations.js · useT.js
  theme/index.js          antd tokenlari (light/dark)
  hooks/                  useApiRequest, usePolledRequest, useExamTime,
                          useExamDraft, useAudioPreloader, useExamSecurity
  utils/                  index.js (asosiy) + dateUtils, documentUtils,
                          roleUtils, examAudio, examNotes, extraTime,
                          sectionReopen, microphone
  components/
    editor/               Slate editor, viewer va barcha element turlari
    layouts/              BrandMark, CandidateTopBar, ExamHeader, ExamFooter
    modal/                barcha modal oynalar
  pages/
    auth/Login.jsx
    HomePage.jsx          nomzodning "Start Exam" sahifasi
    UserPage.jsx          imtihon moduli ro'yxati
    exam/                 ListeningExam, ReadingExam, WritingExam
    dashboard/            admin sahifalari + components/ + panels/
    details/              batafsil sahifalar (booking, branch, tarix)
    create/ update/ ielts/  IELTS materiallari CRUD
    booking/              UserBookingPage, BookingPlanCard
  styles/exam.css         imtihon yuzasining barcha CSS'i (~1150 qator)
  index.css               ilovaning qolgan CSS'i
```

---

## 5. Auth va rollar

### Rollar (`src/data/role.js`)

| Rol | Ko'lami |
|---|---|
| `ROLE_ADMIN` | Hammasi, barcha filiallar |
| `ROLE_BRANCH_ADMIN` | Faqat o'z filiali |
| `ROLE_SPEAKER` | Faqat speaking sessiyalari |
| `ROLE_USER` | Nomzod — imtihon topshiradi |

`checkRole(roles, role)` — `src/utils/roleUtils.js`, oddiy `includes`.

### Kirish

```
POST api/v1/auth/authenticate
{ username, password, deviceId?, deviceSecret? }
→ { access_token, refresh_token }
```

`deviceId`/`deviceSecret` — qurilmaga bog'lash. Ular `localStorage` da turadi va **Devices** sahifasida o'rnatiladi. Imtihon kompyuteri bir marta ro'yxatdan o'tkaziladi, keyin har kirishda yuboriladi.

Kirgandan keyin `App.jsx` `fetchProfile()` ni chaqiradi → `GET api/v1/user/profile` → `state.auth.user`.

### Marshrutni himoyalash

`ProtectedRoute` (`src/routes/ProtectedRouted.jsx`) ikki narsani tekshiradi: token bormi, va `requiredRoles` berilgan bo'lsa rollardan biri mos keladimi. Mos kelmasa `/not-found` ga yuboradi.

### ⚠️ Navbar faqat **birinchi** rolga qaraydi

`Navbar.jsx` menyuni `user?.roles[0]` bo'yicha filtrlaydi. Ya'ni ikkita roli bor xodim faqat birinchisiga tegishli menyuni ko'radi. Bu ma'lum cheklov — ko'p rolli xodim kerak bo'lsa, shu joyni o'zgartirish kerak.

---

## 6. API qatlami — eng muhim bo'lim

`src/services/api.js`.

### Javob konverti

Backend **har doim** shu shaklda javob beradi:

```json
{ "success": true, "code": 200, "message": "...", "data": { ... } }
```

**Response interceptor `response.data` ni qaytaradi.** Ya'ni komponentda `response.code`, `response.data`, `response.message` deb o'qiladi — `response.data.data` emas. Buni bilmasdan yozilgan kod jim turib ishlamaydi.

`useApiRequest` esa o'sha konvertni butunlay qaytaradi, shuning uchun u yerda `data?.data` bo'ladi. Ikkisini aralashtirmaslik kerak.

### Request interceptor

Har so'rovga ikkita header qo'shiladi:

```js
Authorization: Bearer <localStorage.accessToken>   // token bo'lsa
Accept-Language: uz | ru | en                      // har doim
```

`Accept-Language` **har so'rovda qaytadan** `getRequestLanguage()` dan o'qiladi (`src/i18n/lang.js`). Modul yuklanganda bir marta biriktirilsa, admin tilni almashtirgandan keyin ham eski qiymat ketaverardi.

### Xatolar

401 va 403 da interceptor **`window.location.reload()`** qiladi. Bu qo'pol, lekin amalda tokenni yangilash oqimi yo'q. Yangi kod yozganda buni hisobga oling: 403 ni "silliq" qayta ishlashga urinish foydasiz, sahifa baribir qayta yuklanadi.

Ikki xil xato shakli bor va ikkalasini ham hisobga olish kerak:

```jsonc
// 1) Oddiy xato
{ "success": false, "code": 400, "message": "xato matni" }

// 2) @Valid xatosi — maydon bo'yicha
{ "success": false, "code": 400, "message": "Validations errors",
  "error": { "modules": "modules is required" } }
```

Ustiga **HTTP 200 ichida `code !== 200`** ham kelishi mumkin. `utils/extraTime.js` dagi `parseApiError` uchalasini bitta shaklga keltiradi — yangi admin amali yozsangiz o'shani ishlating, yangisini yozmang.

### ⚠️ Maydon nomlari ikki xil

| Oila | Uslub | Misol |
|---|---|---|
| `api/v1/admin/**` | **snake_case** | `branch_id`, `test_time`, `previous_score` |
| `api/v1/exam/**` va qolgani | **camelCase** | `examUniqueId`, `moduleType`, `reopenedAt` |

Bu tasodifiy emas, backendda shunday. Aralashtirib yuborish — eng ko'p uchraydigan xato.

### Ma'lumot yuklash hooklari

| Hook | Nima uchun |
|---|---|
| `useApiRequest(url, deps)` | Oddiy GET. `url` falsy bo'lsa **so'rov yubormaydi**. `refetch` yo'q — yangilash uchun `deps` ga hisoblagich qo'shiladi. |
| `usePolledRequest(url, intervalMs)` | Yangilanib turadigan GET. Tab yashirin bo'lsa polling **to'xtaydi**, qaytganda darhol bir marta chaqiradi. Poll xatosi ekrandagi ma'lumotni **o'chirmaydi** — `stale` bayrog'i ko'tariladi. |

---

## 7. Marshrutlar (`src/App.jsx`)

`TestDates` va `Device` dan tashqari hammasi `React.lazy`.

### Nomzod

| Yo'l | Sahifa |
|---|---|
| `/login` | Login |
| `/` | Admin bo'lsa → `/dashboard`, aks holda `HomePage` |
| `/exam/:id` | `UserPage` — modullar ro'yxati |
| `/listening/:id` | `ListeningExam` |
| `/reading/:id` | `ReadingExam` |
| `/writing/:id` | `WritingExam` |

`:id` — hamma joyda **`examUniqueId`** (raqamli `examId` emas).

### Admin (`/dashboard` ostida)

| Yo'l | Sahifa | Kim ko'radi |
|---|---|---|
| `` | `DashboardPage` | hamma |
| `users`, `user/:id`, `user/:id/booking` | Nomzodlar, batafsil, bron | ADMIN, BRANCH_ADMIN |
| `attention` | Diqqat talab qiladigan ishlar | ADMIN, BRANCH_ADMIN |
| `contest`, `contest/:id/:type`, `.../edit` | Test sessiyalari | ADMIN, BRANCH_ADMIN |
| `speaking`, `speaking/:id/:type`, `.../edit` | Speaking sessiyalari | + SPEAKER |
| `extra-time` | Qo'shimcha vaqt berish | ADMIN, BRANCH_ADMIN |
| `section-reopen` | Bo'limni qayta ochish | ADMIN, BRANCH_ADMIN |
| `results` | Kunlik natijalar | ADMIN, BRANCH_ADMIN |
| `venues`, `venue/:id` | Filiallar va paketlar | ADMIN |
| `employees`, `employee/:id` | Xodimlar | ADMIN |
| `test-dates` | Bo'sh sanalar | ADMIN, BRANCH_ADMIN |
| `devices` | Imtihon qurilmalari | ADMIN, BRANCH_ADMIN |
| `settings` | Profil, parol, xizmat kalitlari | hamma |
| `ielts/{listening,reading,writing}` + `/:id`, `/create`, `/:id/update`, `/:id/questions` | IELTS materiallari | ADMIN |
| `history/:userId/writing/:id`, `history/:id/reading`, `history/:id/listening` | Javoblar tarixi | ADMIN, BRANCH_ADMIN |

**Suspense ikki qavatda:** `App.jsx` dagisi butun sahifani, `Dashboard.jsx` ichidagisi faqat `<Outlet/>` ni qoplaydi. Shuning uchun admin sahifadan sahifaga o'tganda menyu va header joyida qoladi, faqat kontent paneli `RouteFallback` skeletoniga almashadi.

---

## 8. Redux (`src/store/`)

| Slice | Nima saqlaydi |
|---|---|
| `auth` | `isLoggedIn`, `accessToken`, `user`, `loading`, `error`. `fetchProfile` thunk'i. |
| `app` | `size` (imtihon shrifti: 12/16/20), `lang`, `theme` |
| `exam` | Imtihon javob varag'i — `answers` massivi. Reading/Writing uchun `sessionStorage` ga oynaga yozib boradi. |
| `question` | Editor uchun: joriy savol turi, heading variantlari |
| `answer` | Admin tarafida javoblarni tahrirlash |

`examReducer` dagi muhim amallar: `initilalizeExam` (varaqni savollardan quradi), `updateForUserAnswers`, `updateForUserMultipleAnswers`, `restoreExamAnswers` (**kalit bo'yicha merge**, to'liq almashtirish emas — eski qoralama varaq shaklini buza olmasligi uchun), `clearExamAnswers`.

---

## 9. Ko'p tillilik

Tashqi kutubxonasiz, uchta til: **uz, ru, en. Default `en`.**

| Fayl | Vazifasi |
|---|---|
| `src/i18n/lang.js` | **Yagona manba.** React/Redux'siz ataylab — axios interceptor'i na komponent, na store. `LANGS`, `DEFAULT_LANG`, `readStoredLang()`, `writeStoredLang()`, `getRequestLanguage()`. |
| `src/i18n/translations.js` | Uchala til, nuqtali kalitlar (`candidates.title`) |
| `src/i18n/useT.js` | `const t = useT(); t("nav.dashboard")` |
| `src/components/LanguageSwitcher.jsx` | Dropdown, `Dashboard.jsx` header'ida |

**Yangi satrni tarjima qilish:**
1. Kalitni `translations.js` da **uchala tilga** qo'shing
2. Komponentda `const t = useT();` → `t("mening.kalitim")`

`t()` da interpolyatsiya yo'q. Raqam kerak bo'lsa `{n}` yoziladi va chaqiruv joyida almashtiriladi:
```js
const fill = (text, count) => String(text).replace("{n}", count);
```

Til `localStorage.lang` da, `changeLang` orqali. `changeLang` noto'g'ri qiymatni **umuman qabul qilmaydi** — u qiymat endi har so'rovda `Accept-Language` bo'lib tashqariga ketadi.

`App.jsx` antd `ConfigProvider` ga ham locale beradi (uz→uzUZ, ru→ruRU, en→enUS), shuning uchun DatePicker, Table, Pagination ham tarjima bo'ladi.

**Hozircha tarjima qilinmaganlar** (xohlasangiz o'sha naqsh bilan davom ettiring): `Settings.jsx`, `BranchPage`, `BranchDetails`, `SpeakingSlotsSection`, `EmployeeDetails`, `ContestDetails`, `Login`. Imtihon sahifalari **ataylab** tarjima qilinmaydi.

**Tekshirish:** hamma `t()` kaliti uchala tilda bormi — bu skriptni ishlating (hozir 606 ta chaqiruv, hammasi joyida):
```bash
node -e '/* src ni skanerlab t("...") larni translations bilan solishtiring */'
```

---

## 10. Tema

`src/theme/index.js` — antd tokenlarining yagona manbai.

```js
BRAND = { indigo: "#3F4196", indigoDark: "#7B80E0", crimson: "#E5233D" }
THEME_MODES = ["light", "dark"];  DEFAULT_THEME = "light";
getThemeConfig(mode) → { algorithm, token, components }
```

Rejim `state.app.theme` da, `localStorage.theme` ga yoziladi. `App.jsx` uni **`useLayoutEffect`** da `document.documentElement.dataset.theme` ga qo'yadi — bu `useEffect` emasligi muhim: brauzer view-transition uchun sahifani suratga olishidan **oldin** atribut joyida bo'lishi kerak.

`ThemeSwitcher.jsx` — bosilgan tugmadan tarqaladigan doiraviy ochilish (`document.startViewTransition` + `element.animate()`), `prefers-reduced-motion` hurmat qilinadi.

antd'dan tashqaridagi elementlar uchun CSS o'zgaruvchilari: `src/index.css` (ilova) va `src/styles/exam.css` (`--exam-*`, `[data-theme="dark"]` bilan). **Ularni `theme/index.js` bilan qo'lda sinxron ushlab turish kerak** — avtomatik bog'lanish yo'q.

---

## 11. Saqlash kalitlari

### localStorage — qurilmada qoladi

| Kalit | Nima |
|---|---|
| `accessToken`, `refreshToken` | JWT |
| `roles` | Rollar (zaxira nusxa) |
| `deviceId`, `deviceSecret` | Qurilmaga bog'lash |
| `lang` | Til |
| `theme` | `light` / `dark` |
| `exam_start` | Imtihon boshlangani belgisi |

### sessionStorage — imtihondan keyin yo'qoladi

| Kalit | Nima |
|---|---|
| `exam_answers_reading_{id}` | Reading javoblari. **Listening saqlanmaydi** — `getAnswersStorageKey` u uchun `null` qaytaradi |
| `exam_answers_{id}` | Zaxira kalit (yo'l reading ham, listening ham bo'lmasa) |
| `exam_annotations_{storageKey}` | Belgilash va izohlar (butun Slate hujjati) |
| `exam_audio_pos_{examId}` | Audio qaysi joyda qolgani |

Writing matni va taymer uchun sessionStorage **ishlatilmaydi**: ikkovi ham server qoralamasi va server soatiga ko'chgan (13.1, 13.2). Eski `writing_exam_*` va `exam_timer_*` kalitlari endi yo'q.

### Cache Storage

`exam-audio-{examId}` — listening audiolarining blob nusxasi. Mount'da boshqa imtihonlarning keshi o'chiriladi.

---

## 12. Nomzod oqimi

### 12.1 Bron qilish (admin qiladi)

Admin nomzod sahifasidan **"Book Test"** → `/dashboard/user/:id/booking`:

```
1. Paket        GET  api/v1/branch/all
                     → packages: { totalSessions, speakingSessions }
2. Test sessiya GET  api/v1/test-session/available?date=&time=&branch=
3. Speaking     GET  api/v1/test-session/speaking/available?date=&branch=&type=
                     → { id, date, time, branchName, speakerName, speakerId, type }
4. Yuborish     POST api/v1/booking/set
                → /dashboard/contest
```

Speaking turlari (`FACE_TO_FACE` / `ONLINE`) `api/v1/speaking/type/status` bilan yoqiladi-o'chiriladi (Settings sahifasida).

`speakerName` `null` bo'lishi mumkin (bazada ism yo'q) — ko'rsatishda zaxira matn bor.

### 12.2 Imtihon boshlanishi

```
1. HomePage → "Start Exam" → GET api/v1/exam/start
   → navigate(`/exam/{name}`) + to'liq ekran
2. UserPage → GET api/v1/exam/get/{examUniqueId}
   → { listening, reading, writing, leftDuration, reopenedModules }
```

`listening/reading/writing` — **"javob berilganmi"** degan bayroq, "ochiqmi" emas.

Modullar ketma-ket ochiladi: Listening → Reading → Writing. Listening'ga kirishdan oldin **mikrofon ruxsati** so'raladi (`utils/microphone.js`) — bu yozib olish uchun emas, naushnik ishlayotganini tekshirish uchun, chunki audio bir marta qo'yiladi.

`leftDuration` nolga yetsa — `sessionStorage.clear()` va tizimdan chiqarish.

### 12.3 Modul ichida

```
GET api/v1/exam/module/{examUniqueId}?moduleType=listening|reading|writing
```

| Modul | Tuzilishi |
|---|---|
| Reading | `Splitter` — chapda matn, o'ngda savollar. 3 ta passage: easy/medium/hard → 1-13 / 14-26 / 27-40 |
| Listening | 4 ta part → 1-10 / 11-20 / 21-30 / 31-40. Audio ketma-ket ijro etiladi |
| Writing | Task 1 va Task 2, so'z sanagich bilan |

Reading va Listening barcha partlarni **"filmstrip"** sifatida chizadi: har part `.exam-pane`, `(index − activeIndex) × 55%` ga siljitiladi.

### 12.4 Topshirish

```
POST api/v1/exam/answers/{examUniqueId}     # listening, reading
     { type, questionAnswers }              # store.getState().exam.answers dan
POST api/v1/exam/writing/{examUniqueId}     # writing
```

Muvaffaqiyatli bo'lsa: izohlar tozalanadi, listening bo'lsa audio pozitsiyasi ham, Redux varag'i tozalanadi, `/exam/{id}` ga qaytadi.

---

## 13. Imtihon tizimining ichki mexanikasi

Bu bo'lim eng nozigi. Har bir qism nima uchun shundayligi bilan.

### 13.1 Taymer serverniki (`hooks/useExamTime.js`)

Frontendda **birorta hardcode davomiylik yo'q**. Hammasi shundan:

```
GET api/v1/exam/time-state/{examUniqueId}?moduleType=...&knownVersion=N
→ { leftDurationMs, durationMs, serverTime, timeVersion, timeChanged,
    started, finished, examLeftDuration, message }
```

- **Birinchi so'rovda `knownVersion` yuborilmaydi** — o'sha javob baza. Aks holda ochilishda soxta "vaqt o'zgardi" oynasi chiqardi.
- **Soat farqi:** `offset = serverTime − Date.now()`. Barcha taqqoslash server vaqtida, shuning uchun nomzod kompyuterining noto'g'ri soati ta'sir qilmaydi.
- **Lokal tick (500 ms) faqat raqamni animatsiya qiladi.** Tarmoq uzilsa taymer to'xtamaydi; polling xatosi jimgina log qilinadi, modal chiqarmaydi.
- **Polling 20 soniya**, tab yashirin bo'lsa ham sekinlashmaydi — qo'shimcha vaqt berilsa nomzod darhol ko'rishi kerak.
- **Taymer 0 ga yetganda darhol topshirilmaydi:** avval `refresh()`, yangi vaqt kelgan bo'lsa davom etadi. Shart `expired` **booleani** bo'yicha, `remainingMs` bo'yicha emas — aks holda effekt har 500 ms qayta ishlab, uchayotgan tekshiruvni bekor qilardi.

**Listening davomiyligi** (2026-09-18 dan) audiolardan hisoblanadi: `Σ audio + (n−1)×10s + 30s`, amalda ~22–28 daqiqa. Shuning uchun u **har imtihonda har xil** — hech qayerda keshlanmasligi va yozib qo'yilmasligi kerak.

Birinchi `time-state` chaqiruvi sekin bo'lishi mumkin (server audio uzunligini o'qiydi) → pillada **"preparing…"** ko'rsatiladi, `0` emas. `"waiting to start…"` boshqa narsa: modul hali boshlanmagan.

Taymer pillasi ostidagi ingichka chiziq — `(durationMs − remainingMs) / durationMs`. `durationMs` bo'lmasa **umuman chizilmaydi**.

### 13.2 Qoralama (`hooks/useExamDraft.js`)

```
PUT|GET api/v1/exam/draft/{examUniqueId}?moduleType=...
```

- 15 soniyalik interval (faqat o'zgargan bo'lsa), 3 soniyalik debounce
- `beforeunload` / `pagehide` da **`fetch(..., {keepalive: true})`** — axios so'rovi sahifa ketayotganda bekor qilinadi. Bu yerda `Accept-Language` **qo'lda** qo'shilgan, chunki u axios interceptor'idan o'tmaydi
- `getContent` **ref orqali** o'qiladi; seriyalangan nusxa o'zgarmasa so'rov ketmaydi
- Tanasi obyekt (`{ answers: [...] }`), yalang'och massiv emas — kelajakda kengaytirish uchun joy

**Qoralama va savollar mustaqil keladi** → `pendingDraft` state (ref emas! ref bo'lsa re-render bo'lmay, effekt ishlamay qolardi) javob varag'i tayyor bo'lguncha kutadi.

`WritingExam` da `answersRef`/`taskRef` **render paytida** tayinlanadi, effektda emas: autosave effekti yuqorida turadi va effektda sinxronlangan ref bir render orqada qolib, bitta harf "o'zgarish yo'q" deb hisoblanib saqlanmay qolardi.

### 13.3 Listening audiosi (`hooks/useAudioPreloader.js`)

Audio **oldindan to'liq yuklab olinadi**, ijro faqat lokal blob'dan. Tarmoq uzilishi partni yo'qotmasligi uchun.

1. **Ketma-ket yuklash**, bittalab. Parallel emas: kutilayotgan yagona fayl — Part 1, unga butun kanal berilishi kerak. Ustiga zalda 20 ta kompyuter birdan yuklasa umumiy kanal bo'g'iladi.
2. **Darvoza Part 1 tayyor bo'lishi bilan ochiladi** (`START_AFTER_PARTS = 1`). Qolgani Part 1 yangrayotgan ~8 daqiqada fonda tushadi.
3. `play()` **click ichida** chaqiriladi → brauzerning autoplay bloki ishlamaydi.
4. **Cache Storage** (`exam-audio-{examId}`) — qo'shimcha vaqt oqimi sahifani reload qiladi, keshsiz bu o'nlab MB ni qaytadan yuklash bo'lardi.

**Keshning eskirishi** — uch bosqichli: `ETag`/`Last-Modified` bo'lsa shartli so'rov → yo'q bo'lsa `x-cached-at` bo'yicha 6 soatlik yosh chegarasi → shartli so'rov yiqilsa validatorsiz qayta urinish. *Backendga tavsiya: har yuklashda unikal URL bersin, yoki `ETag` + `Access-Control-Expose-Headers: ETag` qo'ysin.*

**Nozik joylar (buzmang):**
- **Advance timer effektdan tashqarida** (`advanceTimerRef`): fonda fayl tushganda `audioUrls` o'zgaradi → playback effekti qayta ishga tushadi → uning cleanup'i partlar orasidagi kutishni bekor qilib, imtihonni o'sha yerda qotirib qo'yardi
- **`!audioEl.ended` sharti** — partlar orasidagi bo'shliqda effekt qayta ishlasa, tugagan yozuvni boshidan qo'yardi
- **Seek faqat `handleStartExam` da** — effekt bir tick keyin ishlaydi, blob metadata undan oldin yuklanib `loadedmetadata` o'tkazib yuborilishi mumkin
- **`audioEl.src !== url`** — src'ni qayta tayinlash elementni restart qiladi va click'dagi play'ni bekor qiladi
- Part yuklanmagan bo'lsa **o'tkazib yuborilmaydi** — kutiladi. Faqat `failedIndexes` dagi part o'tkaziladi
- **Stall timeout 15 s**, har chunk'da qayta tiklanadi; 5 urinish, backoff, `waitForOnline`

**Pleyer tanaffusi ≠ server hisobi:** `GAP_BETWEEN_AUDIOS_MS = 3000`, server esa 10 soniya bilan hisoblaydi. Ya'ni audio tugaganda taymerda ~50 soniya qoladi. **Bu xato emas** — taymer serverdan, pleyer audiodan yuradi, ataylab bog'lanmagan. Hammasi tugagach "All recordings have been played" paneli chiqadi.

**Pozitsiyani saqlash** (`utils/examAudio.js`): `sessionStorage: exam_audio_pos_{examId}`, ~2 soniyada bir yoziladi. Qo'shimcha vaqt oqimi sahifani reload qiladi, va Listening'ga vaqt berishning sababi odatda audio buzilgani — hamma nomzodni Part 1 ga qaytarish eng noto'g'ri default bo'lardi.

### 13.4 Belgilash va izohlar (highlight + note)

Haqiqiy IELTS CD dagidek: nomzod matnni rangli belgilaydi va so'zga izoh yozadi.

**Asosiy g'oya:** hammasi Slate **mark** — `highlight` (rang), `note` (matn), `noteId` (unikal id). Butun Slate hujjatni saqlash hammasini saqlaydi, alohida store kerak emas.

`noteId` shart: mark faqat matn bo'yicha guruhlansa, bir xil matnli yonma-yon ikki izoh qo'shilib ketardi (Slate bir xil props'li qo'shni text node'larni birlashtiradi).

Saqlash: `sessionStorage`, `exam_annotations_` prefiksi. `annotationKey(examId, module, partType, slot)` — **yagona manba**, imtihon sahifasi ham, izohlar paneli ham shundan foydalanadi. Part `type` bo'yicha (id emas), chunki footer ham shunga qarab almashadi.

Faqat `storageKey` prop berilgan viewer belgilanadi — admin editorlari bermaydi, shuning uchun tugmalar u yerda ko'rinmaydi.

`ExamHeader` da **Notes** tugmasi (sonli badge) → o'ngdan Drawer, part bo'yicha guruhlangan. Bosilsa o'sha partga o'tadi va izohga scroll qiladi.

### 13.5 Imtihon xavfsizligi

`useExamSecurity` — hozir faqat `beforeunload` faol. Klaviatura va o'ng tugma bloklash kodi **kommentga olingan**.

---

## 14. Admin modullari

| Sahifa | Nima qiladi |
|---|---|
| **Nomzodlar** (`User.jsx`) | Sahifalangan ro'yxat, qidiruv, `registrationSource` (ADMIN_PANEL / o'zi), `everester` bayrog'i, yangi nomzod modali → to'g'ridan-to'g'ri bronga |
| **Nomzod batafsil** (`UserDetailts.jsx`, ~1340 qator) | Profilni tahrirlash, **vaqtinchalik ruxsat** berish/olish, **to'lov holati** (PENDING/CREATED/PAID/CANCELLED/EXPIRED), bron tarixi, speaking bali, javobni yangilash / PDF / yuborish |
| **Test sessiyalari** (`ContestPage.jsx`) | Server tomonidan filtrlanadi (filial/sana/shift/holat). Tepada bosiladigan status plitalari. Qatordan: qo'shimcha vaqt, bo'limni qayta ochish |
| **Speaking** (`SpeakingPage.jsx`) | Xuddi shunday + ball kiritish |
| **Sessiya batafsil** (`ContestDetails.jsx`) | To'liq ko'rinish, bo'limni reset/retry, speaking bali, qo'shimcha vaqt, bo'limni qayta ochish |
| **Natijalar** (`ResultPage.jsx`) | Kunlik reyting, `rankNumber` bilan o'rin ko'chishi, har skill ustuni, PDF/Excel eksport, Recheck-Writing (faqat ADMIN) |
| **Filiallar** (`BranchPage` → `BranchDetails`) | Filiallar va paketlar CRUD, speakerlar, chegirmalar, haftalik jadval (ertalab/tushdan keyin/kechqurun), bayramlar, **`SpeakingSlotsSection`** (kunlik speaking xonalari, speaker biriktirish, optimistik yangilash + rollback) |
| **Xodimlar** (`EmployeePage` → `EmployeeDetails`) | BRANCH_ADMIN / SPEAKER yaratish, rol checkboxlari, faollikni o'chirishda **o'quvchilarni boshqa speakerga o'tkazish** modali, ish jadvali |
| **Qurilmalar** (`Device.jsx`) | Imtihon kompyuterini ro'yxatdan o'tkazish → `deviceId`/`deviceSecret` |
| **Test sanalari** (`TestDates.jsx`) | Faqat o'qish uchun bo'sh joylar ko'rinishi |
| **Sozlamalar** (`Settings.jsx`) | Profil, parol, ADMIN uchun xizmat kalitlari (Face-to-Face / Online speaking) |

---

## 15. IELTS materiallari va Slate editor (faqat ADMIN)

### Oqim

| Modul | Yo'l |
|---|---|
| Reading | Passage yaratish → `ReadingAnswers` (chapda matn, o'ngda `QuestionComponent`) → `QuestionModal` bilan savol qo'shish → `POST api/v1/reading/answers` |
| Listening | `ListeningModal` (sarlavha + part + audio) → `NewListening` (audio va savollar) → `POST api/v1/listening/answers` |
| Writing | `NewWriting` (task 1/2 + rasm) / `WritingDetails` (tahrirlash) |

### Slate maxsus elementlari

```
input                              bo'sh joyni to'ldirish
multiple-choice                    bitta javob
multiple-choice-multiple-answer    bir nechta javob
ordered-list / unordered-list      sarlavhalar, drag & drop
table / table-row / table-cell     o'lchami o'zgaradigan kataklar
image · span · paragraph · checkbox · option · list-item
```

### ⚠️ Savol raqamlari saqlanmaydi

Ular **kontentdan hisoblanadi**: `getQuestionNumbers`, `getLastQuestionId`, `renumberSlateQuestionsSmart` savol qo'shilganda/o'chirilganda qayta raqamlaydi. Ya'ni raqamni qo'lda yozib qo'yish mumkin emas — kontentni o'zgartirish raqamlarni ham o'zgartiradi.

`getStartByQuestionType(type, module)` — READING: easy 0, medium 13, hard 26 · LISTENING: part_1 0, part_2 10, part_3 20, part_4 30.

### Boshqa muhim utillar (`src/utils/index.js`)

- `countCorrectAnswers` / `checkKey` / `checkKeys` — registr sezmaydi, `"; "` bilan ajratilgan muqobil javoblarni qabul qiladi
- `isWithinOneHour`, `getColor`, `countListHeader`

---

## 16. Dashboard

Rolga qarab ikki xil: `SpeakerDashboard` yoki `StaffDashboard` (shartli hook yo'q — `DashboardPage` birini tanlaydi). Speaker uchun `scores/trend/capacity/all` **umuman so'ralmaydi**, ular 403 qaytaradi.

Bo'limlar: **Diqqat talab qiladi · Natijalar · Dinamika · Sig'im · Filiallar (faqat ADMIN) · Arxiv**.

| Fayl | Vazifasi |
|---|---|
| `dashboardData.js` | **Sof funksiyalar** — butun arifmetika shu yerda, komponentlarda emas |
| `chartTheme.js` | `useChartTheme()` |
| `panels/` | Har bo'lim alohida komponent |
| `components/StatTile.jsx` | Bosiladigan KPI plitasi — raqam filtrlangan sahifaga eshik |
| `components/ChartCard.jsx` | Grafik + ostida `<details>` jadval ko'rinishi |
| `components/StatusCounts.jsx` | WAITING/PROCESS/COMPLETED/FAILED plitalari |
| `demoData.js` | `?demo=1` — butun sahifa o'ylab topilgan raqamlar bilan to'ladi va **hech qanday so'rov yubormaydi** |

`today` va `attention` 60 soniyada yangilanadi, qolgani yo'q.

**Grafik palitrasi ko'z bilan emas, hisoblab tanlangan.** Har grafikning vazifasi kattalik/trend, "kimligi" emas → kategorik palitra kerak emas. Joriy davr brend rangida, o'tgan davr kulrangda. Tungi rejimda ikkala kontrast darvozasidan birdan o'tkazib bo'lmaydi — shuning uchun **har grafik ostidagi jadval ko'rinishi bezak emas, shart**.

**Ma'lumot halolligi qarorlari:**
- `moduleAverages` baholanmagan modulni **tashlab yuboradi** — 0 ustun "hamma nol oldi" deb o'qilardi
- `bandHistogram` **tartibni saqlaydi** — band o'qi shkala, reyting emas
- `deltaPercent` o'tgan davr 0 bo'lsa **`null`** qaytaradi, "+100%" to'qib chiqarmaydi

**`StatusCounts` nima uchun 4 ta so'rov yuboradi:** status bo'yicha sanoq beradigan endpoint yo'q edi, `?size=1` bilan `totalSizes` o'qiladi. Backend `booking/status-counts` va `speaking/status-counts` ni yozgan — bu hali **ulanmagan**, qilinadigan ish.

---

## 17. Maxsus admin amallari

Ikkalasi bir xil naqshda. Yangisini yozsangiz shu naqshdan chiqmang.

### 17.1 Qo'shimcha vaqt (`utils/extraTime.js`, `/dashboard/extra-time`)

Imtihon paytida audio buzilsa yoki svet o'chsa, xonadagi hammaga (yoki bitta o'quvchiga) N daqiqa qo'shiladi.

**Ikki daraja:** `module` (bitta modul taymeri, admin va branch admin) va `exam` (butun imtihon chegarasi, **faqat ROLE_ADMIN**, modul yuborilmaydi).

Beshta yo'l, javob shakli bir xil:
```
POST api/v1/admin/exam-time/extra-time              guruhga (modul)
POST api/v1/admin/exam-time/extra-time/student      bitta o'quvchiga (odatdagi yo'l)
POST api/v1/admin/exam-time/extra-time/{examId}     imtihon id si ma'lum bo'lsa
POST api/v1/admin/exam-time/exam-extra-time         guruhga (umumiy)
POST api/v1/admin/exam-time/exam-extra-time/student bitta o'quvchiga (umumiy)
GET  .../extra-time/history?branchId=&date=&type=&page=&size=
```

### 17.2 Bo'limni qayta ochish (`utils/sectionReopen.js`, `/dashboard/section-reopen`)

Nomzod butun testni topshirdi, lekin listening audiosi buzilgan edi — faqat o'sha bo'limni qayta topshirishi kerak.

```
POST   api/v1/admin/exam-section/reopen             guruhga
POST   api/v1/admin/exam-section/reopen/student     bitta o'quvchiga
POST   api/v1/admin/exam-section/reopen/{examId}    imtihon id si bo'yicha
DELETE api/v1/admin/exam-section/reopen/{id}/cancel
GET    api/v1/admin/exam-section/reopen/history?branchId=&date=&page=&size=
```

**Eng muhim nuqta: ochish javoblarni o'chiradi va ular qaytarilmaydi.** Shuning uchun har tasdiqlash oynasida ogohlantirish bor, tugmalar `danger`, va ochishdan oldingi ball `previous_score` da saqlanib ko'rsatiladi. `cancel` **ortga qaytarish emas** — faqat "qayta topshirish talab qilinmaydi".

O'quvchi tarafi: `GET api/v1/exam/reopened` (bo'sh massiv normal holat, blok chizilmaydi) va `exam/get` dagi `reopenedModules`. Uchinchi holat shu bilan ajratiladi:

| Holat | Bayroq | `reopenedModules` | Ko'rsatish |
|---|---|---|---|
| Topshirilmagan | `false` | yo'q | oddiy "Start" |
| Topshirilgan | `true` | yo'q | "Done" |
| **Qayta ochilgan** | `false` | **ha** | **sariq ramka + "Retake"** |

### 17.3 Audioni qayta yuklash (`utils/audioRetry.js`)

Listening audiolari imtihondan oldin to'liq yuklab olinadi. Yuklab olishning **o'zi** uzilsa,
ilgari nomzodning qo'lidan hech narsa kelmasdi.

**Alohida sahifa yo'q va menyuda ham yo'q** — ruxsat **bitta bronga** beriladi, bron
sahifasidan: `/dashboard/contest/:id/:type` → `🎧` tugmasi → `AudioRetryModal`.

**Nega bitta bronga:** qayta yuklash o'nlab megabayt. Qotib qolgani bitta kompyuter bo'lsa,
butun xonaga ruxsat berish — birinchi urinishni buzgan tirbandlikni qaytadan yaratish.
Qaror muammoning o'lchamida bo'lishi kerak.

```
GET    api/v1/admin/exam-audio/retry-approval/student?user_id=&date=&test_time=
GET    api/v1/admin/exam-audio/retry-approval/{examId}
POST   api/v1/admin/exam-audio/retry-approval/student | /{examId}
DELETE api/v1/admin/exam-audio/retry-approval/{approvalId}
GET    api/v1/exam/audio-retry/{examUniqueId}        nomzod: menga ruxsat bormi
POST   api/v1/exam/audio-failure/{examUniqueId}      nomzod: menda muammo bor
```

Modal ochilganda **avval holatni o'qiydi**: kompyuter qaysi partlarni yiqilgan deb xabar
qilgan va ruxsat allaqachon bormi. Admin quruqdan emas, ma'lum muammoga qarab ruxsat beradi.

Nomzod tarafi: `ExamHeader` Settings menyusida har part uchun **Ready / % / Failed /
No recording**. Muammo bo'lsa va ruxsat yo'q — "nazoratchiga ayting"; ruxsat kelgach
**"Download again"** tugmasi. Blok **faqat Listening** da ko'rinadi — `audioStatus` propini
faqat `ListeningExam` uzatadi, boshqa hech kim emas.

Nomzodning mashinasi muammoni **o'zi xabar qiladi** (`audio-failure`, fire-and-forget), shuning
uchun admin bron sahifasini ochganda nima bo'lganini ko'radi. Bu so'rov yiqilsa imtihon
baribir davom etadi.

Ruxsat holati **faqat biror audio yiqilgan bo'lsa** so'raladi (15 s), aks holda umuman
chaqirilmaydi.

Shartnoma: `AUDIO_RETRY_API.md`.

### 17.4 Uchalasiga umumiy qoidalar

**Qisman muvaffaqiyat.** Guruh amalida `code: 200` "hammasiga bajarildi" degani **emas**. UI `granted_count`/`opened_count` **va** `skipped_count` ni **har doim** ko'rsatadi (0 bo'lsa ham), va sanoq nol bo'lsa yashil emas, sariq.

**Xato yo'naltirish tartibi — 404 ambiguity'dan oldin.** Ikkala xabarda ham qavs ichida shift nomi bor, shuning uchun 404 avval ushlanmasa "sessiyani tanlang" deb noto'g'ri ko'rsatiladi.

**Branch adminga imkoni yo'q boshqaruvlar umuman ko'rsatilmaydi** — backend 403 beradi, lekin bosib bo'lmaydigan tugma yomon UX.

**Xato chiqqanda modal yopilmaydi** va kiritilgan qiymatlar saqlanadi.

**Ikki marta bosish bitta so'rov yuboradi** — tugma `disabled` va ustiga `if (submitting) return` qo'riqchisi.

`sectionReopen.js` shift konstantalarini, ikkala xato tahlilchisini va batch guruhlashni `extraTime.js` dan **import qilib re-export qiladi** — ikkinchi nusxa yasalmagan.

---

## 18. Endpointlarning to'liq ro'yxati

<details>
<summary>Auth, profil, fayl</summary>

```
POST api/v1/auth/authenticate
GET  api/v1/user/profile
POST api/v1/user/update
POST api/v1/user/update/password
POST api/v1/file/audio · api/v1/file/photo
DEL  api/v1/file/delete/{id}
GET  api/v/v1/device/all · api/v/v1/device/set-device     ← "v/v1" — kodda shunday
```
</details>

<details>
<summary>Nomzodlar va xodimlar</summary>

```
GET  api/v1/admin/user/all · /by · /history
POST api/v1/admin/user/save · /check-username · /update · /change-config · /sconfig
PUT  api/v1/admin/user/roles/update/{id}
GET  api/v1/admin/user/export/pdf
POST api/v1/admin/user/{id}/temporary-access
GET  api/v1/super-admin/all
POST api/v1/super-admin/new-employee
```
</details>

<details>
<summary>Filiallar</summary>

```
GET  api/v1/branch/all · /details · /speakers/{id} · /{id}/discounts
POST api/v1/branch/create · /update · /{id}/discount
POST api/v1/branch/package/create · /package/update
POST api/v1/admin/branch/schedule · /holiday
```
</details>

<details>
<summary>Bron va sessiyalar</summary>

```
GET  api/v1/test-session/available · /check-available · /speaking/available
POST api/v1/booking/set · /update
GET  api/v1/booking/all · /by-user · /session/{id}/{type}
POST api/v1/booking/group/{id}/payment-status
POST api/v1/booking/speaking-score
GET  api/v1/speaking/all · /schedule · /get-all/work-time · /type/status
DEL  api/v1/speaking/delete/word-time
```
</details>

<details>
<summary>Imtihon (nomzod tarafi — camelCase)</summary>

```
GET  api/v1/exam/start
GET  api/v1/exam/get/{examUniqueId}
GET  api/v1/exam/module/{examUniqueId}?moduleType=
GET  api/v1/exam/time-state/{examUniqueId}?moduleType=&knownVersion=
GET|PUT api/v1/exam/draft/{examUniqueId}?moduleType=
GET  api/v1/exam/reopened
POST api/v1/exam/answers/{examUniqueId}
POST api/v1/exam/writing/{examUniqueId}
```
</details>

<details>
<summary>Tarix va baholash</summary>

```
GET  api/v1/history/check · /download · /mock-exam
POST api/v1/history/set-score · /recheck-writing · /refresh-answer
POST api/v1/history/send-answer · /reset-section · /retry-listening
```
</details>

<details>
<summary>Materiallar</summary>

```
GET  api/v1/question-type/all
GET  api/v1/reading/all · /passage/{id}
POST api/v1/reading/create/passage · /answers · /update
DEL  api/v1/reading/delete/{id}
GET  api/v1/listening/all · /get/{id}
POST api/v1/listening/save · /answers
DEL  api/v1/listening/delete/{id}
GET  api/v1/writing/all · /get/{id} · /photo
POST api/v1/writing/save
PUT  api/v1/writing/update/{id}
DEL  api/v1/writing/delete/{id}
```
</details>

<details>
<summary>Dashboard</summary>

```
GET api/v1/dashboard/all · /today · /attention · /scores · /trend
GET api/v1/dashboard/capacity · /bookings/branch
```
</details>

<details>
<summary>Admin amallari (snake_case)</summary>

```
POST api/v1/admin/exam-time/extra-time[/student|/{examId}]
POST api/v1/admin/exam-time/exam-extra-time[/student]
GET  api/v1/admin/exam-time/extra-time/history
POST api/v1/admin/exam-section/reopen[/student|/{examId}]
DEL  api/v1/admin/exam-section/reopen/{id}/cancel
GET  api/v1/admin/exam-section/reopen/history
```
</details>

---

## 19. Konvensiyalar

**Kodni atrofdagi kod kabi yozing.** Bu loyihada:

- Komponentlar — funksional, hooklar bilan. Class faqat `ErrorBoundary` da
- Stil: antd `token` + inline `style` (nomzod yuzasida), CSS klasslari (`exam-*`) murakkab joylarda
- **Izohlar "nima" emas, "nima uchun" ni tushuntiradi.** Kod bazasida izohlar shu uslubda: nozik qarorning sababi yoziladi, aks holda keyingi odam uni "soddalashtirib" buzadi
- Toast: `react-toastify`, `toast.success/error/info`
- Sana: `dayjs`, API uchun `YYYY-MM-DD`
- Yangi admin amali: konstantalar va API chaqiruvlari **util faylga**, komponentlarga emas
- Yangi hisob-kitob: **sof funksiya**, alohida faylda (`dashboardData.js` kabi)

---

## 20. Ma'lum muammolar va texnik qarz

Bular **hozir mavjud**, tuzatilmagan. Yon tomondan tegib ketsangiz ehtiyot bo'ling.

| Joy | Muammo |
|---|---|
| `pages/dashboard/UserDetailts.jsx:425` | `useState` **`List.renderItem` ichida** — hooks qoidasi buzilgan, tarix uzunligi o'zgarsa sinadi |
| `components/modal/ListeningModal.jsx:103` | `<Option>` import qilinmagan → brauzerning global `Option` iga tushadi, modal ochilganda qulaydi |
| `utils/index.js:367-385` | `getNumberByPassageType` buzuq: `part_3` va `part_4` o'rniga takroran `case "part_1"` yozilgan (erishib bo'lmaydi) → ikkovi `undefined` qaytaradi. Ustiga `part_2` "10-20" deydi ("11-20" bo'lishi kerak), va `default` da `return` yo'q |
| `pages/dashboard/Device.jsx:12,60` | `api/v/v1/device/...` — yo'lda `v/v1` xatosi |
| `Navbar.jsx` | Menyu faqat `roles[0]` bo'yicha filtrlanadi |
| `services/api.js` | 401/403 da `window.location.reload()` — token yangilash oqimi yo'q |
| `hooks/useExamSecurity.js` | Klaviatura/kontekst menyu bloklash kommentga olingan |
| O'lik kod | `MockExam.jsx`, `Manager.jsx`, `UserHistoryList.jsx`, `UserDetailsCard.jsx`, `HistoryItemCard.jsx`, `InputViewElement.jsx`, `usePreloadAudioMetadata.js` — hech qayerdan import qilinmaydi |
| `pages/details/ContestDetails.jsx` | Uchta "Retry" tugmasi `{/* */}` ga olingan → `retryListening` ishlatilmay qolgan |
| `store/examReducer.js` | `getAnswersStorageKey` da `path.includes("listening")` birinchi tekshiruvi `null` qaytaradi, shuning uchun pastdagi `/listening/` sharti **hech qachon bajarilmaydi** — o'lik shox |
| Bundle | `DashboardPage` chunk'i 1.27 MB (`@ant-design/plots`), asosiy bundle ~1.39 MB |

**Ulanmagan backend imkoniyatlari** (tayyor, lekin frontend foydalanmaydi):
- `GET api/v1/booking/status-counts` va `/speaking/status-counts` — hozir har status uchun alohida so'rov ketadi (4×)
- `GET api/v1/dashboard/attention/{type}` — sahifalanadigan to'liq ro'yxat. Hozir har turkumda faqat 5 ta element ko'rinadi

---

## 21. Sifat darvozalari

Har o'zgarishdan keyin:

```bash
npm run build          # o'tishi SHART
npx eslint .           # boshlang'ich: 71 xato / 13 ogohlantirish
```

**Lint sonini oshirmang.** Mavjud 71 xato — asosan ishlatilmagan o'zgaruvchilar, ular fon shovqini; lekin yangi kod ularga qo'shmasligi kerak. Faqat o'zgartirgan fayllaringizni tekshirish uchun:

```bash
npx eslint src/path/to/File.jsx
```

Test yo'q. Shuning uchun mantiqni **sof funksiyalarga** ajratib, uni node bilan alohida tekshirib ko'rish — shu loyihada ishlaydigan yagona usul.

---

## 22. Tez-tez uchraydigan vazifalar

**Yangi admin sahifasi qo'shish:**
1. `src/pages/dashboard/YangiSahifa.jsx`
2. `App.jsx` — `React.lazy` + `<Route path="yangi" .../>`
3. `Navbar.jsx` — menyu elementi, `roles` bilan
4. `translations.js` — `nav.yangi` + sahifa kalitlari, **uchala tilga**

**Yangi API chaqiruvi:**
- O'qish uchun: `useApiRequest(url, [deps])`, yoki yangilanib turishi kerak bo'lsa `usePolledRequest(url, 60000)`
- Yozish uchun: `apiClient.post(...)`, javobni `response.code !== 200` bilan tekshiring
- Admin amali bo'lsa: util faylga qo'ying, `parseApiError` ni ishlating, snake_case yuboring

**Imtihon taymeriga tegish:** tegmang. `useExamTime` dan o'qing. Hech qanday davomiylikni frontendda hisoblamang.

**Yangi raw `fetch`:** `Accept-Language` ni **qo'lda** qo'shing — axios interceptor'i uni ko'rmaydi.

---

## 23. Loyihaning asosiy prinsiplari

Bu kod bazasida qayta-qayta uchraydigan va saqlanishi kerak bo'lgan qarorlar:

1. **Server haqiqat manbai.** Taymer, modul uzunligi, imtihon holati — hammasi serverdan. Frontend hisoblamaydi, ko'rsatadi.
2. **Raqam o'zini tushuntirish uchun izohga muhtoj bo'lsa, u tayyor emas.** Dashboard shu mezon bilan 9 bo'limdan 6 taga qisqartirilgan.
3. **Bo'shliq "ma'lumot yo'q" deb o'qiladi, "nol" deb emas.** Baholanmagan modul grafikdan tashlanadi, to'qib chiqarilmaydi.
4. **Qisman muvaffaqiyat — normal holat.** 200 "hammasi bo'ldi" degani emas; sanoqlar har doim ko'rsatiladi.
5. **Bosib bo'lmaydigan tugma ko'rsatishdan ko'ra, umuman ko'rsatmaslik yaxshi.**
6. **Nomzodning ishi hech qachon yo'qolmaydi.** Qoralama, `keepalive` saqlash, audio pozitsiyasi, izohlar — hammasi shu uchun.
7. **Ma'lumot yo'qolishi mumkin bo'lgan har amal aniq ogohlantiradi** va `danger` uslubida bo'ladi.

---

## 24. Qo'shimcha hujjatlar

Repoda hozir faqat ikkitasi bor:

| Fayl | Nima haqida |
|---|---|
| `PROJECT.md` | Shu fayl |
| `README.md` | Loyihaning umumiy tanishtiruvi (screenshotlar bilan) |
| `AUDIO_RETRY_API.md` | Audioni qayta yuklash — backend uchun brif (backend hali yozilmagan) |

Backend tomonidan alohida hujjatlar yozilgan, lekin ular **repoga qo'shilmagan** — kerak bo'lsa backend jamoasidan so'rang:

- `SECTION_REOPEN_API.md` — bo'limni qayta ochish API'si
- `STATUS_COUNTS_API.md` — status sanoqlari endpointi (hali ulanmagan)
- `DASHBOARD_API.md` — dashboard endpointlari, shu jumladan `attention/{type}`
