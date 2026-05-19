import { hashPassword, comparePassword } from "@/lib/utils/password";

describe("password utils", () => {
  test("hashPassword produces a bcrypt hash", async () => {
    const hash = await hashPassword("secret123");
    expect(hash).toMatch(/^\$2[ab]\$/);
    expect(hash).not.toBe("secret123");
  });

  test("comparePassword returns true for matching password", async () => {
    const hash = await hashPassword("myPassword!");
    expect(await comparePassword("myPassword!", hash)).toBe(true);
  });

  test("comparePassword returns false for wrong password", async () => {
    const hash = await hashPassword("correct");
    expect(await comparePassword("wrong", hash)).toBe(false);
  });

  test("two hashes of same password are different (random salt)", async () => {
    const h1 = await hashPassword("same");
    const h2 = await hashPassword("same");
    expect(h1).not.toBe(h2);
    // Both should still verify
    expect(await comparePassword("same", h1)).toBe(true);
    expect(await comparePassword("same", h2)).toBe(true);
  });
});
