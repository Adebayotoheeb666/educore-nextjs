import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, ok, serverError } from "@/lib/utils/response";
import { sendEmail } from "@/lib/services/email";

export const dynamic = "force-dynamic";

// POST /api/admin/test-email — super_admin only, verifies SMTP config works
export const POST = withAuth(
  async (req: NextRequest, { user }: AuthContext): Promise<NextResponse> => {
    try {
      const { to } = await req.json();
      const recipient = to || user.email;
      if (!recipient) return badRequest("No recipient email");

      const sentAt = new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" });

      await sendEmail(
        recipient,
        "✅ Educore SMTP Test — Configuration Working",
        `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:2rem">
          <div style="background:#6A5ACD;padding:2rem;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:24px">Educore AI</h1>
          </div>
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:0 0 12px 12px;padding:2rem">
            <h2 style="color:#1e293b">SMTP Configuration Test</h2>
            <p>This is a test email confirming that your SMTP configuration is working correctly.</p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:1rem;margin:1.5rem 0">
              <p style="margin:0;color:#166534;font-weight:700">✅ Email delivery is working</p>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:1rem">
              <tr><td style="padding:0.5rem;color:#64748b;width:140px">Sent at</td><td style="padding:0.5rem;font-weight:600">${sentAt} (WAT)</td></tr>
              <tr><td style="padding:0.5rem;color:#64748b">Sent to</td><td style="padding:0.5rem;font-weight:600">${recipient}</td></tr>
              <tr><td style="padding:0.5rem;color:#64748b">Triggered by</td><td style="padding:0.5rem;font-weight:600">${user.name} (${user.email})</td></tr>
            </table>
          </div>
        </div>`
      );

      return ok({ message: `Test email sent to ${recipient}`, sentAt });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Email send failed";
      return serverError(new Error(`SMTP Error: ${message}`));
    }
  },
  ["super_admin"]
);
