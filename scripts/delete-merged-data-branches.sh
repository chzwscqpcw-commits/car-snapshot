#!/usr/bin/env bash
# Delete this workflow's own data branches once their PR has merged.
#
# Usage: scripts/delete-merged-data-branches.sh <branch-prefix>
#   e.g. data-refresh/   or   data-prices/
#
# Why: the refresh workflows open a PR per run and land it with
# `gh pr merge --auto --squash --delete-branch`. With --auto the merge happens
# later, after CI, so --delete-branch has nothing to delete at the time — and
# the repo's "automatically delete head branches" setting doesn't fire for
# merges made with the Actions token. Twelve merged branches had piled up by
# 2026-10-11. Each run now sweeps up the previous runs' branches.
#
# Deletes ONLY branches that start with the given prefix AND whose PR is
# merged; open or unmerged branches are left alone. Never fails the job.
set -uo pipefail

prefix="${1:?branch prefix required}"
repo="${GITHUB_REPOSITORY:?GITHUB_REPOSITORY not set}"
deleted=0

branches=$(gh api --paginate "repos/${repo}/branches" -q '.[].name' 2>/dev/null | awk -v p="$prefix" 'index($0, p) == 1' || true)
for branch in $branches; do
  merged=$(gh pr list --repo "$repo" --state merged --head "$branch" --json number -q '.[0].number' 2>/dev/null || true)
  if [ -n "$merged" ]; then
    if gh api -X DELETE "repos/${repo}/git/refs/heads/${branch}" >/dev/null 2>&1; then
      echo "deleted ${branch} (PR #${merged} merged)"
      deleted=$((deleted + 1))
    else
      echo "could not delete ${branch}"
    fi
  fi
done
echo "merged ${prefix}* branches deleted: ${deleted}"
exit 0
