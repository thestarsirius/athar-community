-- الصقيه في Supabase ← SQL Editor ← Run
create table volunteers (id uuid primary key default gen_random_uuid(), created_at timestamptz default now(), status text default 'جديد', notes text, data jsonb);
create table suggestions (id uuid primary key default gen_random_uuid(), created_at timestamptz default now(), status text default 'جديد', data jsonb);
create table events (id uuid primary key default gen_random_uuid(), created_at timestamptz default now(), title text, description text, duration text, start_date date, end_date date, how text, published boolean default true);
create table admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table volunteers enable row level security;
alter table suggestions enable row level security;
alter table events enable row level security;
alter table admins enable row level security;
create policy "admin sees self" on admins for select using (user_id = auth.uid());
create policy "admin all" on volunteers for all using (exists (select 1 from admins a where a.user_id = auth.uid())) with check (exists (select 1 from admins a where a.user_id = auth.uid()));
create policy "admin all" on suggestions for all using (exists (select 1 from admins a where a.user_id = auth.uid())) with check (exists (select 1 from admins a where a.user_id = auth.uid()));
create policy "admin all" on events for all using (exists (select 1 from admins a where a.user_id = auth.uid())) with check (exists (select 1 from admins a where a.user_id = auth.uid()));
create policy "public reads published" on events for select using (published = true);
-- الطلبات والاقتراحات: لا قراءة ولا كتابة عامة إطلاقًا. الحفظ يتم من الـ Worker بمفتاح الخدمة.
-- بعد إنشاء حسابك في Authentication ← Users شغّلي هذا السطر مع بريدك (من هنا فقط، لا ترفعيه إلى GitHub):
-- insert into admins select id from auth.users where email = 'ضعي-بريدك-هنا';
