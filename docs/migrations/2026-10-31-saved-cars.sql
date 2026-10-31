-- "My Cars" with alerts: a car a visitor saved so we can tell them when
-- something about it changes (MOT due, tax due, a new recall, a value check).
-- Run ONCE in the Supabase SQL editor BEFORE deploying the save card. Until
-- it's run, /api/saved-cars answers 503 and the card shows a "try again" note.
--
-- Same privacy pattern as mot_reminders: this is the one place a plate is
-- stored in clear, because sending a timed alert needs it. Vehicle lookups
-- themselves stay anonymous (site_events only ever holds a hash). A row is
-- kept while active; "stop alerts" (manage_token, in every email) flips
-- active=false, and inactive rows older than 12 months can be purged.
--
-- RLS is on with no policies: only the server (service role) reads or writes.
--
-- channel: how alerts reach this person. "email" needs email; "push" (PR 2)
-- needs push_subscription_id, added by the push migration.
-- intent: what they said about the car — "selling" / "keeping" / "thinking"
-- (about it) — or null. The monthly value check goes to selling + thinking.
-- alerts_sent: which alerts went out, keyed by kind ("mot_35", "mot_7",
-- "tax", "recall:<number>", "value:<yyyy-mm>") → ISO timestamp. The daily
-- cron reads it so nothing is sent twice.

create table if not exists saved_cars (
  id            uuid primary key default gen_random_uuid(),
  vrm           text        not null check (vrm ~ '^[A-Z0-9]{2,7}$'),
  make_model    text,
  mot_expiry    date,
  tax_due       date,
  channel       text        not null check (channel in ('email', 'push')),
  email         text        check (email is null or email = lower(email)),
  intent        text        check (intent is null or intent in ('selling', 'keeping', 'thinking')),
  surface       text,
  manage_token  uuid        not null default gen_random_uuid() unique,
  active        boolean     not null default true,
  alerts_sent   jsonb       not null default '{}'::jsonb,
  last_value    integer,
  recall_count  integer,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint saved_cars_channel_target check (
    (channel = 'email' and email is not null) or channel <> 'email'
  )
);

-- One row per (email, car): saving again updates the row instead of adding one.
create unique index if not exists saved_cars_email_vrm
  on saved_cars (email, vrm) where email is not null;

-- The daily cron scans active rows by date.
create index if not exists saved_cars_active_mot on saved_cars (mot_expiry) where active;
create index if not exists saved_cars_active_tax on saved_cars (tax_due) where active;

alter table saved_cars enable row level security;
