#!/usr/bin/env bash
# One-shot go-live for study-vignes. Run after enabling Anonymous sign-in in the Firebase console.
set -euo pipefail
G="-c user.name=kollicoder -c user.email=kollicoder@users.noreply.github.com"
K=AIzaSyASMmblBvKh9R381485V5GtE9itW3dtSgA
msg=$(curl -s -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=$K" -H 'Content-Type: application/json' -d '{"returnSecureToken":true}' | python3 -c "import sys,json;print(json.load(sys.stdin).get('error',{}).get('message','OK'))")
[ "$msg" = OK ] || { echo "Anonymous auth not enabled yet ($msg)"; exit 2; }
export EXPO_PUBLIC_FIREBASE_PROJECT_ID=study-vignes EXPO_PUBLIC_FIREBASE_API_KEY=$K EXPO_PUBLIC_FIREBASE_APP_ID=1:350770556092:web:fca4082f0d1c98e119f4b9 EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=study-vignes.firebaseapp.com EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=
cd /workspace/porur-native
(cd firebase && $(npm prefix -g)/bin/firebase deploy --only firestore:rules --project study-vignes)
npx tsx firebase/seed.ts
for a in customer vendor; do (cd apps/$a && npx expo export -p web --output-dir dist >/dev/null); done
# web prototype: build live, deploy gh-pages
cd /workspace/porur-prototype && npm run build >/dev/null
cd dist && touch .nojekyll && rm -rf .git && git init -q -b gh-pages && git add -A && git $G commit -qm "Deploy live Firebase sync" && git push -qf https://github.com/kollicoder/porur-delivery-prototype.git gh-pages && rm -rf .git
# merge branches to main
for r in /workspace/porur-prototype /workspace/porur-native; do cd $r && git add -A && (git $G commit -qm "Go live on Firebase study-vignes" || true) && git push -q origin firebase-sync && git checkout -q main && git $G merge -q --no-ff firebase-sync -m "Merge firebase-sync" && git push -q origin main && git checkout -q firebase-sync; done
echo GO_LIVE_DONE
