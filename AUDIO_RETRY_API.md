# Audio qayta yuklash — backend uchun brif

> Frontend **yozib bo'lindi** va shu shartnomaga qarab ishlaydi. Backend tayyor bo'lguncha
> tugma bosiladi, modal ochiladi va hech narsa sinmaydi.
>
> Sana: 2026-09-25.

---

## Muammo

Listening audiolari imtihon boshlanishidan oldin nomzodning kompyuteriga to'liq yuklab
olinadi (blob + Cache Storage), keyin faqat lokal fayldan ijro etiladi. Bu ataylab: imtihon
o'rtasida tarmoq uzilsa part yo'qolmaydi.

Lekin **yuklab olishning o'zi** uzilishi mumkin. Hozir bunday holatda nomzodning qo'lidan
hech narsa kelmaydi: preloader 5 marta urinib, taslim bo'ladi va o'sha part o'tkazib
yuboriladi.

Kerak bo'lgani: nomzod nima yuklanganini **ko'rsin**, muammo bo'lsa **admin ruxsatidan keyin**
qayta yuklay olsin.

## Ruxsat — bitta bronga

**Ruxsat bitta nomzodga (bitta bookingga) beriladi**, sessiyaga yoki filialga emas.

**Nega:** qayta yuklash o'nlab megabayt. Qotib qolgani bitta kompyuter bo'lsa, butun xonaga
ruxsat berish — birinchi urinishni buzgan tirbandlikni qaytadan yaratish. Qaror muammoning
o'lchamida bo'lishi kerak.

Admin ruxsatni **bron sahifasida** beradi: `/dashboard/contest/{id}/{type}` → `🎧 Audioni
qayta yuklash` tugmasi.

---

## Umumiy qoidalar

```
Auth: har so'rovda Authorization: Bearer <token>
Til:  har so'rovda Accept-Language: uz | ru | en
Konvert: { "success": true, "code": 200, "message": "...", "data": { ... } }
```

**Maydon nomlari — loyihadagi mavjud qoida:**

| Oila | Uslub |
|---|---|
| `/api/v1/admin/**` | **snake_case** |
| `/api/v1/exam/**` | **camelCase** |

---

## 1-QISM · Admin endpointlari

**Base:** `/api/v1/admin/exam-audio/retry-approval` · **snake_case**
**Ruxsat:** `ROLE_ADMIN` — istalgan filial; `ROLE_BRANCH_ADMIN` — faqat o'z filiali.

Har bir amalning **ikkita yo'li** bor — bu loyihadagi mavjud naqsh (`extra-time`,
`exam-section/reopen` xuddi shunday):

| Yo'l | Qachon |
|---|---|
| `.../student?user_id=&date=&test_time=` | **Odatdagi yo'l.** Bron sahifasi o'quvchi, sana va shiftni biladi, lekin imtihon id sini bilmaydi |
| `.../{examId}` | Ekranda faqat imtihon id si bo'lganda |

Frontend `user_id` bor bo'lsa birinchisini, aks holda ikkinchisini tanlaydi.

### 1.1 `GET /student?user_id=&date=&test_time=` yoki `GET /{examId}`

Modal ochilganda **birinchi navbatda** shu chaqiriladi. Admin ruxsatni quruqdan emas,
kompyuter nimani xabar qilganini ko'rib beradi.

```json
{
  "approval_id": 12,
  "status": "ACTIVE",
  "approved_by_id": 10,
  "approved_by_name": "Branch Admin",
  "created_at": "2026-09-25T04:20:00.000+00:00",
  "reported_parts": [3, 4],
  "reported_at": "2026-09-25T04:12:30.000+00:00"
}
```

- `approval_id` / `status` — amaldagi ruxsat **yo'q** bo'lsa `null`. UI "Ruxsat berilmagan" deydi
- `status`: `ACTIVE` | `REVOKED` | `EXPIRED`. Faqat `ACTIVE` "ruxsat bor" deb hisoblanadi
- `reported_parts` — **1 dan boshlanadigan** part raqamlari (nomzod va nazoratchi shunday ataydi).
  Xabar kelmagan bo'lsa bo'sh massiv — bu **xato emas**, admin kompyuter taslim bo'lishidan
  oldin ham ruxsat bera oladi
- Hech narsa bo'lmasa ham **200** qaytsin, `404` emas

### 1.2 `POST /student` yoki `POST /{examId}` — ruxsat berish

```jsonc
// .../student
{ "user_id": 101, "date": "2026-09-25", "test_time": "morning",
  "reason": "Internet uzilib qoldi" }

// .../{examId}
{ "reason": "Internet uzilib qoldi" }
```

