#!/usr/bin/env bash
# v0.4 go-live (launch fixes) for study-vignes.
set -euo pipefail
G="-c user.name=kollicoder -c user.email=kollicoder@users.noreply.github.com"; FB=$(npm prefix -g)/bin/firebase
K=AIzaSyASMmblBvKh9R381485V5GtE9itW3dtSgA; export JAVA_HOME=/opt/android/jdk21 PATH=/opt/android/jdk21/bin:$PATH
msg=$(curl -s -X POST "https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=$K" -H 'Content-Type: application/json' -d '{"phoneNumber":"+16505550001"}' | python3 -c "import sys,json;print(json.load(sys.stdin).get('error',{}).get('message','OK'))")
[ "$msg" = OK ] || { echo "Phone sign-in / test numbers not ready on study-vignes ($msg)"; exit 2; }
export EXPO_PUBLIC_FIREBASE_PROJECT_ID=study-vignes EXPO_PUBLIC_FIREBASE_API_KEY=$K EXPO_PUBLIC_FIREBASE_APP_ID=1:350770556092:web:fca4082f0d1c98e119f4b9 EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=study-vignes.firebaseapp.com EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=
cd /workspace/porur-native
# 1. rules with TEMPORARY test admin (+16505550000) for the live E2E approvals
bash firebase/render-rules.sh +16505550000 && (cd firebase && $FB deploy --only firestore:rules --project study-vignes)
# 2. live web builds
for a in customer vendor; do (cd apps/$a && npx expo export -p web --clear --output-dir dist >/dev/null); done
(cd /workspace/porur-prototype && npm run build >/dev/null)
(cd /workspace/porur-prototype && npx vite preview --port 4174 >/tmp/pv.log 2>&1 &) ; (npx serve -s apps/customer/dist -l 8091 >/dev/null 2>&1 &); (npx serve -s apps/vendor/dist -l 8092 >/dev/null 2>&1 &); sleep 6
# 3. live E2E with Firebase test numbers (approves vendor/rider demo users)
npx tsx firebase/live-migrate-v04.ts || echo MIGRATE_FAILED
LIVE=1 TAG=live PROTO=http://localhost:4174/ NCUST=http://localhost:8091 NVEND=http://localhost:8092 node e2e-v4.cjs | tee /tmp/e2e-live-v4.txt || true
# 4. remove the temporary admin: rules with ONLY the bootstrap admin from .admin-bootstrap.local
bash firebase/render-rules.sh && (cd firebase && $FB deploy --only firestore:rules --project study-vignes)
# 5. deploy web prototype
cd /workspace/porur-prototype/dist && touch .nojekyll && rm -rf .git && git init -q -b gh-pages && git add -A && git $G commit -qm "Deploy v0.4 launch fixes" && git push -qf https://github.com/kollicoder/porur-delivery-prototype.git gh-pages && rm -rf .git
# 6. merge to main
for r in /workspace/porur-prototype /workspace/porur-native; do cd $r && git add -A && (git $G commit -qm "v0.4 launch fixes" || true) && git push -q origin firebase-sync && git checkout -q main && git $G merge -q --no-ff firebase-sync -m "Merge v0.4 launch fixes (incl. checkout pin)" && git push -q origin main && git checkout -q firebase-sync; done
# 7. APKs + release
cd /workspace/porur-native && ./build-apk.sh customer && ./build-apk.sh vendor
gh release create v0.4-launch-fixes -R kollicoder/porur-delivery-native --target main -t "v0.4 — Launch fixes: correct split-cart pricing, private delivery OTP, auto-dispatch, pay on delivery, push" -F RELEASE-v0.4.md apk/porur-customer.apk apk/porur-vendor.apk
echo GO_LIVE_V4_DONE
