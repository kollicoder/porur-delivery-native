"""Budget kill-switch: disables billing on PROJECT_ID when costAmount >= budgetAmount.
Based on Google's documented 'Disable billing usage with notifications' sample."""
import base64, json, os
import functions_framework
from googleapiclient import discovery

PROJECT_ID = os.environ.get("PROJECT_ID", "study-vignes")
PROJECT_NAME = f"projects/{PROJECT_ID}"


def should_disable(data: dict) -> bool:
    return float(data.get("costAmount", 0)) >= float(data.get("budgetAmount", float("inf")))


@functions_framework.cloud_event
def stop_billing(cloud_event):
    data = json.loads(base64.b64decode(cloud_event.data["message"]["data"]).decode())
    cost, budget = data.get("costAmount"), data.get("budgetAmount")
    if not should_disable(data):
        print(f"No action: cost {cost} < budget {budget}")
        return
    billing = discovery.build("cloudbilling", "v1", cache_discovery=False)
    info = billing.projects().getBillingInfo(name=PROJECT_NAME).execute()
    if not info.get("billingEnabled"):
        print("Billing already disabled")
        return
    billing.projects().updateBillingInfo(name=PROJECT_NAME, body={"billingAccountName": ""}).execute()
    print(f"BILLING DISABLED for {PROJECT_ID}: cost {cost} >= budget {budget}")
