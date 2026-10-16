# Budget kill-switch (study-vignes)
Budget "study-vignes INR1000 cap" (₹1000/month, alerts 50/90/100%) publishes to Pub/Sub topic `budget-killswitch`.
Cloud Function (gen2) `budget-killswitch` unlinks the billing account when costAmount >= budgetAmount.
Effect: SMS OTP and all Blaze features stop until billing is re-linked in Console → Billing → Account management.
Runs as SA `budget-killswitch@study-vignes.iam.gserviceaccount.com` with roles/billing.projectManager on the project only.
Deploy: see deploy.sh
