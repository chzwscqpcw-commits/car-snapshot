-- Partner orders: the two Rakuten Advertising reports the daily job pulls
-- (/api/cron/rakuten-reports, src/lib/partner-orders.ts).
-- Run ONCE in the Supabase SQL editor. Until it is run the job answers
-- "no_table" and the Friday email says the tables are missing; nothing fails.
--
-- PRIVATE. site_events can be read with the public anon key, so order rows do
-- not go there. Both tables have row-level security ON and NO policy, and the
-- anon and authenticated roles are revoked outright: only the server
-- (service role) reads or writes them.
--
-- No registration is stored. The lock report's SKU (the customer's
-- registration) and Product Name (their car) are dropped when the report is
-- read, before anything reaches these tables; there is no column for either.

-- "Revenue Report by Day": one row per day, overwritten by each pull.
create table if not exists rakuten_daily (
  day                  date primary key,
  impressions          integer       not null default 0,
  clicks               integer       not null default 0,
  orders               integer       not null default 0,
  sales                numeric(12,2) not null default 0,
  baseline_commission  numeric(12,2) not null default 0,
  adjusted_commission  numeric(12,2) not null default 0,
  total_commission     numeric(12,2) not null default 0,
  updated_at           timestamptz   not null default now()
);

-- "Lock Status Report": one row per order, keyed by Rakuten's Transaction ID.
-- A later pull overwrites the status and amounts. When the commission changes,
-- the earlier figure is kept in previous_commission (with when it changed),
-- and every change of commission or status is appended to `changes`:
--   [{ "at": "<iso>", "commission": [from, to], "status": ["Unlocked", "Locked"] }]
-- placement is the report's Member ID (U1): the ctx our /go link sent.
create table if not exists rakuten_orders (
  transaction_id         text primary key,
  mid                    text,
  advertiser             text,
  order_id               text,
  transaction_date       date          not null,
  transaction_time       text,
  items                  numeric(12,2) not null default 0,
  sales                  numeric(12,2) not null default 0,
  commission             numeric(12,2) not null default 0,
  process_date           date,
  process_time           text,
  placement              text,
  lock_status            text          not null,
  auto_lock_date         date,
  auto_lock_time         text,
  locked_date            date,
  locked_time            text,
  last_update_date       date,
  last_update_time       text,
  previous_commission    numeric(12,2),
  commission_changed_at  timestamptz,
  changes                jsonb         not null default '[]'::jsonb,
  first_seen_at          timestamptz   not null default now(),
  updated_at             timestamptz   not null default now()
);

create index if not exists rakuten_orders_transaction_date on rakuten_orders (transaction_date);

alter table rakuten_daily  enable row level security;
alter table rakuten_orders enable row level security;

revoke all on rakuten_daily  from anon, authenticated;
revoke all on rakuten_orders from anon, authenticated;
