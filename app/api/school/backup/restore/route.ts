import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthContext } from "@/lib/middleware/auth";
import { badRequest, forbidden, ok, serverError } from "@/lib/utils/response";
import { ensureBackupSettings, isBackupServiceActive, restoreBackupSnapshot } from "@/lib/services/backupService";

export const dynamic = "force-dynamic";

export const POST = withAuth(async (req: NextRequest, { school }: AuthContext) => {
  try {
    if (!school) return forbidden("School not found");

    const active = await isBackupServiceActive(school.id);
    if (!active) {
      return badRequest("Backup service is not active for this school");
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return badRequest("Please upload a valid JSON backup file");
    }

    const text = await file.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      return badRequest("Uploaded file is not valid JSON");
    }

    await ensureBackupSettings(school.id);
    await restoreBackupSnapshot(school.id, payload);
    return ok({ message: "Backup restored successfully" });
  } catch (err) {
    return serverError(err);
  }
});
