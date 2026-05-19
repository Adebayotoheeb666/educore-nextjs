import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = "test-secret-key-for-jest";

// Set the secret so verifyToken works without a real env
process.env.JWT_SECRET = JWT_SECRET;
process.env.TURSO_DATABASE_URL = "libsql://test.turso.io";
process.env.TURSO_AUTH_TOKEN = "test-token";

export function makeToken(userId: string): string {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "1h" });
}

export function makeRequest(
  method: string,
  url: string,
  opts: {
    body?: unknown;
    token?: string;
    headers?: Record<string, string>;
  } = {}
): NextRequest {
  const fullUrl = url.startsWith("http") ? url : `http://localhost:3000${url}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...opts.headers,
  };
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;

  return new NextRequest(fullUrl, {
    method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
}

export const mockContext = {
  params: Promise.resolve({} as Record<string, string>),
};

export function mockContextWithParams(params: Record<string, string>) {
  return { params: Promise.resolve(params) };
}
