import { makeRequest, makeToken, mockContext } from "../helpers/request";

jest.mock("@/lib/db/turso", () => ({
  queryOne: jest.fn(),
  execute: jest.fn().mockResolvedValue({ rowsAffected: 1 }),
}));

import { queryOne, execute } from "@/lib/db/turso";
import { POST } from "@/app/api/attendance/route";

const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>;
const mockExecute = execute as jest.MockedFunction<typeof execute>;

const teacher = {
  id: "user-1", name: "Mrs Adeola", email: "adeola@school.com",
  role: "class_teacher", school_id: "school-1", is_active: 1,
  first_name: "Adeola", last_name: "Bello", avatar: null,
  phone: null, admission_no: null, created_at: "2024-01-01", updated_at: "2024-01-01",
};

const mockSchool = {
  id: "school-1", name: "Test School", email: null, phone: null,
  state: "Lagos", type: "secondary", sub_domain: "test",
  address: null, subscription_status: "active", subscription_plan: "premium",
  academic_session: "2024/2025", current_term: "first",
};

const token = makeToken("user-1");

const validBody = {
  classId: "class-1",
  date: "2024-03-15",
  records: [
    { studentId: "student-1", status: "present" },
    { studentId: "student-2", status: "absent", notes: "Sick" },
  ],
};

describe("POST /api/attendance", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns 401 without token", async () => {
    const req = makeRequest("POST", "/api/attendance", { body: validBody });
    const res = await POST(req, mockContext);
    expect(res.status).toBe(401);
  });

  test("returns 403 when attendance service is not active", async () => {
    mockQueryOne
      .mockResolvedValueOnce(teacher)      // user lookup
      .mockResolvedValueOnce(mockSchool)   // school lookup
      .mockResolvedValueOnce(null);        // requireService: not active

    const req = makeRequest("POST", "/api/attendance", { token, body: validBody });
    const res = await POST(req, mockContext);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.message).toMatch(/attendance.*not active/i);
  });

  test("returns 400 when required fields are missing", async () => {
    mockQueryOne
      .mockResolvedValueOnce(teacher)
      .mockResolvedValueOnce(mockSchool)
      .mockResolvedValueOnce({ id: "ss-1" }); // service active

    const req = makeRequest("POST", "/api/attendance", {
      token,
      body: { classId: "class-1" }, // missing date and records
    });
    const res = await POST(req, mockContext);
    expect(res.status).toBe(400);
  });

  test("inserts new attendance records", async () => {
    mockQueryOne
      .mockResolvedValueOnce(teacher)
      .mockResolvedValueOnce(mockSchool)
      .mockResolvedValueOnce({ id: "ss-1" }) // service active
      .mockResolvedValueOnce(null)            // student-1: no existing record
      .mockResolvedValueOnce(null);           // student-2: no existing record

    const req = makeRequest("POST", "/api/attendance", { token, body: validBody });
    const res = await POST(req, mockContext);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.date).toBe("2024-03-15");
    // Two students → two INSERT calls
    expect(mockExecute).toHaveBeenCalledTimes(2);
  });

  test("updates existing attendance record instead of inserting", async () => {
    mockQueryOne
      .mockResolvedValueOnce(teacher)
      .mockResolvedValueOnce(mockSchool)
      .mockResolvedValueOnce({ id: "ss-1" })
      .mockResolvedValueOnce({ id: "att-existing" }) // student-1 already marked
      .mockResolvedValueOnce(null);                   // student-2 new

    const req = makeRequest("POST", "/api/attendance", { token, body: validBody });
    const res = await POST(req, mockContext);
    expect(res.status).toBe(200);
    // First call is UPDATE (existing), second is INSERT (new)
    const firstSql = mockExecute.mock.calls[0][0] as string;
    expect(firstSql).toMatch(/UPDATE/i);
    const secondSql = mockExecute.mock.calls[1][0] as string;
    expect(secondSql).toMatch(/INSERT/i);
  });

  test("uses school's current_term and academic_session as defaults", async () => {
    mockQueryOne
      .mockResolvedValueOnce(teacher)
      .mockResolvedValueOnce(mockSchool)
      .mockResolvedValueOnce({ id: "ss-1" })
      .mockResolvedValueOnce(null);

    const req = makeRequest("POST", "/api/attendance", {
      token,
      body: { classId: "class-1", date: "2024-03-15", records: [{ studentId: "s1", status: "present" }] },
    });
    await POST(req, mockContext);
    const insertArgs = mockExecute.mock.calls[0][1] as string[];
    expect(insertArgs).toContain("first");         // current_term
    expect(insertArgs).toContain("2024/2025");     // academic_session
  });
});
