import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, forbidden, ok, serverError } from "@/lib/utils/response";
import { getBackupSettings, importLatestGoogleDriveBackup, isBackupServiceActive } from "@/lib/services/backupService";

export const dynamic = "force-dynamic";

export const POST = withAuth(async (_req: NextRequest, { school }: AuthContext) => {
  try {
    if (!school) return forbidden("School not found");

    const active = await isBackupServiceActive(school.id);
    if (!active) {
      return badRequest("Backup service is not active for this school");
    }

    const settings = await getBackupSettings(school.id);
    if (!settings || !settings.google_drive_connected) {
      return badRequest("Google Drive must be connected before importing backups from Drive");
    }

    const imported = await importLatestGoogleDriveBackup(school.id, settings);
    return ok({ message: `Imported backup from Drive: ${imported.fileName}` });
  } catch (err) {
    return serverError(err);
  }
});
