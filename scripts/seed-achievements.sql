-- Achievements şeması + 10 başarımın seed'i.
-- Supabase SQL editor'de tek seferde çalıştır.

-- 1) Tablolar (yoksa oluştur)
create table if not exists achievements (
  id          text primary key,
  name        text not null,
  description text not null,
  icon        text,
  category    text
);

create table if not exists user_achievements (
  user_id        uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null references achievements(id) on delete cascade,
  unlocked_at    timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- Eski şemada icon_url varsa, eksik kolonları ekle (zarar vermez).
alter table achievements add column if not exists icon text;
alter table achievements add column if not exists category text;

-- 2) RLS — herkes achievements tanımlarını okuyabilsin; user_achievements'ı sadece sahibi okusun.
alter table achievements enable row level security;
alter table user_achievements enable row level security;

drop policy if exists "achievements readable by all" on achievements;
create policy "achievements readable by all"
  on achievements for select
  using (true);

drop policy if exists "user_achievements readable by owner" on user_achievements;
create policy "user_achievements readable by owner"
  on user_achievements for select
  using (auth.uid() = user_id);

-- Not: INSERT'leri server action'lardaki service-role key yapacak (RLS bypass), bu yüzden
-- ekleme/silme policy'sine gerek yok.

-- 3) Seed
insert into achievements (id, name, description, icon, category) values
  ('first-review',    'İlk Eleştiri',       'İlk değerlendirmeni yaz',                      '✍️', 'Değerlendirme'),
  ('reviewer-10',     'Kalem Ustası',       '10 değerlendirme yaz',                         '🖊️', 'Değerlendirme'),
  ('reviewer-50',     'Eleştirmen',         '50 değerlendirme yaz',                         '📝', 'Değerlendirme'),
  ('five-star',       '5 Yıldız',           'Bir kitaba 5 yıldız ver',                      '⭐', 'Değerlendirme'),
  ('first-list',      'Koleksiyoncu',       'İlk okuma listeni oluştur',                    '📋', 'Listeler'),
  ('list-master',     'Liste Ustası',       '5 okuma listesi oluştur',                      '🗂️', 'Listeler'),
  ('genre-explorer',  'Tür Kaşifi',         '5 farklı türde kitap oku',                     '🧭', 'Keşif'),
  ('genre-master',    'Her Türün Ustası',   '10 farklı türde kitap oku',                    '🌍', 'Keşif'),
  ('classic-reader',  'Klasik Okuyucu',     '10 klasik eser oku',                           '🏺', 'Keşif'),
  ('night-owl',       'Gece Kuşu',          'Gece 12''den sonra bir değerlendirme yaz',     '🦉', 'Aktivite')
on conflict (id) do update set
  name        = excluded.name,
  description = excluded.description,
  icon        = excluded.icon,
  category    = excluded.category;
