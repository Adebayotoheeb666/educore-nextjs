process.env.JWT_SECRET = "test-secret-key-for-jest";

import { generateToken, verifyToken } from "@/lib/utils/jwt";

describe("JWT utils", () => {
  const userId = "user-abc-123";

  test("generateToken produces a verifiable token", () => {
    const token = generateToken(userId);
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3); // header.payload.signature
  });

  test("verifyToken decodes the userId", () => {
    const token = generateToken(userId);
    const payload = verifyToken(token);
    expect(payload.id).toBe(userId);
  });

  test("verifyToken throws on tampered token", () => {
    const token = generateToken(userId);
    const tampered = token.slice(0, -4) + "xxxx";
    expect(() => verifyToken(tampered)).toThrow();
  });

  test("generateToken includes iat and exp", () => {
    const token = generateToken(userId);
    const payload = verifyToken(token);
    expect(payload.iat).toBeDefined();
    expect(payload.exp).toBeDefined();
    expect(payload.exp!).toBeGreaterThan(payload.iat!);
  });
});
