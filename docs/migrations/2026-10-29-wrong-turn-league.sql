-- "Took a wrong turn" 404 game: the weekly league.
-- Run ONCE in the Supabase SQL editor. Until it's run, the league panel
-- simply doesn't appear and the game works as before.
--
-- One row per finished run that someone chose to enter. The league shows the
-- current week only (week_start = the Monday, UK time), so it resets itself
-- every Monday; old weeks stay for the record.
--
-- RLS is on with no policies: only the server (service role, via
-- /api/wrong-turn/league) can read or write. run_id makes each signed run
-- token single-use.

create table if not exists wrong_turn_scores (
  id          bigserial primary key,
  initials    text        not null check (initials ~ '^[A-Z]{3}$'),
  seconds     numeric(5,1) not null check (seconds between 25 and 900),
  week_start  date        not null,
  run_id      text        not null unique,
  ip_hash     text,
  created_at  timestamptz not null default now()
);

create index if not exists wrong_turn_scores_week_seconds
  on wrong_turn_scores (week_start, seconds);

alter table wrong_turn_scores enable row level security;