- `reason` — ixtiyoriy, maks 500 belgi
- `test_time` — bron sahifasi uni **har doim yuboradi**, shuning uchun "bir kunda bir nechta
  sessiya" xatosi amalda yuzaga kelmaydi. Baribir yuzaga kelsa, loyihadagi odatdagi shakl:
  `"...bir nechta sessiya bor (morning, evening). test_time ni ko'rsating."`

**Javob:** 1.1 dagi shakl (yangi holat bilan) yoki eng kamida `{ "approval_id": 12 }`.
Frontend javobdan keyin holatni **qaytadan o'qiydi**, shuning uchun aniq shakl muhim emas.

**Takror so'rov:** amaldagi ruxsat turgan bo'lsa xato emas — mavjudini qaytaring.

### 1.3 `DELETE /{approvalId}` — bekor qilish

> **Bu "ortga qaytarish" emas.** Allaqachon yuklab olingan audiolar joyida qoladi —
> faqat yangi urinishlar yopiladi. Modalda ham shunday yozilgan.

Allaqachon bekor qilinganini bekor qilsangiz → 400.

---

## 2-QISM · Nomzod endpointlari

Maydonlar **camelCase** (`/api/v1/exam/**` oilasi).

### 2.1 `GET /api/v1/exam/audio-retry/{examUniqueId}`

```json
{
  "allowed": true,
  "approvedAt": "2026-09-25T04:20:00.000+00:00",
  "approvedByName": "Branch Admin"
}
```

- `allowed` — shu imtihonga amaldagi ruxsat bormi
- `approvedByName` — ixtiyoriy, UI da qavs ichida ko'rsatiladi. `null` bo'lsa ham buzilmaydi
- Ruxsat yo'q bo'lsa: `{ "allowed": false }` — **404 emas**

**Chaqirilish chastotasi:** frontend buni **faqat biror audio yuklanmagan bo'lsa** so'raydi,
15 soniyada bir marta. Hammasi yuklangan sessiya bu endpointni umuman chaqirmaydi.

### 2.2 `POST /api/v1/exam/audio-failure/{examUniqueId}`

```json
{ "moduleType": "listening", "parts": [3, 4] }
```

Nomzodning kompyuteri audio yuklay olmaganini **o'zi xabar qiladi** — admin bron sahifasini
ochganda `reported_parts` da aynan shu ko'rinadi. `parts` 1 dan boshlanadi.

**Frontend javobni kutmaydi va xatoni yutadi** (`.catch` bilan). Ya'ni bu endpoint yiqilsa
ham imtihon davom etadi. Shunga mos ravishda yengil bo'lsin.

Bir xil nabor qayta yuborilmaydi: mijoz har bir yangi "yiqilgan partlar to'plami" uchun
bir martadan yuboradi.

---

## Xato kodlari

| Code | Sabab |
|------|-------|
| 400 | `user_id` yo'q; bir kunda bir nechta sessiya (`test_time` kerak); allaqachon bekor qilinganni bekor qilish |
| 403 | ADMIN/BRANCH_ADMIN emas, yoki branch admin boshqa filialga urinmoqda |
| 404 | Imtihon yoki ruxsat yozuvi topilmadi |

`@Valid` xatosi loyihadagi odatdagi shaklda bo'lsin — frontend uni maydon ostiga chiqaradi:

```json
{ "success": false, "code": 400, "message": "Validations errors",
  "error": { "reason": "reason is too long" } }
```

---

## Ruxsatning muddati

Frontend muddatni **o'zi hisoblamaydi** — `allowed` ni o'qiydi, xolos. Muddat qo'yish
qo'ymaslik backendning ixtiyorida. Tavsiya: imtihon tugashi bilan avtomatik `EXPIRED`,
shunda unutilgan ruxsat keyingi sessiyaga o'tib ketmaydi.

---

## Frontendda nima qilingan

| Fayl | Nima |
|---|---|
| `src/utils/audioRetry.js` | Endpointlar, `approveAudioRetry`, `revokeAudioRetry`, `reportAudioFailure`, `audioRetryAdminStateUrl` |
| `src/components/modal/AudioRetryModal.jsx` | Admin modali — holat, sabab, ruxsat/bekor qilish |
| `src/pages/details/ContestDetails.jsx` | Bron sahifasidagi `🎧` tugmasi |
| `src/hooks/useAudioRetryApproval.js` | Nomzod tarafi: poll + xabar berish |
| `src/components/layouts/AudioStatusPanel.jsx` | Imtihon Settings menyusidagi audio bloki |

Nomzod tarafi Settings menyusida (⚙️) har part uchun holatni ko'rsatadi: **Ready / % /
Failed / No recording**. Muammo bo'lsa va ruxsat yo'q bo'lsa — "nazoratchiga ayting" deb
yoziladi. Ruxsat kelgach **"Download again"** tugmasi paydo bo'ladi.

Bu blok **faqat Listening** imtihonida ko'rinadi.
