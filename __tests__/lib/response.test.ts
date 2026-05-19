import { ok, okList, created, badRequest, unauthorized, forbidden, notFound, conflict, serverError } from "@/lib/utils/response";

describe("response helpers", () => {
  test("ok wraps data with success envelope and 200 status", async () => {
    const res = ok({ id: "1", name: "Test" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ data: { id: "1", name: "Test" }, success: true });
  });

  test("ok accepts custom status", async () => {
    const res = ok({}, 202);
    expect(res.status).toBe(202);
  });

  test("okList includes meta and pagination headers", async () => {
    const items = [{ id: "1" }, { id: "2" }];
    const res = okList(items, 50, 2, 10);
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Total-Count")).toBe("50");
    expect(res.headers.get("X-Page")).toBe("2");
    expect(res.headers.get("X-Page-Size")).toBe("10");
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.meta).toEqual({ total: 50, page: 2, pageSize: 10, pages: 5 });
    expect(body.data).toHaveLength(2);
  });

  test("created wraps data with 201 status", async () => {
    const res = created({ id: "abc" });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual({ data: { id: "abc" }, success: true });
  });

  test("badRequest returns 400 with message", async () => {
    const res = badRequest("name is required");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toBe("name is required");
    expect(body.success).toBeUndefined();
  });

  test("unauthorized returns 401 with default message", async () => {
    const res = unauthorized();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.message).toBe("Not authorized, please login");
  });

  test("forbidden returns 403", async () => {
    const res = forbidden("Access denied");
    expect(res.status).toBe(403);
  });

  test("notFound returns 404", async () => {
    const res = notFound();
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.message).toBe("Not found");
  });

  test("conflict returns 409", async () => {
    const res = conflict("Email already registered");
    expect(res.status).toBe(409);
  });

  test("serverError returns 500 with Error message", async () => {
    const res = serverError(new Error("DB timeout"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.message).toBe("DB timeout");
  });

  test("serverError returns 500 with fallback for non-Error", async () => {
    const res = serverError("something went wrong");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.message).toBe("An unexpected error occurred");
  });
});
