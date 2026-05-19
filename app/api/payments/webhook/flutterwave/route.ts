import { NextRequest, NextResponse } from "next/server";
import { execute, queryOne } from "@/lib/db/turso";

// POST /api/payments/webhook/flutterwave
// Raw body must be accessible for signature verification
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const secret = process.env.FLUTTERWAVE_WEBHOOK_SECRET;
    const signature = req.headers.get("verif-hash");

    // Verify webhook signature
    if (secret && signature !== secret) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
    }

    const body = await req.json();
    const { event, data } = body;

    if (event === "charge.completed" && data?.status === "successful") {
      const { tx_ref, amount, currency, id: flutterwaveId } = data;

      // Update transaction if tracked
      const tx = await queryOne("SELECT id FROM online_transactions WHERE reference = ?", [tx_ref]);
      if (tx) {
        await execute(
          "UPDATE online_transactions SET status = 'completed', flutterwave_id = ?, updated_at = datetime('now') WHERE reference = ?",
          [String(flutterwaveId), tx_ref]
        );
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook processing failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}
