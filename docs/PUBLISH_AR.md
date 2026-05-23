# نشر BlinkOTP على Chrome Web Store — دليل خطوة بخطوة

هذا الدليل يشرح **لماذا الإضافة حالياً تعمل على إيميلك فقط**، و**ماذا تفعل لتشتغل على أي حساب Gmail**، ثم **رفعها على المتجر**.

---

## لماذا تعمل على إيميلك فقط الآن؟

السبب **ليس في الكود** — السبب في **إعدادات Google OAuth**:

| الوضع | من يقدر يسجّل دخول؟ |
|--------|---------------------|
| **Testing** (وضع التجربة) | فقط الإيميلات المضافة تحت **Test users** في Google Cloud (حد أقصى 100) |
| **In production** بدون تحقق | أي حساب — لكن Google يعرض تحذير "التطبيق غير موثّق" |
| **In production + Verified** | أي حساب — شاشة موافقة عادية بدون تحذير مخيف |

إيميلك مضاف كـ Test user، فشغّال. أي شخص ثاني **لن يستطيع** Connect Gmail حتى تنشر التطبيق على OAuth وتكمل التحقق (أو تضيفه كـ Test user يدوياً).

---

## المرحلة 1 — تجهيز Google Cloud (مرة واحدة)

### 1.1 مشروع Google Cloud

