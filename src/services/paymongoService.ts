const BASE_URL = "/api/paymongo";

// ✅ Create payment link for any amount
export async function createPaymentLink(
  amount: number,
  description: string,
  metadata: Record<string, string> = {}
) {
  const response = await fetch(`${BASE_URL}/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: {
        attributes: {
          amount: Math.round(amount * 100), // centavos
          description,
          remarks: "EJCASHH",
          metadata,
        },
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.errors?.[0]?.detail || "PayMongo error");
  return data.data;
}

// ✅ Check payment link status
export async function getPaymentLinkStatus(linkId: string) {
  const response = await fetch(`${BASE_URL}/links/${linkId}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.errors?.[0]?.detail || "PayMongo error");
  return data.data;
}
