#!/usr/bin/env bash
# v0.5 go-live (new UI, frontend only) for study-vignes.
set -euo pipefail
G="-c user.name=kollicoder -c user.email=kollicoder@users.noreply.github.com"; FB=$(npm prefix -g)/bin/firebase
K=AIzaSyASMmblBvKh9R381485V5GtE9itW3dtSgA; export JAVA_HOME=/opt/android/jdk21 PATH=/opt/android/jdk21/bin:$PATH
msg=$(curl -s -X POST "https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=$K" -H 'Content-Type: application/json' -d '{"phoneNumber":"+919000000001"}' | python3 -c "import sys,json;print(json.load(sys.stdin).get('error',{}).get('message','OK'))")
[ "$msg" = OK ] || { echo "Phone sign-in / test numbers not ready on study-vignes ($msg)"; exit 2; }
export EXPO_PUBLIC_FIREBASE_PROJECT_ID=study-vignes EXPO_PUBLIC_FIREBASE_API_KEY=$K EXPO_PUBLIC_FIREBASE_APP_ID=1:350770556092:web:fca4082f0d1c98e119f4b9 EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=study-vignes.firebaseapp.com EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=
cd /workspace/porur-native
# 1. rules with TEMPORARY test admin (+919000000000) for the live E2E approvals
bash firebase/render-rules.sh +919000000000 && (cd firebase && $FB deploy --only firestore:rules --project study-vignes)
# 2. live web builds
for a in customer vendor; do (cd apps/$a && npx expo export -p web --clear --output-dir dist >/dev/null); done
(cd /workspace/porur-prototype && npm run build >/dev/null)
(cd /workspace/porur-prototype && npx vite preview --port 4174 >/tmp/pv.log 2>&1 &) ; (npx serve -s apps/customer/dist -l 8091 >/dev/null 2>&1 &); (npx serve -s apps/vendor/dist -l 8092 >/dev/null 2>&1 &); sleep 6
# 3. live E2E with Firebase test numbers (approves vendor/rider demo users)
true
LIVE=1 TAG=v5-live PROTO=http://localhost:4174/ NCUST=http://localhost:8091 NVEND=http://localhost:8092 node e2e-v4.cjs | tee /tmp/e2e-live-v5.txt || true
# 4. remove the temporary admin: rules with ONLY the bootstrap admin from .admin-bootstrap.local
bash firebase/render-rules.sh && (cd firebase && $FB deploy --only firestore:rules --project study-vignes)
grep -q '^FAIL\|E2E error' /tmp/e2e-live-v5.txt && { echo E2E_LIVE_FAILED; exit 3; }
mkdir -p screenshots/v5/e2e-live && mv screenshots/v4/v5-live-*.png screenshots/v5/e2e-live/ 2>/dev/null || true
# 5. deploy web prototype
cd /workspace/porur-prototype/dist && touch .nojekyll && rm -rf .git && git init -q -b gh-pages && git add -A && git $G commit -qm "Deploy v0.5 new UI" && git push -qf https://github.com/kollicoder/porur-delivery-prototype.git gh-pages && rm -rf .git
# 6. commit ui-v5 and merge to main
for r in /workspace/porur-prototype /workspace/porur-native; do cd $r && git add -A && (git $G commit -qm "v0.5 new UI (frontend only)" || true) && git push -q origin ui-v5 && git checkout -q main && git $G merge -q --no-ff ui-v5 -m "Merge v0.5 new UI" && git push -q origin main && git checkout -q ui-v5; done
# 7. APKs + release
cd /workspace/porur-native && rm -rf apps/customer/android apps/vendor/android && ./build-apk.sh customer && ./build-apk.sh vendor
gh release create v0.5-new-ui -R kollicoder/porur-delivery-native --target main -t "v0.5 — New UI (ding-dong design, frontend only)" -F RELEASE-v0.5.md apk/porur-customer.apk apk/porur-vendor.apk
echo GO_LIVE_V5_DONE
