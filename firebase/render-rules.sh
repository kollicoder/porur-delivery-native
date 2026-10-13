#!/usr/bin/env bash
# Renders firestore.rules from the template, injecting admin phone(s) from .admin-bootstrap.local (not committed).
# Usage: render-rules.sh [extra_admin_phone]   (extra = optional temporary admin, e.g. a test number for E2E)
set -euo pipefail; cd "$(dirname "$0")"
[ -f .admin-bootstrap.local ] || { echo "missing firebase/.admin-bootstrap.local (BOOTSTRAP_ADMIN_PHONE=+91...)"; exit 1; }
. ./.admin-bootstrap.local
phones="'$BOOTSTRAP_ADMIN_PHONE'"; [ -n "${1:-}" ] && phones="$phones, '$1'"
sed "s|__ADMIN_PHONES__|$phones|" firestore.rules.template > firestore.rules
echo "rendered firestore.rules with admins: $phones"
