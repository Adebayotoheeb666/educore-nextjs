const BASE = "https://api.paystack.co";

function secretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

async function paystackFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  return res.json() as Promise<T>;
}

export interface PaystackInitResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data?: {
    id: number;
    status: string; // "success" | "failed" | "abandoned"
    reference: string;
    amount: number; // in kobo
    currency: string;
    paid_at: string;
    channel: string;
    customer: { email: string; name?: string };
    metadata?: Record<string, unknown>;
  };
}

export async function initializeTransaction(params: {
  email: string;
  amount: number; // in NAIRA — converted to kobo internally
  reference: string;
  callback_url?: string;
  metadata?: Record<string, unknown>;
}): Promise<PaystackInitResponse> {
  return paystackFetch("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({ ...params, amount: Math.round(params.amount * 100) }),
  });
}

export async function verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
  return paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`);
}
