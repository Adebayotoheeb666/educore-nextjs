import { makeRequest, makeToken, mockContext } from "../helpers/request";

jest.mock("@/lib/db/turso", () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  execute: jest.fn().mockResolvedValue({ rowsAffected: 1 }),
}));

import { query, queryOne, execute } from "@/lib/db/turso";
import { GET, POST } from "@/app/api/fees/route";

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>;
const mockExecute = execute as jest.MockedFunction<typeof execute>;

const adminUser = {
  id: "user-1", name: "Principal Test", email: "principal@school.com",
  role: "principal", school_id: "school-1", is_active: 1,
  first_name: "Principal", last_name: "Test", avatar: null, phone: null,
  admission_no: null, created_at: "2024-01-01", updated_at: "2024-01-01",
};

const mockSchool = {
  id: "school-1", name: "Test School", email: null, phone: null,
  state: "Lagos", type: "secondary", sub_domain: "testschool",
  address: null, subscription_status: "active", subscription_plan: "premium",
  academic_session: "2024/2025", current_term: "first",
};

const token = makeToken("user-1");

describe("GET /api/fees", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns 401 without token", async () => {
    const req = makeRequest("GET", "/api/fees");
    const res = await GET(req, mockContext);
    expect(res.status).toBe(401);
  });

  test("returns fee list for authenticated principal", async () => {
    // Call order: 1=user lookup, 2=school lookup, 3=requireService check, then fees query
    mockQueryOne
      .mockResolvedValueOnce(adminUser)          // withAuth: user lookup
      .mockResolvedValueOnce(mockSchool)          // withAuth: school lookup
      .mockResolvedValueOnce({ id: "ss-1" });    // requireService: active service check
    mockQuery.mockResolvedValueOnce([
      { id: "fee-1", name: "School Fees", amount: 50000, class_name: "JSS 1" },
      { id: "fee-2", name: "PTA Levy", amount: 5000, class_name: null },
    ]);

    const req = makeRequest("GET", "/api/fees", { token });
    const res = await GET(req, mockContext);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(2);
    expect(body.data[0].name).toBe("School Fees");
  });
});

describe("POST /api/fees", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns 400 when title is missing", async () => {
    mockQueryOne
      .mockResolvedValueOnce(adminUser)
      .mockResolvedValueOnce(mockSchool)
      .mockResolvedValueOnce({ id: "ss-1" }); // requireService check

    const req = makeRequest("POST", "/api/fees", {
      token,
      body: { totalAmount: 50000 }, // missing title
    });
    const res = await POST(req, mockContext);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toMatch(/title/i);
  });

  test("creates fee and returns 201 with id", async () => {
    mockQueryOne
      .mockResolvedValueOnce(adminUser)
      .mockResolvedValueOnce(mockSchool)
      .mockResolvedValueOnce({ id: "ss-1" }); // requireService check
    mockExecute.mockResolvedValueOnce({ rowsAffected: 1 });

    const req = makeRequest("POST", "/api/fees", {
      token,
      body: { title: "Exam Fees", totalAmount: 15000, classId: "class-1" },
    });
    const res = await POST(req, mockContext);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.name).toBe("Exam Fees");
    expect(typeof body.data.id).toBe("string");
    expect(mockExecute).toHaveBeenCalledTimes(1);
  });

  test("student role is rejected (403)", async () => {
    const studentUser = { ...adminUser, role: "student" };
    mockQueryOne
      .mockResolvedValueOnce(studentUser)
      .mockResolvedValueOnce(mockSchool);

    const req = makeRequest("POST", "/api/fees", {
      token,
      body: { title: "Fees", totalAmount: 10000 },
    });
    const res = await POST(req, mockContext);
    expect(res.status).toBe(403);
  });
});
