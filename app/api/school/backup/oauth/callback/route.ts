import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, forbidden, serverError } from "@/lib/utils/response";
import { ensureBackupSettings, exchangeGoogleCodeForTokens, updateBackupSettingsMetadata } from "@/lib/services/backupService";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (req: NextRequest, { school }: AuthContext) => {
  try {
    if (!school) return forbidden("School not found");

    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    if (!code) {
      return badRequest("Missing Google authorization code");
    }

    const tokens = await exchangeGoogleCodeForTokens(code);
    await ensureBackupSettings(school.id);
    await updateBackupSettingsMetadata(school.id, {
      google_drive_connected: 1,
      google_drive_token: tokens.accessToken,
      google_drive_refresh_token: tokens.refreshToken ?? null,
      google_drive_token_expires_at: tokens.expiresAt,
    });

    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000"}/school/settings?backupLinked=1`;
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    return serverError(err);
  }
});
