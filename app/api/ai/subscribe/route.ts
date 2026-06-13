import { NextRequest, NextResponse } from "next/server";

function isValidEmail(email: unknown) {
  if (typeof email !== "string") return false;
  // simple validation
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const email = body?.email;
    if (!isValidEmail(email)) {
      return NextResponse.json({ ok: false, message: "Invalid email" }, { status: 400 });
    }

    // TODO: hook into newsletter service or DB. For now, accept and respond.
    return NextResponse.json({ ok: true, message: "Subscribed" });
  } catch (err) {
    return NextResponse.json({ ok: false, message: "Bad request" }, { status: 400 });
  }
};
