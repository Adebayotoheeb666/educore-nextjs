import { logger, schedules } from "@trigger.dev/sdk/v3";
import { listBackupEnabledSchools, runBackupForSchool } from "../lib/services/backupService";

const BACKUP_SCHEDULER_CRON = process.env.BACKUP_SCHEDULER_CRON ?? "0 3 * * 0"; // Default: Sunday 03:00 UTC

export const backupScheduler = schedules.task({
  id: "educore-scheduled-backup",
  description: "Run scheduled backups for all schools with backup enabled.",
  cron: {
    pattern: BACKUP_SCHEDULER_CRON,
    timezone: "UTC",
  },
  run: async () => {
    logger.info("Starting scheduled backup workflow");

    const schoolIds = await listBackupEnabledSchools();
    logger.info("Found backup-enabled schools", { schoolIds });

    for (const schoolId of schoolIds) {
      try {
        const result = await runBackupForSchool(schoolId);
        logger.info("School backup completed", {
          schoolId,
          backupAt: result.backupAt,
          uploadedToDrive: Boolean(result.driveUpload),
          driveFileId: result.driveUpload?.fileId,
        });
      } catch (error: unknown) {
        logger.error("School backup failed", {
          schoolId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.info("Scheduled backup workflow finished", {
      schoolCount: schoolIds.length,
    });
  },
});
