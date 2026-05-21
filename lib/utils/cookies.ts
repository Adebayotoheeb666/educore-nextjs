import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const TOKEN_COOKIE = "token";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const IS_PROD = process.env.NODE_ENV === "production";

export async function getTokenFromCookies(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_COOKIE)?.value;
}

export function setAuthCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(TOKEN_COOKIE, token, {
    path: "/",
    httpOnly: true,
    expires: new Date(Date.now() + ONE_DAY_MS),
    sameSite: IS_PROD ? "strict" : "lax",
    secure: IS_PROD,
  });
  return response;
}

export function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.set(TOKEN_COOKIE, "", {
    path: "/",
    httpOnly: true,
    expires: new Date(0),
    sameSite: IS_PROD ? "strict" : "lax",
    secure: IS_PROD,
  });
  return response;
}
