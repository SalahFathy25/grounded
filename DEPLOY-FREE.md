# نشر المتجر على الإنترنت — ببلاش كليًا (Render + Neon + Vercel)

البديل **دون شراء أي سيرفر**: الـ backend على Render، قاعدة البيانات على Neon، والواجهة على Vercel.
كلهم ببلاش (خطط مجانية)، والتسجيل بحسابك على GitHub لكل خدمة. ~٢٠ دقيقة.

> 💳 **زوّدنا**: لو Render طلب منك بيانات فيزا وقت إنشاء الـ Blueprint (بيحصل للمستويات المجانية):
> استخدم [`DEPLOY-TUNNEL.md`](./DEPLOY-TUNNEL.md) — بديل **كامل من غير أي كارت**: الباك بيشتغل على جهازك ويطلع برابط عام عبر Cloudflare Tunnel، والقاعدة على Neon والواجهة على Vercel زي ما هي.

---

## الخطوة 1 — قاعدة بيانات مجانية دائمة (Neon) — اختيارية

> الباك الجديد (Node) بيشتغل بملف SQLite من غير أي إعداد — بس **في Render المجاني الملف مش بيثبت** بعد الـ redeploy. فلو عايز بيانات دائمة (منتجاتك وطلباتك تفضل)، نزّل قاعدة من Neon: **الأفضل** لنا.

1. افتح https://neon.tech واعمل **Sign up** (إيميلك أو GitHub)
2. اعمل مشروع جديد: **Projects → New Project**
   - Name: `grounded` — Region: أقرب ليك (مثلاً eu-central-1) — **Create**
3. هيظهر الاتصال: **Connection string** → خد نسخة محفوظة منها (شكلها زي تحت):
   ```
   postgresql://USER:PASSWORD@ep-xxx.REGION.aws.neon.tech/grounded
   ```
4. اقسمها كالتالي (مهم) 🔽
   - `DB_URL` =
     ```
     postgres://USER:PASSWORD@ep-xxx.REGION.aws.neon.tech/grounded?sslmode=require
     ```
   - (ممكن برضه بلغة جافا القديمة: `jdbc:postgresql://...` — الباك بيفهم الاتنين)

---

## الخطوة 2 — الـ backend على Render (مجاني)

1. افتح https://render.com → **Sign up** → **GitHub** (نفس حسابك — repo موجود عندنا)
2. من **Dashboard → New → Blueprint**، اختار repo: `SalahFathy25/grounded` → رايح يقرا ملف `render.yaml` تلقائيًا
3. هيطلب منك تعبي المتغيرات (`sync: false`) 🔽
   - `DB_URL` = الرابط اللي عملته في الخطوة 1 (لو سيبته فاضي: هيشتغل SQLite — للاختبار السريع بس)
   - `ADMIN_INITIAL_PASSWORD` = اكتب كلمة سر قوية للأدمن (احفظها!)
   - `CORS_ORIGINS` = مؤقتًا خد الذيل: `https://grounded.vercel.app` (تعرفها في الخطوة 3 وبعدين ارجع عدّلها بأي مرة)
4. **Apply** → هيبني وينشر تلقائيًا (5-10 دقايق)
5. هتاخد رابط بيفتح كده: `https://grounded-api.onrender.com`
   - اختبره من المتصفح: `https://grounded-api.onrender.com/api/v1/settings` → لازم يرجع JSON فيه `store_name_en`

> ⚠️ المستوى المجاني: بعد ١٥ دقيقة من غير زيارة، الباك "بينام" — أول زيارة بتاخد ٣٠-٦٠ ثانية وبعدها يشتغل عادي.

---

## الخطوة 3 — الواجهة على Vercel (مجاني)

1. افتح https://vercel.com → **Sign up with GitHub** → **Continue**
2. **Add New → Project** → اختار `SalahFathy25/grounded`
3. في **Root Directory** اختار: `frontend` (مهم!)
4. في **Environment Variables** أضف:
   - `VITE_USE_MOCK` = `false`
   - `VITE_API_URL` = `https://grounded-api.onrender.com/api/v1`
5. **Deploy** → بعدها هتاخد رابط زي: `https://grounded.vercel.app`

6. **رجع لـ Render** → مرجع: Environment → `CORS_ORIGINS` غيّرها إلى:
   ```
   https://grounded.vercel.app
   ```
   → **Save** → **Manual Deploy → Deploy latest** (أو بيحدث لوحده بسبب autoDeploy)

---

## الخطوة 4 — تشغيل المتجر

افتح `https://grounded.vercel.app`:
- الأدمن: `https://grounded.vercel.app/admin/login` — بـ `admin@grounded.store` + كلمة السر اللي كتبتها في Render
- المنتجات والبيانات بتتبقى **في قاعدة بيانات Neon** — دائمة وموجودة حتى لو Render نام أو Vercel اتقفل

---

## بعد أي تعديل في الكود؟

- **GitHub يدي رسالة** لـ Render و Vercel تلقائيًا → يعملو ريبّلد لوحدهم (autoDeploy شغال).
- أي صيانة/مشاهدة: من لوحة Render و Vercel.

---

## كلمات السر والأمان الخلاصة

- كل المتغيرات السرية في **لوحات الخدمات فقط** (مش في الكود).
- لو نسيت `DB_PASSWORD`: ترجع لوحة Neon → الـ Connection string.
- لو نسيت `ADMIN_INITIAL_PASSWORD`: تعدّله من لوحة Render (Environment) وتنشر تاني — **بس مش هيتغير لو المستخدم اتسجل قبل كده**، فاحفظه معاك الأول.

---

## هل في حدود؟

- **Render free**: أول زيارة بطيئة + قفل شهري محدود لساعات التشغيل (500 ساعة ≈ كفاية).
- **Neon free**: 0.5GB تخزين — يكفي متاجر صغيرة جدا.
- **Vercel free**: غير محدود عمليًا.
- لو المخزون تعدى، ترقي لخطط بسيطة كده كده من غير ما تغيّر أي كود.