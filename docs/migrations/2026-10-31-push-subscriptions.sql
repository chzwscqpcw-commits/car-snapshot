-- Web push for "My Cars" alerts. Run ONCE in the Supabase SQL editor, AFTER
-- 2026-10-31-saved-cars.sql and BEFORE deploying the push option.
--
-- A push subscription is the address a browser gives us for notifications
-- (an endpoint URL at the browser vendor's push service plus two keys). It
-- identifies a browser profile, not a person, and carries no email. Same
-- retention as saved_cars: inactive rows (the browser revoked permission, or
-- the push service answered 404/410) are purged after 12 months. Service role
-- only.
--
-- VAPID keys (the server's identity to the push services) live in Vercel env:
--   NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:)
-- Generate once with `npx web-push generate-vapid-keys`. Never commit them.

create table if not exists push_subscriptions (
  id            uuid primary key default gen_random_uuid(),
  endpoint      text        not null unique,
  p256dh        text        not null,
  auth          text        not null,
  user_agent    text,
  active        boolean     not null default true,
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz
);

alter table push_subscriptions enable row level security;

-- A saved car reaches its owner by email OR by push.
alter table saved_cars
  add column if not exists push_subscription_id uuid references push_subscriptions (id) on delete set null,
  add column if not exists year_of_manufacture integer;

alter table saved_cars drop constraint if exists saved_cars_channel_target;
alter table saved_cars add constraint saved_cars_channel_target check (
  (channel = 'email' and email is not null) or
  (channel = 'push' and push_subscription_id is not null)
);

-- One row per (browser, car), as (email, car) for email rows.
create unique index if not exists saved_cars_push_vrm
  on saved_cars (push_subscription_id, vrm) where push_subscription_id is not null;
