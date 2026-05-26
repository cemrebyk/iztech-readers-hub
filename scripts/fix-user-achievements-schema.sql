-- Eski user_achievements tablosu integer FK ile kurulmuş; achievements.id text olduğu için
-- insert'ler patlıyor. Tabloyu boş olduğu için drop edip text FK ile yeniden kuruyoruz.

drop table if exists user_achievements;

create table user_achievements (
  user_id        uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null references achievements(id) on delete cascade,
  unlocked_at    timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

alter table user_achievements enable row level security;

drop policy if exists "user_achievements readable by owner" on user_achievements;
create policy "user_achievements readable by owner"
  on user_achievements for select
  using (auth.uid() = user_id);
