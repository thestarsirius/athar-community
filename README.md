# أثر | رفقة إلى الله: دليل الإعداد (بالترتيب)

كل الحسابات أدناه مجانية. لا ترسلي كلمات مرورك لأحد، وأدخليها بنفسك في مواقعها فقط.

## 1) Supabase (قاعدة البيانات وتسجيل الدخول)
1. supabase.com ← Start ← أنشئي حسابًا ومشروعًا جديدًا (اختاري أي منطقة قريبة).
2. SQL Editor ← الصقي محتوى `schema.sql` ← Run.
3. Authentication ← Users ← Add user ← أدخلي بريدك وكلمة مرور قوية جديدة (فعّلي Auto Confirm).
4. SQL Editor ← شغّلي: `insert into admins select id from auth.users where email = 'بريدك';`
5. Project Settings ← API: انسخي `Project URL` و`anon public` (للمفتاحين العامين) و`service_role` (سري جدًا).

## 2) Resend (إشعار البريد)
1. resend.com ← حساب بنفس البريد الذي تريدين الإشعارات عليه ← API Keys ← Create.
2. في الوضع المجاني بلا نطاق خاص يصل البريد إلى بريد حسابك فقط، وهذا يكفيك.

## 3) Cloudflare Worker (استقبال النماذج)
1. cloudflare.com ← Workers & Pages ← Create ← Hello World ← Deploy ← Edit code، والصقي محتوى `worker.js` ← Deploy.
2. Settings ← Variables and Secrets ← أضيفي بنوع Secret:
   `SUPABASE_URL` و`SUPABASE_SERVICE_KEY` و`RESEND_API_KEY` و`NOTIFY_EMAIL` (بريدك) و`ALLOWED_ORIGIN` (رابط موقعك من الخطوة 5) و`ADMIN_URL` (رابط admin.html) و`NTFY_TOPIC` (اختياري، انظري الخطوة 6).
3. انسخي رابط الـ Worker.

## 4) ضبط الموقع
افتحي `config.js` وضعي: `API` (رابط Worker)، `SB_URL`، `SB_KEY` (المفتاح anon فقط). هذه القيم عامة بطبيعتها، أما service_role وResend فلا تضعيهما هنا أبدًا.

## 5) النشر على GitHub Pages
1. github.com ← New repository باسم `athar` ← Public.
2. Add file ← Upload files ← ارفعي: `index.html` و`admin.html` و`config.js` و`.gitignore` فقط.
3. Settings ← Pages ← Branch: main ← Save. الرابط: `https://اسم-حسابك.github.io/athar/` ولوحتك على `/admin.html`.
4. ارجعي إلى Cloudflare وضعي هذا الرابط في `ALLOWED_ORIGIN`.

## 6) إشعار الجوال المجاني
ثبّتي تطبيق ntfy على جوالك، واشتركي في موضوع بكلمة طويلة سرية لا يخمنها أحد، وضعي الكلمة نفسها في `NTFY_TOPIC`. يصلك إشعار فوري مع رابط اللوحة. أما واتساب التلقائي فيحتاج WhatsApp Business Platform، وSMS مدفوع.

## 7) اختبار نهائي
أرسلي طلب تطوع تجريبيًا من الموقع المنشور، وتأكدي من وصول البريد وإشعار ntfy، ومن ظهوره في لوحة الإدارة، ثم احذفيه من اللوحة.
