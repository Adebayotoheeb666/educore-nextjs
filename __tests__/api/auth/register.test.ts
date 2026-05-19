import { makeRequest } from "../../helpers/request";

jest.mock("@/lib/db/turso", () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
  execute: jest.fn().mockResolvedValue({ rowsAffected: 1 }),
}));

jest.mock("@/lib/services/seedServices", () => ({
  seedServices: jest.fn().mockResolvedValue(undefined),
  activateCompulsoryServices: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/config/services/catalog", () => ({
  getServiceBySlug: jest.fn().mockReturnValue(null),
  validateDependencies: jest.fn().mockReturnValue([]),
}));

import { query, execute } from "@/lib/db/turso";
import { POST } from "@/app/api/auth/register/route";

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockExecute = execute as jest.MockedFunction<typeof execute>;

const validBody = {
  firstName: "John",
  lastName: "Okonkwo",
  schoolName: "Lagos Academy",
  email: "john@lagos.edu.ng",
  phoneNumber: "+2348012345678",
  password: "securepassword123",
};

describe("POST /api/auth/register", () => {
  beforeEach(() => jest.clearAllMocks());

  test("returns 400 when required fields are missing", async () => {
    const req = makeRequest("POST", "/api/auth/register", {
      body: { email: "test@test.com", password: "password123" }, // missing schoolName + name
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toMatch(/required fields/i);
  });

  test("returns 409 when email is already registered", async () => {
    mockQuery.mockResolvedValueOnce([{ id: "existing-user" }]); // email taken
    const req = makeRequest("POST", "/api/auth/register", { body: validBody });
    const res = await POST(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.message).toMatch(/already been registered/i);
  });

  test("creates school and user, returns 201 with token on success", async () => {
    mockQuery.mockResolvedValueOnce([]); // no existing email
    mockExecute
      .mockResolvedValueOnce({ rowsAffected: 1 }) // INSERT school
      .mockResolvedValueOnce({ rowsAffected: 1 }) // INSERT user
      .mockResolvedValueOnce({ rowsAffected: 1 }); // UPDATE school owner_id

    const req = makeRequest("POST", "/api/auth/register", { body: validBody });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.email).toBe("john@lagos.edu.ng");
    expect(body.role).toBe("school_owner");
    expect(typeof body.token).toBe("string");
  });

  test("normalizes email to lowercase", async () => {
    mockQuery.mockResolvedValueOnce([{ id: "existing" }]);
    const req = makeRequest("POST", "/api/auth/register", {
      body: { ...validBody, email: "JOHN@LAGOS.EDU.NG" },
    });
    await POST(req);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.any(String),
      ["john@lagos.edu.ng"]
    );
  });

  test("derives name from firstName + lastName when name is absent", async () => {
    mockQuery.mockResolvedValueOnce([]);
    mockExecute
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rowsAffected: 1 });

    const req = makeRequest("POST", "/api/auth/register", { body: validBody });
    const res = await POST(req);
    const body = await res.json();
    expect(body.name).toBe("John Okonkwo");
  });

  test("sets auth cookie on successful registration", async () => {
    mockQuery.mockResolvedValueOnce([]);
    mockExecute
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rowsAffected: 1 })
      .mockResolvedValueOnce({ rowsAffected: 1 });

    const req = makeRequest("POST", "/api/auth/register", { body: validBody });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const cookie = res.headers.get("set-cookie");
    expect(cookie).toBeTruthy();
  });
});
