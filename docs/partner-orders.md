# Partner orders: the daily Rakuten report pull

What it replaces: exporting two CSVs by hand from the Rakuten Advertising
publisher dashboard to compare with our own click counts.

What it does: once a day `/api/cron/rakuten-reports` fetches the two saved
reports, stores them in two private tables, and the Friday audit email and
`/data-health` show a "Partner orders" block: clicks, orders, orders paying
against orders at zero, provisional and locked commission, a split by
placement (`u1`), and a day-by-day check of Rakuten's click count against
ours.

Code: `src/lib/rakuten-reports.ts` (fetch, parse, clean),
`src/lib/partner-orders.ts` (store, summary, email block),
`scripts/test-rakuten-reports.ts` (`npm run test:rakuten`).

## Setup (once)

1. **Create the tables.** Run
   `docs/migrations/2026-11-13-rakuten-reports.sql` in the Supabase SQL
   editor. Both tables have row-level security on and no policy: only the
   server's service-role key can read or write them.

2. **Get the two links.** In the Rakuten Advertising publisher dashboard,
   open Reports and, for each saved report, use the **View Report** dropdown
   and choose **Get API**. Copy the whole address it shows (it ends with a
   `token=` value).

   | Variable | Saved report |
   |----------|--------------|
   | `RAKUTEN_REVENUE_REPORT_URL` | Revenue Report by Day |
   | `RAKUTEN_LOCK_REPORT_URL` | Lock Status Report, filter *Lock Status in Unlocked, Locked* |

   Save each report with the widest date range on offer, starting no later
   than the programme's first day: an order's lock status changes weeks
   after its transaction date, and a pull only updates the orders its range
   covers. If the link has fixed `start_date` and `end_date` values, the
   pull moves the end date to today on every run; a relative range is used
   as it is.

3. **Add them to Vercel** (Project → Settings → Environment Variables,
   Production; mark them Sensitive) and redeploy. Add the same two lines to
   `.env.local` for the local command. The links are secrets: treat each
   like a password, and never paste one into a chat, an issue or a commit.

4. **For the local command only**, set `RAKUTEN_EXPORT_DIR` in `.env.local`
   to the folder the cleaned CSVs should be written to.

Until step 3 is done everything says "not connected" and nothing else
happens: no email, no error.

## First run

The job runs daily at 06:15 UTC. To try it straight away (dry run first:
it fetches and reads both reports and writes nothing):

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" "https://www.freeplatecheck.co.uk/api/cron/rakuten-reports?dry=1"
```

The answer is counts only: rows read per report and, for orders, how many
are new, changed commission, dropped to zero or changed status. A `state` of
`not_connected`, `no_store` or `no_table` says which setup step is missing.
A failure names the report and the reason (a missing column is named; a 401
or 403 means the link's token has expired and a fresh "Get API" link is
needed). Then run it without `?dry=1` and open `/data-health`.

The response format of the "Get API" links was written from the hand
exports. The parser finds columns by name, accepts a response with or
without the three preamble lines, and fails loudly on a missing column, so
the first real run is the check that the two agree.

## The local command

```bash
npm run rakuten:pull
```

Writes `rakuten-revenue-by-day.csv` and `rakuten-lock-status.csv` into
`RAKUTEN_EXPORT_DIR`, replacing the previous run's. Plain CSVs: no preamble,
ISO dates, bare numbers. It does not start the site and touches no database.

To clean a hand export instead of fetching:

```bash
npm run rakuten:pull -- --revenue-file <path> --lock-file <path>
```

## Privacy

In the Lock Status report `SKU` is the customer's vehicle registration and
`Product Name` describes their car. Neither is kept anywhere. The parser
reads an allow-list of columns and returns nothing else, a kept text cell
that repeats the SKU is blanked, and a row whose cells don't line up with
the header is refused rather than guessed at. The cleaned lock CSV has
neither column, and the tables have no column for either.

## Reading the block

- **Paying / at zero**: orders with a commission above zero, and the rest.
- **Provisional**: commission on orders not locked yet; it can still change.
  **Locked** is final.
- **Dropped to zero**: an order that had a commission on an earlier pull and
  has none now. The earlier figure is kept (`previous_commission`), and the
  email and the dashboard call these out in red for a week.
- **Clicks, Rakuten against ours**: per day, Rakuten's count beside our
  `partner_click` rows for We Buy Any Car (owner traffic left out). A
  finished day more than 3 clicks (or a tenth of the day) apart is flagged.
  Today is never judged. Days are compared in UTC.
- If the last successful pull is more than a day and a half old, both
  places say so.

`/data-health?partner-orders=sample` shows the panel with made-up figures.
