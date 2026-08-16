# نشر المتجر على الإنترنت — دليل كامل (أبسط وأوضح طريقة)

المتجر بيتنشر بالكامل (قاعدة بيانات + API + الواجهة) على **سيرفر واحد** عن طريق أمر واحد.
مفيش أي حاجة هتعملها غير 3 خطوات في الأسفل، والباقي معمول ومجهز لك.

---

## الخطوة 1 — استأجر سيرفر (5 دقايق)

الأنسب حاليًا: **Hetzner CX22** (4GB RAM / 2 CPU — حوالي 4€ في الشهر، الأرخص والأضمن).

1. روح https://www.hetzner.com/cloud وأنشئ حساب (فيسبوك/جوجل سريع)
2. Cloud Console → **Add Server**
3. اختر:
   - Location: أقرب ليك (مصر) أو أوروبا
   - Image: **Ubuntu 24.04**
   - Type: **CX22** (أو أرخص CX12 لو للعرض فقط — 2GB كافي)
4. اعمل نسخة من الـ Root password (هيوصل في إيميل)
5. **Create & Buy** — بعدها هتاخد **IP Address** زي `5.78.123.45`
   - (بديل/مجاني: Oracle Cloud Free Tier — بس الاستكشاف سخم، Hetzner أسرع ولا يزعل)

---

## الخطوة 2 — ادخل على السيرفر (PowerShell على ويندوز)

```
ssh root@IP_ADDRESS
```

هيدخلك، وأول مرة هيتطلب الـ password — اكتبه (مش هيتعرض أثناء الكتابة عادي).

بعد الدخول أول مرة هيتطلب تغيير الباسورد — غيّره لشيء تحفظه.

---

## الخطوة 3 — شغّل المتجر (أمر واحد)

الصق الأمر ده في السيرفر وادوس Enter:

```bash
curl -fsSL https://raw.githubusercontent.com/SalahFathy25/shopverse/main/setup-server.sh | bash
```

هيشتغل حوالي 5-10 دقايق (تثبيت Docker + بناء + تشغيل) وبعدها هيطبع لك:

```
Store:  http://5.78.123.45
Admin login: admin@grounded.store
Admin password: <كلمة مرور مولّدة>
```

افتح الرابط في المتصفح — **المتجر جاهز بالمنتجات والبيانات**، وسجّل دخول بالأدمن عشان تعدّل أي حاجة.

> ⚠️ **احفظ كلمة مرور الأدمن** اللي اطبعها — دي مخزنة في `/opt/shopverse/.env` على السيرفر.

---

## يوميًا / بعد أي تعديل على الكود؟

تشغيله دايًا مع السيرفر تلقائيًا (`restart: unless-stopped`) — حتى لو اتقفل الجهاز.

**تحديث الكود:**
```bash
cd /opt/shopverse && git pull && docker compose -f docker-compose.prod.yml up -d --build
```

**النسخ الاحتياطي لقاعدة البيانات** (صورة كاملة):
```bash
docker exec shopverse-db pg_dump -U shopverse ecommerce > backup.sql
```
الاسترجاع: `docker exec -i shopverse-db psql -U shopverse ecommerce < backup.sql`

**سجل التشغيل:**
```bash
docker compose -f /opt/shopverse/docker-compose.prod.yml -p shopverse logs -f
```

---

## اختياري — ربط اسم دومين (بدل الـ IP)

1. عندك دومين مثل `mystore.com` — في سجلات DNS أضف **A record** بقيمة IP السيرفر
2. على السيرفر فعلّ HTTPS بيثبت سيرتفيكيت مجاني:
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d mystore.com -d www.mystore.com
```
(يحتاج تعديل `server_name` في `frontend/nginx.conf` من `_` لأهمية الدومين ثم rebuild)

---

## الأسئلة المتوقعة

- **هل البيانات تترست؟** لأ — Postgres قايمة في مجلد خاص (`volume`) على السيرفر، بتفضل تلقائيًا.
- **هل أول زيارة بتحط منتجات؟** أول تشغيل بس — بعدها أي تحرير ليك/للأدمن بيتبقى.
- **الأمان؟** كل المتاجر غير المكشوفة — JWT سري مولّد، باسورد أدمن مولّد، قاعدة البيانات مش مفتوحة لخارج السيرفر، والواجهة + API على نفس العنوان.

---

**تفاصيل تقنية (مرجع):** الـ backend Spring Boot بـ JVM 512MB، Postgres 16، nginx بيخدم ملفات React ويوصل `/api` للـ API — كلها في `docker-compose.prod.yml`.