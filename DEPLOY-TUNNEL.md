# نشر المتجر — من غير أي كارت خالص (Cloudflare Tunnel + Neon + Vercel)

البديل **اللي مش محتاج فيزا** (بعد ما Render طلبت كارت وKoyeb وHugging Face بقوا مدفوعين في 2026):

- **الـ backend** بيشتغل على **جهازك** (بنفس كودنا المحلي) ويطلع للنت عبر **Cloudflare Tunnel** برابط `https://...trycloudflare.com`
- **قاعدة البيانات** على **Neon** (اللي أنشأناها — مجانية ودائمة، وسرك زى ما هو في `credentials.local.txt`)
- **الواجهة** على **Vercel** (مجانية)

كل ده **$0 تمامًا** وبدون أي بيانات بنك.

---

## المتطلبات

- جهازك شغال فيه **Java 17+** و**Maven** (اللي كنت بتشغّل الباك بيهم)
- اتصال إنترنت عادي

---

## الخطوة 1 — تثبيت cloudflared (مرة واحدة)

افتح **PowerShell** (كمل إلى `Start` → اكتب `powershell`) واكتب:

```
winget install --id Cloudflare.cloudflared
```

ولو الـ winget مش موجود: نزّل من https://github.com/cloudflare/cloudflared/releases ملف
`cloudflared-windows-amd64.exe` → فك الضغط → سمّه `cloudflared.exe` → حطه في أي مجلد (`C:\cloudflared`) → أضفه إلى `PATH`.

تأكد بالامر: `cloudflared --version`

---

## الخطوة 2 — تأكد إن `local.env` جاهز

في المجلد `E:\e_commerce` فيه ملف **`local.env`** (بعد إنشاءنا) — لازم يكون فيه:

```
SPRING_PROFILES_ACTIVE=postgres
DB_URL=jdbc:postgresql://...neon.tech/neondb?sslmode=require
DB_USER=neondb_owner
DB_PASSWORD=...(من credentials.local.txt)
JWT_SECRET=...(طويل وعشوائي)
ADMIN_INITIAL_PASSWORD=...(كلمة سر الأدمن)
CORS_ORIGINS=http://localhost:5173,https://grounded.vercel.app
```

> الملف ده **مستبعد من git** (`local.env` في `.gitignore`) — الأسرار مش بتترفع على GitHub.

---

## الخطوة 3 — التشغيل

من **PowerShell** في مجلد المشروع:

```
.\run-backend-tunnel.ps1
```

(لو اتقفل بـ Policy: `powershell -ExecutionPolicy Bypass -File .\run-backend-tunnel.ps1`)

السكربت بيعمل:
1. يفتح نافذة cmd فيها **الباك** (postgres + Neon) — أول تشغيل ثواني-دقيقتين
2. يستنى إن الباك يرد على `http://localhost:8080/api/v1/settings`
3. يفتح نفق Cloudflare ويطبع:
   ```
   API base:    https://xxxx.trycloudflare.com/api/v1
   ```
4. يحفظ الرابط في ملف `tunnel-url.txt`

جرّبه في المتصفح: `https://xxxx.trycloudflare.com/api/v1/settings` → لازم يرجّع JSON فيه `store_name_en`.

---

## الخطوة 4 — ربط الواجهة (Vercel)

1. افتح https://vercel.com → **Add New → Project** → repo `SalahFathy25/grounded`
2. **Root Directory**: `frontend`
3. **Environment Variables**:
   - `VITE_USE_MOCK` = `false`
   - `VITE_API_URL` = `https://xxxx.trycloudflare.com/api/v1` ← الرابط اللي طلعه السكربت
4. **Deploy** → هتاخد `https://grounded.vercel.app`

ملحوظة: الباك يقبل الطلبات من `https://grounded.vercel.app` لأنها موجودة في `CORS_ORIGINS` داخل `local.env`. لو عايز تضيف أصل تاني: عدّل `CORS_ORIGINS` في `local.env` وأعد تشغيل السكربت.

---

## ⚠️ مهم: الرابط بيتغير كل ما تعيد التشغيل

الـ Quick Tunnel بياخد رابط **جديد في كل مرة** (لأنه مجاني بدون حساب). لو السكربت اتقفل وشغّلته تاني:

1. افتح `tunnel-url.txt` وانسخ الرابط الجديد
2. في Vercel: **Project → Settings → Environment Variables** → عدّل `VITE_API_URL` → **Redeploy**

> **بديل برابط ثابت** (اختياري): استخدم **Tailscale Funnel** (مجاني بدون كارت، حساب بإيميلك): تثبّت Tailscale → تسجل دخول → `tailscale funnel 8080` → يطلع لك رابط ثابت `https://<اسم-جهازك>.<tailnet>.ts.net` لا يتغير أبدًا. لو حبيت نجهّز لك ده بدل الـ Quick Tunnel، قوللي.

---

## ملاحظات وأمان

- الباك شغال على **جهازك**: لو جهازك مقفول، المتجر (الواجهة على Vercel فاتحة لكن) مش هيقدر يوصل للباك ولو الباك نام — يبقى أول طلب ياخد شوية بعد ما ترجّع الجهاز. عادي للمشاريع التجريبية.
- كل البيانات الحقيقية في **Neon** — أمانة حتى لو اتغير جهازك.
- متنساش: `JWT_SECRET` قوي متخزن محليًا، وكلمة سر الأدمن في `credentials.local.txt` (مش على GitHub).
- المتصفح يفتح الرابط العام ويفضل التبويب مفتوح؟ لا — مجرد ما السكربت شغال، أي حد يقدر يدخل.

---

## مشاكل شائعة

| المشكلة | الحل |
|---|---|
| `cloudflared not found` | نفّذ الخطوة 1 وأعد فتح PowerShell |
| الباك مش بيرد على 8080 | شوف نافذة cmd — غالبًا DB_URL/كلمة السر غلط، قارنها بـ `credentials.local.txt` |
| المنفذ 8080 مشغول من تشغيل قديم | اقفل نافذة الباك القديمة أو `stop-process -Name java` وشغّل السكربت تاني |
| `VITE_API_URL` قديم والواجهة بترمي أخطاء | حدّث المتغير في Vercel بـ جديد الرابط واعمل Redeploy |