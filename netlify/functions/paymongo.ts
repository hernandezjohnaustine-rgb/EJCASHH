// netlify/functions/paymongo.ts
// Netlify serverless function — runs server-side, no CORS issues

import type { Handler } from "@netlify/functions";

const PAYMONGO_SECRET_KEY = process.env.PAYMONGO_SECRET_KEY!;
const PAYMONGO_API = "https://api.paymongo.com/v1";

const authHeader = `Basic ${Buffer.from(PAYMONGO_SECRET_KEY + ":").toString("base64")}`;

const handler: Handler = async (event) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  const body = event.body ? JSON.parse(event.body) : {};
  const action = body.action;

  try {
    // ── Create Payment Link ─────────────────────────────────────────────
    if (action === "createPaymentLink") {
      const { amount, description, metadata } = body;

      const res = await fetch(`${PAYMONGO_API}/links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          data: {
            attributes: {
              amount: Math.round(amount * 100), // centavos
              description,
              remarks: `Cash In for user ${metadata?.userId || "unknown"}`,
              metadata,
            },
          },
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        const msg = (json as any)?.errors?.[0]?.detail || "Failed to create payment link.";
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: msg }) };
      }

      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify((json as any).data) };
    }

    // ── Get Payment Link Status ─────────────────────────────────────────
    if (action === "getPaymentLinkStatus") {
      const { linkId } = body;

      const res = await fetch(`${PAYMONGO_API}/links/${linkId}`, {
        method: "GET",
        headers: { Authorization: authHeader },
      });

      const json = await res.json();
      if (!res.ok) {
        const msg = (json as any)?.errors?.[0]?.detail || "Failed to fetch payment status.";
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: msg }) };
      }

      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify((json as any).data) };
    }

    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Unknown action" }) };

  } catch (err: any) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: err.message }) };
  }
};

export { handler };
