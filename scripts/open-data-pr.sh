#!/usr/bin/env bash
# The gate between a refresh workflow's scrape and `main`.
#
# Runs after `validate-data.ts --against origin/main` has classified the
# refreshed files, and does one of three things:
#
#   ok      commit to a branch, open a PR, enable auto-merge (lands once CI's
#           `checks` passes — exactly the flow the workflows had before).
#   review  commit, open the PR WITHOUT auto-merge, label it `data-review`,
#           put the validation table in its body, and open or update the issue
#           "Data refresh needs review: <date>" with the same table.
#   fail    restore the previous files, open no PR, open or update that issue.
#           The calling workflow then fails its job so the run goes red.
#
# "No refresh can go wrong without someone being told, and no corrupt file can
# reach main": a shape error or an impossible change never gets a branch; a
# plausible-but-large change gets a PR a person must click.
#
# Inputs (environment):
#   PREFIX       branch prefix, e.g. data-refresh/
#   TITLE        commit message and PR title
#   DATA_FILES   space-separated paths this workflow may commit
#   STATUS       ok | review | fail  (validate-data.ts writes it to $GITHUB_OUTPUT)
#   OUTCOMES     Markdown table of the per-source step outcomes
#   REPORT       path to validation-report.md
#   DRY_RUN      "true" to stop after the change check: no PR, issue or push
#   GH_TOKEN, GITHUB_REPOSITORY, GITHUB_RUN_ID, GITHUB_OUTPUT (from Actions)
# Outputs ($GITHUB_OUTPUT): changed, outcome (auto-merge|review-pr|failed|no-change), pr, issue
set -euo pipefail

: "${PREFIX:?}" "${TITLE:?}" "${DATA_FILES:?}" "${STATUS:?}" "${REPORT:?}"
RUN_URL="${GITHUB_SERVER_URL:-https://github.com}/${GITHUB_REPOSITORY:-}/actions/runs/${GITHUB_RUN_ID:-0}"
TODAY=$(date -u +%F)
LABEL="data-review"

out() {
  echo "$1=$2" >> "${GITHUB_OUTPUT:-/dev/null}"
  echo "$1=$2"
}

ensure_label() {
  gh label create "$LABEL" --color D4A017 --force \
    --description "A data refresh that needs a human look before it lands" >/dev/null 2>&1 || true
}

# Body = heading + the step outcomes + the validation table + the run link.
write_body() {
  local heading="$1" extra="${2:-}"
  {
    echo "$heading"
    echo
    [ -n "$extra" ] && { echo "$extra"; echo; }
    echo "${OUTCOMES:-}"
    echo
    cat "$REPORT"
    echo
    echo "Run: $RUN_URL"
  }
}

# One issue per day, updated in place when the same day re-runs.
upsert_issue() {
  local title="$1" bodyfile="$2" num url
  ensure_label
  num=$(gh issue list --state open --label "$LABEL" --json number,title \
          -q ".[] | select(.title == \"$title\") | .number" | head -n1 || true)
  if [ -n "$num" ]; then
    gh issue edit "$num" --body-file "$bodyfile" >/dev/null
    gh issue comment "$num" --body "Updated by run $RUN_URL (status: $STATUS)." >/dev/null
    url=$(gh issue view "$num" --json url -q .url)
  else
    url=$(gh issue create --title "$title" --body-file "$bodyfile" --label "$LABEL")
  fi
  out issue "$url"
}

if git diff --quiet -- $DATA_FILES; then changed=false; else changed=true; fi
out changed "$changed"

if [ "${DRY_RUN:-false}" = "true" ]; then
  echo "Dry run: validation=$STATUS changed=$changed — opening nothing."
  git --no-pager diff --stat -- $DATA_FILES || true
  out outcome dry-run
  out pr ""
  out issue ""
  exit 0
fi

if [ "$STATUS" = "fail" ]; then
  # Keep the previous files: nothing from this run may be committed.
  git checkout -- $DATA_FILES || true
  body=$(mktemp)
  write_body "**Validation failed.** Nothing was committed and the previous files stay live." \
    "Either the source changed shape or a scrape came back partial. Fix the source or the validator (\`scripts/lib/validators.ts\` / \`src/data/_registry.ts\`), then re-run the workflow." > "$body"
  upsert_issue "Data refresh needs review: $TODAY" "$body"
  out outcome failed
  out pr ""
  exit 0
fi

if [ "$changed" = "false" ]; then
  echo "No data changes — nothing to commit."
  out outcome no-change
  out pr ""
  out issue ""
  exit 0
fi

# Captures fresh timestamps for the just-modified files via git log (full
# history: the workflows clone with fetch-depth 0). Committed alongside the
# data so Vercel's shallow-clone build has accurate dates without git log.
npx tsx scripts/build-freshness-manifest.ts

BRANCH="${PREFIX}${GITHUB_RUN_ID:-local}"
git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git checkout -b "$BRANCH"
git add $DATA_FILES src/data/_freshness.json
git commit -m "$TITLE"
git push origin "$BRANCH"

body=$(mktemp)
if [ "$STATUS" = "ok" ]; then
  write_body "Automated refresh. Merges itself once \`checks\` passes." \
    "Every dataset is within its band against \`main\`. A \`failure\` in the outcomes below means that dataset kept its previous values — the others still refreshed." > "$body"
  pr=$(gh pr create --title "$TITLE" --body-file "$body" --base main --head "$BRANCH")
  # Auto-merge rather than a blind `gh pr merge`: `checks` has to go green on
  # the data itself before this lands.
  gh pr merge "$BRANCH" --auto --squash --delete-branch
  out outcome auto-merge
  out pr "$pr"
  out issue ""
else
  ensure_label
  write_body "**Needs a look before merging.** A dataset moved outside its band (table below), so this PR does not auto-merge." \
    "If the change is real (a source republished, a big recall batch), merge it. If it is not, close this PR — the previous files stay live — and fix the source or the band in \`src/data/_registry.ts\`." > "$body"
  pr=$(gh pr create --title "$TITLE" --body-file "$body" --base main --head "$BRANCH" --label "$LABEL")
  issue_body=$(mktemp)
  write_body "**A data refresh needs a look.** PR: $pr" \
    "The PR is open without auto-merge. Merge it if the change is real; close it if it is not." > "$issue_body"
  upsert_issue "Data refresh needs review: $TODAY" "$issue_body"
  out outcome review-pr
  out pr "$pr"
fi
