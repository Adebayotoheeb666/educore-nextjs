import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, forbidden, ok, serverError } from "@/lib/utils/response";
import { execute } from "@/lib/db/turso";
import { generateId } from "@/lib/utils/id";
import {
  ensureBackupSettings,
  getGoogleDriveAuthorizationUrl,
  hasGoogleDriveCredentials,
  isBackupServiceActive,
  runBackupForSchool,
  updateBackupSettingsMetadata,
} from "@/lib/services/backupService";

export const dynamic = "force-dynamic";

export const GET = withAuth(async (_req: NextRequest, { school }: AuthContext) => {
  try {
    if (!school) return forbidden("School not found");

    const active = await isBackupServiceActive(school.id);
    const settings = await ensureBackupSettings(school.id);

    return ok({
      active,
      settings: {
        googleDriveConnected: Boolean(settings.google_drive_connected),
        googleDriveFolderId: settings.google_drive_folder_id,
        lastBackupAt: settings.last_backup_at,
        lastRestoreAt: settings.last_restore_at,
      },
      oauthConfigured: hasGoogleDriveCredentials(),
    });
  } catch (err) {
    return serverError(err);
  }
});

export const POST = withAuth(async (req: NextRequest, { user, school }: AuthContext) => {
  try {
    if (!school) return forbidden("School not found");

    const body = await req.json();
    const action = String(body?.action || "");

    if (action === "link") {
      if (!hasGoogleDriveCredentials()) {
        return badRequest("Google Drive OAuth credentials are not configured");
      }
      const url = getGoogleDriveAuthorizationUrl();
      return ok({ authorizationUrl: url });
    }

    if (action === "run") {
      const active = await isBackupServiceActive(school.id);
      if (!active) {
        return badRequest("Backup service is not active for this school");
      }

      const result = await runBackupForSchool(school.id);
      return ok({
        message: result.driveUpload
          ? "Backup completed and uploaded to Google Drive"
          : "Backup completed locally. Connect Google Drive to upload backups automatically.",
        lastBackupAt: result.backupAt,
        drive: result.driveUpload,
      });
    }

    if (action === "updateSettings") {
      const { googleDriveConnected } = body;
      if (typeof googleDriveConnected !== "boolean") {
        return badRequest("googleDriveConnected must be a boolean");
      }
      await ensureBackupSettings(school.id);
      await updateBackupSettingsMetadata(school.id, {
        google_drive_connected: googleDriveConnected ? 1 : 0,
      });
      return ok({ message: "Backup settings updated" });
    }

    if (action === "disconnect") {
      // Clear stored Drive tokens and mark as disconnected
      await ensureBackupSettings(school.id);
      await updateBackupSettingsMetadata(school.id, {
        google_drive_connected: 0,
        google_drive_folder_id: null,
        google_drive_token: null,
        google_drive_refresh_token: null,
        google_drive_token_expires_at: null,
      });
      // Log the disconnect event for auditing
      try {
        const id = generateId();
        await execute(
          `INSERT INTO activity_logs (id, school_id, user_id, action, resource, details, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
          [id, school.id, user?.id ?? null, "disconnect_google_drive", "backup", "User disconnected Google Drive via settings"]
        );
      } catch (e) {
        // don't block the disconnect if logging fails
      }
      return ok({ message: "Google Drive disconnected. You can reconnect to reauthorize permissions." });
    }

    return badRequest("Unknown action");
  } catch (err) {
    if (err instanceof Error && /ACCESS_TOKEN_SCOPE_INSUFFICIENT|insufficient permission|insufficientPermissions/i.test(err.message)) {
      return badRequest(
        "Google Drive authorization scopes are insufficient. Please reconnect Google Drive and grant the required permissions."
      );
    }
    return serverError(err);
  }
});
