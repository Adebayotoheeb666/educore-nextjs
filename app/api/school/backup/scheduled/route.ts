import { NextRequest, NextResponse } from "next/server";
import { badRequest, forbidden, ok, serverError } from "@/lib/utils/response";
import { listBackupEnabledSchools, runBackupForSchool } from "@/lib/services/backupService";

export const dynamic = "force-dynamic";

export const POST = async (req: NextRequest) => {
  try {
    const schedulerKey = req.headers.get("x-backup-scheduler-key");
    if (!schedulerKey || schedulerKey !== process.env.BACKUP_SCHEDULER_SECRET) {
      return forbidden("Invalid scheduler authorization");
    }

    const schoolIds = await listBackupEnabledSchools();
    const results: Array<{ schoolId: string; status: string; error?: string }> = [];

    for (const schoolId of schoolIds) {
      try {
        await runBackupForSchool(schoolId);
        results.push({ schoolId, status: "backed_up" });
      } catch (err: unknown) {
        results.push({
          schoolId,
          status: "failed",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return ok({ scheduledAt: new Date().toISOString(), results });
  } catch (err) {
    return serverError(err);
  }
};
