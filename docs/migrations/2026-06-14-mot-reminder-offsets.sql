-- MOT reminder: user-selectable reminder timing.
-- Run ONCE in the Supabase SQL editor BEFORE deploying the offsets code.
--
-- Adds:
--   reminder_offsets int[]  — the chosen schedule, in days before MOT expiry
--                             (new signups default to 5 weeks + 1 week = {35,7})
--   sent_offsets     int[]  — which of those windows have already been emailed
--
-- Backfills the existing rows to preserve their current 28 + 7 behaviour, and
-- maps the old boolean sent-flags into sent_offsets so the new cron never
-- re-sends a reminder a subscriber has already had.

alter table mot_reminders
  add column if not exists reminder_offsets int[] not null default '{35,7}',
  add column if not exists sent_offsets     int[] not null default '{}';

update mot_reminders
set reminder_offsets = '{28,7}',
    sent_offsets = (
      (case when reminder_28d_sent then array[28] else array[]::int[] end) ||
      (case when reminder_7d_sent  then array[7]  else array[]::int[] end)
    )
where created_at < now();
