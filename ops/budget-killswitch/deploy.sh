#!/usr/bin/env bash
set -euo pipefail
P=study-vignes; SA=budget-killswitch@$P.iam.gserviceaccount.com
gcloud iam service-accounts create budget-killswitch --project $P || true
gcloud projects add-iam-policy-binding $P --member serviceAccount:$SA --role roles/billing.projectManager --condition=None -q >/dev/null
gcloud functions deploy budget-killswitch --gen2 --project $P --region asia-south1 --runtime python312 \
  --source . --entry-point stop_billing --trigger-topic budget-killswitch --service-account $SA \
  --set-env-vars PROJECT_ID=$P --max-instances 1 --memory 256Mi
gcloud run services add-iam-policy-binding budget-killswitch --region asia-south1 --project $P --member serviceAccount:$SA --role roles/run.invoker -q  # trigger SA (same as $SA if set)
