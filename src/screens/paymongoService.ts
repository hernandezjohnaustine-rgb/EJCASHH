// services/paymongoService.ts
// Replace the values below with your actual PayMongo credentials and domain

const PAYMONGO_SECRET_KEY = "sk_live_BUwH1EadmPrGeNSnZ1SAPu9x"; // e.g. sk_live_xxxxxxxxxxxx
const APP_DOMAIN = "ejcashh.netlify.app"; // e.g. https://ejcashh.com

const PAYMONGO_API = "https://api.paymongo.com/v1";

const headers = {
  "Content-Type": "application/json",
  Authorization: `Basic ${btoa(PAYMONGO_SECRET_KEY + ":")}`,
};

// ─── Create a Payment Link ────────────────────────────────────────────────────
export async function createPaymentLink(
  amount: number,
  description: string,
  metadata: Record<string, string>
) {
  const response = await fetch(`${PAYMONGO_API}/links`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      data: {
        attributes: {
          amount: Math.round(amount * 100), // PayMongo uses centavos
          description,
          remarks: `Cash In for user ${metadata.userId}`,
          metadata,
        },
      },
    }),
  });

  const json = await response.json();

  if (!response.ok) {
    const msg = json?.errors?.[0]?.detail || "Failed to create payment link.";
    throw new Error(msg);
  }

  return json.data;
}

// ─── Get Payment Link Status ──────────────────────────────────────────────────
export async function getPaymentLinkStatus(linkId: string) {
  const response = await fetch(`${PAYMONGO_API}/links/${linkId}`, {
    method: "GET",
    headers,
  });

  const json = await response.json();

  if (!response.ok) {
    const msg = json?.errors?.[0]?.detail || "Failed to fetch payment status.";
    throw new Error(msg);
  }

  return json.data;
}

// ─── Create a GCash / Maya Source (for direct method redirect) ───────────────
export async function createSource(
  amount: number,
  type: "gcash" | "paymaya",
  userId: string
) {
  const response = await fetch(`${PAYMONGO_API}/sources`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      data: {
        attributes: {
          amount: Math.round(amount * 100),
          currency: "PHP",
          type,
          redirect: {
            success: `${APP_DOMAIN}/?payment_status=success&user_id=${userId}&amount=${amount}`,
            failed: `${APP_DOMAIN}/?payment_status=failed`,
          },
        },
      },
    }),
  });

  const json = await response.json();

  if (!response.ok) {
    const msg = json?.errors?.[0]?.detail || "Failed to create payment source.";
    throw new Error(msg);
  }

  return json.data;
}
