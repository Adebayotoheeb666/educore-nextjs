import crypto from "crypto";
import { NextRequest } from "next/server";

jest.mock("@/lib/db/turso", () => ({
  queryOne: jest.fn(),
  execute: jest.fn().mockResolvedValue({ rowsAffected: 1 }),
}));

import { queryOne, execute } from "@/lib/db/turso";
import { POST } from "@/app/api/payments/webhook/paystack/route";

const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>;
const mockExecute = execute as jest.MockedFunction<typeof execute>;

const PAYSTACK_SECRET = "test-paystack-secret";

function makeWebhookRequest(payload: unknown, signature?: string): NextRequest {
  const body = JSON.stringify(payload);
  const sig =
    signature ??
    crypto.createHmac("sha512", PAYSTACK_SECRET).update(body).digest("hex");

  return new NextRequest("http://localhost:3000/api/payments/webhook/paystack", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-paystack-signature": sig,
    },
    body,
  });
}

const validEvent = {
  event: "charge.success",
  data: {
    reference: "EDU-REF-12345",
    amount: 5000000, // 50,000 NGN in kobo
    paid_at: "2024-03-01T10:00:00Z",
    channel: "card",
    metadata: {
      school_id: "school-1",
      fee_id: "fee-1",
      student_id: "student-1",
    },
  },
};

describe("POST /api/payments/webhook/paystack", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PAYSTACK_SECRET_KEY = PAYSTACK_SECRET;
  });

  afterEach(() => {
    delete process.env.PAYSTACK_SECRET_KEY;
  });

  test("returns 401 for invalid signature", async () => {
    const req = makeWebhookRequest(validEvent, "invalid-signature");
    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toBe("Invalid signature");
  });

  test("returns 500 when PAYSTACK_SECRET_KEY is not set", async () => {
    delete process.env.PAYSTACK_SECRET_KEY;
    const req = makeWebhookRequest(validEvent);
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  test("records payment for charge.success event", async () => {
    mockQueryOne.mockResolvedValueOnce(null); // no existing payment
    const req = makeWebhookRequest(validEvent);
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(mockExecute).toHaveBeenCalledTimes(1);
    // Verify amount is converted from kobo to naira
    const insertArgs = mockExecute.mock.calls[0][1];
    expect(insertArgs).toContain(50000); // 5000000 / 100
    expect(insertArgs).toContain("EDU-REF-12345");
  });

  test("is idempotent — skips insert if reference already exists", async () => {
    mockQueryOne.mockResolvedValueOnce({ id: "existing-payment" });
    const req = makeWebhookRequest(validEvent);
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockExecute).not.toHaveBeenCalled();
  });

  test("ignores unknown event types gracefully", async () => {
    const req = makeWebhookRequest({ event: "transfer.success", data: {} });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockExecute).not.toHaveBeenCalled();
  });

  test("skips insert if metadata is missing required fields", async () => {
    mockQueryOne.mockResolvedValueOnce(null);
    const incompleteEvent = {
      event: "charge.success",
      data: {
        reference: "EDU-NO-META",
        amount: 1000000,
        paid_at: "2024-03-01T10:00:00Z",
        channel: "bank",
        metadata: {}, // missing school_id, fee_id, student_id
      },
    };
    const req = makeWebhookRequest(incompleteEvent);
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockExecute).not.toHaveBeenCalled();
  });
});
