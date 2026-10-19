#!/usr/bin/env bash
# Clean emulator → seed → v0.5 rules checks → v0.6 rules checks. Usage: FS_PORT=8085 bash firebase/test-emu-v6.sh
set -uo pipefail; cd "$(dirname "$0")/.."; P=${FS_PORT:-8080}
curl -s -X DELETE "http://localhost:$P/emulator/v1/projects/demo-porur/databases/(default)/documents" >/dev/null
curl -s -X DELETE "http://localhost:9099/emulator/v1/projects/demo-porur/accounts" >/dev/null
FIRESTORE_EMULATOR_HOST=localhost:$P npx tsx firebase/seed.ts
EXPO_PUBLIC_FIRESTORE_EMULATOR_PORT=$P npx tsx firebase/rules-check.ts 2>/dev/null | grep -E '^(PASS|FAIL|ALL|[0-9]+ FAILED)' > /tmp/rules-v5.txt; r1=${PIPESTATUS[0]}
EXPO_PUBLIC_FIRESTORE_EMULATOR_PORT=$P npx tsx firebase/rules-check-v6.ts 2>/dev/null | grep -E '^(PASS|FAIL|—|ALL|ERR|[0-9]+ of)' > /tmp/rules-v6.txt; r2=${PIPESTATUS[0]}
echo "v0.5 rules: $(grep -c ^PASS /tmp/rules-v5.txt) pass, $(grep -c ^FAIL /tmp/rules-v5.txt) fail · v0.6 rules: $(grep -c ^PASS /tmp/rules-v6.txt) pass, $(grep -c ^FAIL /tmp/rules-v6.txt) fail"
grep -E '^(FAIL|ERR)' /tmp/rules-v5.txt /tmp/rules-v6.txt; exit $(( r1 || r2 ))
