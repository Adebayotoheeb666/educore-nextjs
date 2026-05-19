import { makeRequest } from "../../helpers/request";
import { hashPassword } from "@/lib/utils/password";

// Mock the DB before importing the route
jest.mock("@/lib/db/turso", () => ({
  queryOne: jest.fn(),
  execute: jest.fn().mockResolvedValue({ rowsAffected: 1 }),
}));

// Bypass rate limiting in unit tests
jest.mock("@/lib/middleware/rateLimit", () => ({
  withRateLimit: (_: unknown, handler: unknown) => handler,
  checkRateLimit: jest.fn().mockResolvedValue(null),
}));

import { queryOne } from "@/lib/db/turso";
import { POST } from "@/app/api/auth/login/route";

const mockQueryOne = queryOne as jest.MockedFunction<typeof queryOne>;

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 400 when email or password missing", async () => {
    const req = makeRequest("POST", "/api/auth/login", { body: { email: "a@b.com" } });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toMatch(/email and password/i);
  });

  test("returns 400 for non-existent user", async () => {
    mockQueryOne.mockResolvedValueOnce(null);
    const req = makeRequest("POST", "/api/auth/login", {
      body: { email: "nobody@test.com", password: "pass" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toBe("Invalid email or password");
  });

  test("returns 400 for wrong password", async () => {
    const hashed = await hashPassword("correct-password");
    mockQueryOne.mockResolvedValueOnce({
      id: "u1", name: "Test User", first_name: "Test", last_name: "User",
      email: "user@test.com", password: hashed, role: "teacher",
      avatar: null, is_active: 1,
    });
    const req = makeRequest("POST", "/api/auth/login", {
      body: { email: "user@test.com", password: "wrong-password" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toBe("Invalid email or password");
  });

  test("returns user data and token on successful login", async () => {
    const hashed = await hashPassword("correct-password");
    mockQueryOne.mockResolvedValueOnce({
      id: "u1", name: "Test User", first_name: "Test", last_name: "User",
      email: "user@test.com", password: hashed, role: "teacher",
      avatar: null, is_active: 1,
    });
    const req = makeRequest("POST", "/api/auth/login", {
      body: { email: "user@test.com", password: "correct-password" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.email).toBe("user@test.com");
    expect(body.role).toBe("teacher");
    expect(typeof body.token).toBe("string");
  });

  test("returns 401 for deactivated account", async () => {
    const hashed = await hashPassword("pass");
    mockQueryOne.mockResolvedValueOnce({
      id: "u2", name: "Disabled", first_name: null, last_name: null,
      email: "disabled@test.com", password: hashed, role: "teacher",
      avatar: null, is_active: 0,
    });
    const req = makeRequest("POST", "/api/auth/login", {
      body: { email: "disabled@test.com", password: "pass" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  test("normalizes email to lowercase", async () => {
    mockQueryOne.mockResolvedValueOnce(null);
    const req = makeRequest("POST", "/api/auth/login", {
      body: { email: "USER@TEST.COM", password: "pass" },
    });
    await POST(req);
    expect(mockQueryOne).toHaveBeenCalledWith(
      expect.any(String),
      ["user@test.com"]
    );
  });
});
