import { makeRequest, makeToken, mockContext } from "../../helpers/request";

jest.mock("@/lib/db/turso", () => ({
  queryOne: jest.fn(),
  execute: jest.fn().mockResolvedValue({ rowsAffected: 1 }),
}));

jest.mock("@/lib/services/payments/paystack", () => ({
  verifyTransaction: jest.fn(),
}));

import { queryOne, execute } from "@/lib/db/turso";
import { verifyTransaction } from "@/lib/services/payments/paystack";
import { GET } from "@/app/api/payments/verify/route";

const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>;
const mockExecute = execute as jest.MockedFunction<typeof execute>;
const mockVerify = verifyTransaction as jest.MockedFunction<typeof verifyTransaction>;

const token = makeToken("user-1");

const bursar = {
  id: "user-1", name: "Mr Bursar", email: "bursar@school.com",
  role: "bursar", school_id: "school-1", is_active: 1,
  first_name: "Mr", last_name: "Bursar", avatar: null,
  phone: null, admission_no: null, created_at: "2024-01-01", updated_at: "2024-01-01",
};

const mockSchool = {
  id: "school-1", name: "Test School", email: null, phone: null,
  state: "Lagos", type: "secondary", sub_domain: "test",
  address: null, subscription_status: "active", subscription_plan: "premium",
  academic_session: "2024/2025", current_term: "first",
};

const successfulPaystackResponse = {
  status: true,
  message: "Verification successful",
  data: {
    status: "success",
    reference: "EDU-REF-12345",
    amount: 5000000, // 50,000 NGN in kobo
    paid_at: "2024-03-01T10:00:00Z",
    channel: "card",
    metadata: { fee_id: "fee-1", student_id: "student-1" },
  },
};

describe("GET /api/payments/verify", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns 401 without token", async () => {
    const req = makeRequest("GET", "/api/payments/verify?reference=EDU-123");
    const res = await GET(req, mockContext);
    expect(res.status).toBe(401);
  });

  test("returns 403 when payments service is not active", async () => {
    mockQueryOne
      .mockResolvedValueOnce(bursar)
      .mockResolvedValueOnce(mockSchool)
      .mockResolvedValueOnce(null); // service not active

    const req = makeRequest("GET", "/api/payments/verify?reference=EDU-123", { token });
    const res = await GET(req, mockContext);
    expect(res.status).toBe(403);
  });

  test("returns 400 when reference is missing", async () => {
    mockQueryOne
      .mockResolvedValueOnce(bursar)
      .mockResolvedValueOnce(mockSchool)
      .mockResolvedValueOnce({ id: "ss-1" });

    const req = makeRequest("GET", "/api/payments/verify", { token }); // no reference param
    const res = await GET(req, mockContext);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toMatch(/reference/i);
  });

  test("verifies transaction and records payment when new", async () => {
    mockQueryOne
      .mockResolvedValueOnce(bursar)
      .mockResolvedValueOnce(mockSchool)
      .mockResolvedValueOnce({ id: "ss-1" }) // service active
      .mockResolvedValueOnce(null);           // no existing payment
    mockVerify.mockResolvedValueOnce(successfulPaystackResponse as never);

    const req = makeRequest("GET", "/api/payments/verify?reference=EDU-REF-12345", { token });
    const res = await GET(req, mockContext);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.verified).toBe(true);
    expect(body.data.amount).toBe(50000); // kobo → naira
    expect(body.data.alreadyRecorded).toBe(false);
    expect(mockExecute).toHaveBeenCalledTimes(1);
  });

  test("is idempotent — skips insert when payment already recorded", async () => {
    mockQueryOne
      .mockResolvedValueOnce(bursar)
      .mockResolvedValueOnce(mockSchool)
      .mockResolvedValueOnce({ id: "ss-1" })
      .mockResolvedValueOnce({ id: "pay-existing" }); // already in DB
    mockVerify.mockResolvedValueOnce(successfulPaystackResponse as never);

    const req = makeRequest("GET", "/api/payments/verify?reference=EDU-REF-12345", { token });
    const res = await GET(req, mockContext);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.alreadyRecorded).toBe(true);
    expect(mockExecute).not.toHaveBeenCalled();
  });

  test("returns verified: false for failed payment", async () => {
    mockQueryOne
      .mockResolvedValueOnce(bursar)
      .mockResolvedValueOnce(mockSchool)
      .mockResolvedValueOnce({ id: "ss-1" });
    mockVerify.mockResolvedValueOnce({
      status: true,
      message: "Verification successful",
      data: { status: "failed", reference: "EDU-FAIL", amount: 0, paid_at: null, channel: null, metadata: null },
    } as never);

    const req = makeRequest("GET", "/api/payments/verify?reference=EDU-FAIL", { token });
    const res = await GET(req, mockContext);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.verified).toBe(false);
    expect(mockExecute).not.toHaveBeenCalled();
  });
});
