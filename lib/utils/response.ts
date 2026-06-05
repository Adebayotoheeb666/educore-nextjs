import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data, success: true }, { status });
}

// Paginated list response — adds X-Total-Count header for mobile clients
export function okList<T>(
  items: T[],
  total: number,
  page = 1,
  pageSize = 20
): NextResponse {
  const res = NextResponse.json(
    { data: items, success: true, meta: { total, page, pageSize, pages: Math.ceil(total / pageSize) } },
    { status: 200 }
  );
  res.headers.set("X-Total-Count", String(total));
  res.headers.set("X-Page", String(page));
  res.headers.set("X-Page-Size", String(pageSize));
  return res;
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json({ data, success: true }, { status: 201 });
}

export function badRequest(message: string): NextResponse {
  return NextResponse.json({ message }, { status: 400 });
}

export function unauthorized(message = "Not authorized, please login"): NextResponse {
  return NextResponse.json({ message }, { status: 401 });
}

export function forbidden(message = "Access denied"): NextResponse {
  return NextResponse.json({ message }, { status: 403 });
}

export function notFound(message = "Not found"): NextResponse {
  return NextResponse.json({ message }, { status: 404 });
}

export function conflict(message: string): NextResponse {
  return NextResponse.json({ message }, { status: 409 });
}

export function serverError(error: unknown): NextResponse {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : error && typeof error === "object"
      ? JSON.stringify(error)
      : "An unexpected error occurred";
  return NextResponse.json({ message }, { status: 500 });
}
