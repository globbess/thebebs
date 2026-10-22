#!/bin/sh
# Publishes the site to GitHub Pages (thebebs.com): ./publish.sh "what changed"
#
# The public repository (github.com/globbess/thebebs) gets a clean history of
# its own: each publish is one commit with the current files, signed with
# GitHub's private no-reply address. The full working history, which has
# personal details in it, stays on this computer only.
set -e
cd "$(dirname "$0")"
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Save (commit) your changes first, then publish."; exit 1
fi
NAME="andysz"
EMAIL="80144627+globbess@users.noreply.github.com"
TREE=$(git rev-parse "HEAD^{tree}")
# build on whatever is on GitHub now (GitHub itself sometimes adds a commit, e.g. when the domain is re-saved)
git fetch -q origin main 2>/dev/null || true
PARENT=$(git rev-parse --verify -q refs/remotes/origin/main || git rev-parse --verify -q refs/heads/live || true)
if [ -n "$PARENT" ] && [ "$(git rev-parse "$PARENT^{tree}")" = "$TREE" ]; then
  echo "Nothing new to publish."; exit 0
fi
COMMIT=$(GIT_AUTHOR_NAME="$NAME" GIT_AUTHOR_EMAIL="$EMAIL" GIT_COMMITTER_NAME="$NAME" GIT_COMMITTER_EMAIL="$EMAIL" \
  git commit-tree "$TREE" ${PARENT:+-p "$PARENT"} -m "${1:-Update the site}")
git update-ref refs/heads/live "$COMMIT"
git push origin live:main
echo "Published. thebebs.com updates within a minute or two."
