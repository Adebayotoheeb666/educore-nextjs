import { makeRequest, makeToken, mockContext } from "../../helpers/request";
import { hashPassword } from "@/lib/utils/password";

jest.mock("@/lib/db/turso", () => ({
  queryOne: jest.fn(),
  execute: jest.fn().mockResolvedValue({ rowsAffected: 1 }),
}));

// Bypass rate limiting in unit tests
jest.mock("@/lib/middleware/rateLimit", () => ({
  withRateLimit: (_: unknown, handler: unknown) => handler,
  checkRateLimit: jest.fn().mockResolvedValue(null),
}));

import { queryOne, execute } from "@/lib/db/turso";
import { POST } from "@/app/api/auth/change-password/route";

const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>;
const mockExecute = execute as jest.MockedFunction<typeof execute>;

const token = makeToken("user-1");

const baseUser = {
  id: "user-1", name: "Test User", email: "user@test.com",
  role: "teacher", school_id: "school-1", is_active: 1,
  first_name: "Test", last_name: "User", avatar: null,
  phone: null, admission_no: null, created_at: "2024-01-01", updated_at: "2024-01-01",
};

describe("POST /api/auth/change-password", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns 401 without token", async () => {
    const req = makeRequest("POST", "/api/auth/change-password", {
      body: { currentPassword: "old", newPassword: "newpassword123" },
    });
    const res = await POST(req, mockContext);
    expect(res.status).toBe(401);
  });

  test("returns 400 when fields are missing", async () => {
    mockQueryOne.mockResolvedValueOnce(baseUser).mockResolvedValueOnce(null);
    const req = makeRequest("POST", "/api/auth/change-password", {
      token,
      body: { currentPassword: "old" }, // missing newPassword
    });
    const res = await POST(req, mockContext);
    expect(res.status).toBe(400);
  });

  test("returns 400 when new password is too short", async () => {
    mockQueryOne.mockResolvedValueOnce(baseUser).mockResolvedValueOnce(null);
    const req = makeRequest("POST", "/api/auth/change-password", {
      token,
      body: { currentPassword: "oldpassword", newPassword: "short" },
    });
    const res = await POST(req, mockContext);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toMatch(/8 characters/i);
  });

  test("returns 400 when current password is wrong", async () => {
    const hashed = await hashPassword("correct-password");
    mockQueryOne
      .mockResolvedValueOnce(baseUser)         // withAuth user lookup
      .mockResolvedValueOnce(null)             // no school (school_id check)
      .mockResolvedValueOnce({ password: hashed }); // password row

    const req = makeRequest("POST", "/api/auth/change-password", {
      token,
      body: { currentPassword: "wrong-password", newPassword: "newpassword123" },
    });
    const res = await POST(req, mockContext);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toMatch(/incorrect/i);
  });

  test("updates password on success", async () => {
    const hashed = await hashPassword("correct-password");
    mockQueryOne
      .mockResolvedValueOnce(baseUser)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ password: hashed });
    mockExecute.mockResolvedValueOnce({ rowsAffected: 1 });

    const req = makeRequest("POST", "/api/auth/change-password", {
      token,
      body: { currentPassword: "correct-password", newPassword: "newpassword123" },
    });
    const res = await POST(req, mockContext);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.message).toMatch(/updated/i);
    expect(mockExecute).toHaveBeenCalledTimes(1);
    // Verify it updates with a hashed password, not plain text
    const updateArgs = mockExecute.mock.calls[0][1] as string[];
    expect(updateArgs[0]).toMatch(/^\$2[ab]\$/); // bcrypt hash
  });
});
