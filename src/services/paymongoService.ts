const FUNCTION_URL = "/.netlify/functions/paymongo";

export async function createPaymentLink(
  amount: number,
  description: string,
  metadata: Record<string, string> = {}
) {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "createPaymentLink", amount, description, metadata }),
  });

  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error || "Failed to create payment link.");
  return json;
}

export async function getPaymentLinkStatus(linkId: string) {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "getPaymentLinkStatus", linkId }),
  });

  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.error || "Failed to fetch payment status.");
  return json;
}