1. افتح [Google Cloud Console](https://console.cloud.google.com/).
2. أنشئ مشروعاً للإنتاج (مثلاً `blinkotp-production`) أو استخدم مشروعك الحالي `blinkotp`.
3. فعّل **Gmail API**: APIs & Services → Library → Gmail API → Enable.

### 1.2 شاشة موافقة OAuth (OAuth consent screen)

1. APIs & Services → **OAuth consent screen**.
2. **User type:** External (للجمهور).
3. املأ:
   - App name: `BlinkOTP`
   - User support email
   - **App logo** (128×128)
   - **Application home page** (موقع أو GitHub Pages)
   - **Privacy policy URL** — ارفع `docs/PRIVACY_POLICY.md` على GitHub Pages أو موقعك (رابط عام)
4. **Scopes** → Add scope → `https://www.googleapis.com/auth/gmail.readonly`
5. **Justification:** read-only access to detect recent verification emails for OTP autofill; no send/delete.

### 1.3 عملاء OAuth (مهم جداً — نوعان)

#### أ) Chrome extension client (لـ Google Chrome)

1. Credentials → Create credentials → **OAuth client ID**.
2. Application type: **Chrome extension** (مش Web application).
3. **Item ID / Extension ID:** هذا **ID الإضافة من Chrome Web Store** (انظر المرحلة 2).  
   - ID الـ unpacked المحلي (`chrome://extensions`) **غالباً مختلف** عن ID المتجر.
4. انسخ **Client ID** → ضعه في `.env.local`:
   ```
   VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
   ```

#### ب) Web application client (لـ Brave والـ fallback)

1. Create credentials → **Web application**.
2. **Authorized redirect URIs:**
   ```
   https://<EXTENSION_ID>.chromiumapp.org/
   ```
   استبدل `<EXTENSION_ID>` بـ **Item ID من المتجر** (نفس ID الخاص بـ Chrome extension client).
3. انسخ Client ID:
   ```
   VITE_GOOGLE_WEB_CLIENT_ID=yyyy.apps.googleusercontent.com
   ```

> **لا تضع Client Secret في build المتجر.**  
> Secret للتطوير المحلي فقط. build النشر: `npm run pack:store` يرفض البناء لو الـ secret موجود.

### 1.4 تدوير الـ Client Secret (مهم)

لو كان عندك ملف `client_secret_*.json` في المشروع، **اعتبره مكشوفاً**:

1. Google Cloud → Credentials → Web client → **Reset secret** (أو أنشئ client جديد).
2. Secret الجديد يبقى في `.env.local` **للتطوير على جهازك فقط** — لا يُرفع ولا يُبنى في ZIP المتجر.

---

## المرحلة 2 — Chrome Web Store (حساب المطوّر)

### 2.1 تسجيل حساب مطوّر

1. [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. ادفع **$5** (مرة واحدة لحساب Google).

### 2.2 أول رفع (Draft) للحصول على Extension ID

1. على جهازك:
   ```bash
   cd blinkotp
   # علّق أو احذف VITE_GOOGLE_WEB_CLIENT_SECRET من .env.local
   npm run pack:store
   ```
   ينتج `blinkotp-store.zip`.
2. Dashboard → **New item** → ارفع `blinkotp-store.zip`.
3. بعد الرفع، افتح صفحة الإضافة وانسخ **Item ID** (Extension ID الرسمي).

### 2.3 ربط OAuth بالـ Item ID

ارجع لـ Google Cloud:

1. عدّل **Chrome extension** OAuth client → Item ID = الـ Item ID من المتجر.
2. عدّل **Web application** → Redirect URI = `https://<ITEM_ID>.chromiumapp.org/`
3. حدّث `.env.local` بالـ Client IDs الصحيحة.
4. أعد البناء: `npm run pack:store` وارفع **نسخة جديدة** (version أعلى في `manifest.config.ts`).

---

## المرحلة 3 — جعلها تعمل على أي إيميل (ليس إيميلك فقط)

### 3.1 نشر OAuth للإنتاج

1. OAuth consent screen → **Publishing status** → **Publish app** (In production).
2. أي حساب Google **يقدر يحاول** الاتصال — لكن `gmail.readonly` scope **حساس**، فGoogle يطلب **Verification**.

### 3.2 Google OAuth Verification (مجاني — يأخذ أيام/أسابيع)

1. Verification Center → Submit for verification.
2. جهّز:
   - شرح: الإضافة تقرأ إيميلات التحقق الأخيرة فقط، read-only، بدون سيرفر، بدون تخزين سحابي.
   - فيديو قصير (1–2 دقيقة): Connect Gmail → استلام OTP → autofill.
   - Privacy policy URL عام.
3. بعد **Approval**: أي مستخدم يرى شاشة موافقة عادية.

**حتى الموافقة:** يمكنك Beta بـ Test users (100 كحد أقصى) — **مش** للنشر العام.

---

## المرحلة 4 — إكمال listing المتجر

املأ من `docs/CHROME_WEB_STORE.md`:

- Short / detailed description
- Category: Productivity
- Screenshots 1280×800 (5 صور)
- Privacy policy URL
- Single purpose: OTP autofill from Gmail
- Permission justifications (انسخ من `docs/SECURITY.md`)

**Review notes** للمراجع:

- `gmail.readonly` — read recent verification emails only
- `<all_urls>` — OTP fields on arbitrary login pages
- `identity` — OAuth without backend
- No analytics, no remote servers

---

## المرحلة 5 — فحص أمان قبل الرفع النهائي

| تحقق | |
|------|---|
| `npm run pack:store` ينجح بدون secret | ✅ |
| لا يوجد `client_secret*.json` في المشروع | ✅ |
| `dist/` لا يحتوي `GOCSPX` (client secret) | ابحث في dist بعد build |
| `.env.local` و `backups/` **مش** في ZIP | `pack:store` يضغط `dist/` فقط |
| Privacy policy منشورة على URL عام | |
| OAuth Item ID = Item ID المتجر | |

---

## أوامر سريعة

```bash
# تطوير محلي (مع secret اختياري لـ Brave refresh)
npm run build

# بناء + ZIP للمتجر (بدون secret)
# علّق VITE_GOOGLE_WEB_CLIENT_SECRET في .env.local أولاً
npm run pack:store
```

---

## ماذا يحدث للمستخدم النهائي؟

1. يثبّت من Chrome Web Store.
2. يفتح Popup → **Connect Gmail** → موافقة Google.
3. يزور أي موقع فيه OTP → الإضافة تجلب الكود من **Gmail الخاص به** (مش إيميلك).

لا يوجد في الكود إيميل ثابت أو حساب مطوّر — كل شيء per-user على جهازه.

---

## روابط مفيدة

- [OWNER_SETUP.md](./OWNER_SETUP.md) — النسخة الإنجليزية التفصيلية
- [Google OAuth verification FAQ](https://support.google.com/cloud/answer/9110914)
- [Chrome Web Store publish](https://developer.chrome.com/docs/webstore/publish)
