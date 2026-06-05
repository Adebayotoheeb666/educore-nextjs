import { execute, query, queryOne, transaction } from "@/lib/db/turso";
import { generateId } from "@/lib/utils/id";

export interface BackupSettingsRow {
  id: string;
  school_id: string;
  google_drive_connected: number;
  google_drive_folder_id: string | null;
  google_drive_token: string | null;
  google_drive_refresh_token: string | null;
  google_drive_token_expires_at: string | null;
  last_backup_at: string | null;
  last_restore_at: string | null;
  created_at: string;
  updated_at: string;
}

const GOOGLE_OAUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink";
const GOOGLE_DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";
const GOOGLE_DRIVE_SCOPE = [
  "https://www.googleapis.com/auth/drive.file",
  "openid",
  "email",
  "profile",
].join(" ");

function getAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function stringifyGoogleApiError(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim().length > 0) return value;
  if (value && typeof value === "object") return JSON.stringify(value);
  return fallback;
}

function getGoogleDriveApiErrorMessage(data: any, fallback: string): string {
  if (!data) return fallback;
  const errorDetail = data.error_description ?? data.error ?? data.message ?? data.details;
  const message = stringifyGoogleApiError(errorDetail, fallback);
  if (typeof data.error === "string" && data.error.toLowerCase().includes("insufficient")) {
    return `${message} Please reconnect Google Drive to reauthorize the required drive scope.`;
  }
  if (data?.details?.some((detail: any) => detail.reason === "ACCESS_TOKEN_SCOPE_INSUFFICIENT")) {
    return `${message} Please reconnect Google Drive to reauthorize the required drive scope.`;
  }
  return message;
}

function getBackupRedirectUri(): string {
  return `${getAppUrl()}/api/school/backup/oauth/callback`;
}

export async function getBackupSettings(schoolId: string): Promise<BackupSettingsRow | null> {
  return queryOne<BackupSettingsRow>(
    "SELECT * FROM school_backup_settings WHERE school_id = ?",
    [schoolId]
  );
}

export async function ensureBackupSettings(schoolId: string): Promise<BackupSettingsRow> {
  const existing = await getBackupSettings(schoolId);
  if (existing) return existing;

  const id = generateId();
  await execute(
    `INSERT INTO school_backup_settings (id, school_id, google_drive_connected, created_at, updated_at)
     VALUES (?, ?, 0, datetime('now'), datetime('now'))`,
    [id, schoolId]
  );

  const created = await getBackupSettings(schoolId);
  if (!created) {
    throw new Error("Unable to create backup settings record");
  }
  return created;
}

export async function isBackupServiceActive(schoolId: string): Promise<boolean> {
  const result = await queryOne<{ active: number }>(
    `SELECT 1 AS active
     FROM school_services ss
     JOIN services s ON ss.service_id = s.id
     WHERE ss.school_id = ? AND s.slug = 'backup' AND ss.status = 'active'`,
    [schoolId]
  );
  return Boolean(result?.active);
}

export function getGoogleDriveAuthorizationUrl(): string {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  if (!clientId) {
    throw new Error("Google Drive OAuth credentials are not configured");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getBackupRedirectUri(),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_DRIVE_SCOPE,
    include_granted_scopes: "true",
  });

  return `${GOOGLE_OAUTH_URL}?${params.toString()}`;
}

export function hasGoogleDriveCredentials(): boolean {
  return Boolean(process.env.GOOGLE_DRIVE_CLIENT_ID && process.env.GOOGLE_DRIVE_CLIENT_SECRET);
}

export async function exchangeGoogleCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
}> {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google Drive OAuth credentials are not configured");
  }

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: getBackupRedirectUri(),
    grant_type: "authorization_code",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error(
      stringifyGoogleApiError(data.error_description ?? data.error, "Failed to exchange Google authorization code")
    );
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + Number(data.expires_in || 3600) * 1000).toISOString(),
  };
}

export async function refreshGoogleAccessToken(settings: BackupSettingsRow): Promise<{
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string;
}> {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google Drive OAuth credentials are not configured");
  }
  if (!settings.google_drive_refresh_token) {
    throw new Error("No Google Drive refresh token is available");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: settings.google_drive_refresh_token,
    grant_type: "refresh_token",
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error(
      stringifyGoogleApiError(data.error_description ?? data.error, "Failed to refresh Google Drive access token")
    );
  }

  const refreshToken = data.refresh_token || settings.google_drive_refresh_token;
  const expiresAt = new Date(Date.now() + Number(data.expires_in || 3600) * 1000).toISOString();

  await execute(
    `UPDATE school_backup_settings SET google_drive_token = ?, google_drive_refresh_token = ?, google_drive_token_expires_at = ?, updated_at = datetime('now')
     WHERE school_id = ?`,
    [data.access_token, refreshToken, expiresAt, settings.school_id]
  );

  return { accessToken: data.access_token, refreshToken, expiresAt };
}

export async function ensureGoogleAccessToken(settings: BackupSettingsRow): Promise<string> {
  if (
    settings.google_drive_token &&
    settings.google_drive_token_expires_at &&
    new Date(settings.google_drive_token_expires_at).getTime() > Date.now() + 60_000
  ) {
    return settings.google_drive_token;
  }

  return refreshGoogleAccessToken(settings).then((result) => result.accessToken);
}

export async function updateBackupSettingsMetadata(
  schoolId: string,
  updates: Partial<{
    google_drive_connected: number;
    google_drive_folder_id: string | null;
    google_drive_token: string | null;
    google_drive_refresh_token: string | null;
    google_drive_token_expires_at: string | null;
    last_backup_at: string | null;
    last_restore_at: string | null;
  }>
): Promise<void> {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (typeof updates.google_drive_connected === "number") {
    fields.push("google_drive_connected = ?");
    values.push(updates.google_drive_connected);
  }
  if (Object.prototype.hasOwnProperty.call(updates, "google_drive_folder_id")) {
    fields.push("google_drive_folder_id = ?");
    values.push(updates.google_drive_folder_id ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(updates, "google_drive_token")) {
    fields.push("google_drive_token = ?");
    values.push(updates.google_drive_token ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(updates, "google_drive_refresh_token")) {
    fields.push("google_drive_refresh_token = ?");
    values.push(updates.google_drive_refresh_token ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(updates, "google_drive_token_expires_at")) {
    fields.push("google_drive_token_expires_at = ?");
    values.push(updates.google_drive_token_expires_at ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(updates, "last_backup_at")) {
    fields.push("last_backup_at = ?");
    values.push(updates.last_backup_at ?? null);
  }
  if (Object.prototype.hasOwnProperty.call(updates, "last_restore_at")) {
    fields.push("last_restore_at = ?");
    values.push(updates.last_restore_at ?? null);
  }

  if (fields.length === 0) return;

  fields.push("updated_at = datetime('now')");
  const sql = `UPDATE school_backup_settings SET ${fields.join(", ")} WHERE school_id = ?`;
  values.push(schoolId);

  await execute(sql, values);
}

export async function buildBackupSnapshot(schoolId: string): Promise<Record<string, unknown>> {
  const school = await queryOne(
    `SELECT id, name, email, phone, state, type, sub_domain, address,
            subscription_status, subscription_plan, academic_session, current_term,
            logo, created_at, updated_at
     FROM schools WHERE id = ?`,
    [schoolId]
  );

  const users = await query(
    `SELECT id, name, email, role, phone, first_name, last_name, avatar,
            admission_no, class_id, dob, gender, parent_phone, address,
            state_of_origin, created_at, updated_at
     FROM users WHERE school_id = ?`,
    [schoolId]
  );

  const classes = await query("SELECT * FROM classes WHERE school_id = ?", [schoolId]);
  const subjects = await query("SELECT * FROM subjects WHERE school_id = ?", [schoolId]);
  const schoolServices = await query(
    `SELECT s.slug, ss.status, ss.subscribed_at, ss.price_paid, ss.billing_period
     FROM school_services ss
     JOIN services s ON ss.service_id = s.id
     WHERE ss.school_id = ?`,
    [schoolId]
  );

  return {
    generated_at: new Date().toISOString(),
    school,
    users,
    classes,
    subjects,
    schoolServices,
  };
}

async function createGoogleDriveFolder(accessToken: string): Promise<string> {
  const response = await fetch(GOOGLE_DRIVE_FILES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "EduCore Backups",
      mimeType: "application/vnd.google-apps.folder",
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.id) {
    throw new Error(
      getGoogleDriveApiErrorMessage(data, "Failed to create Google Drive backup folder")
    );
  }

  return data.id;
}

export async function uploadBackupSnapshotToDrive(
  schoolId: string,
  settings: BackupSettingsRow,
  snapshot: Record<string, unknown>
): Promise<{ fileId: string; webViewLink: string; folderId: string }> {
  const accessToken = await ensureGoogleAccessToken(settings);
  let folderId = settings.google_drive_folder_id;

  if (!folderId) {
    folderId = await createGoogleDriveFolder(accessToken);
    await updateBackupSettingsMetadata(schoolId, { google_drive_folder_id: folderId });
  }

  const snapshotJson = JSON.stringify(snapshot);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `educore-backup-${schoolId}-${timestamp}.json`;
  const boundary = `----EduCoreDriveBoundary${Date.now()}`;
  const multipartBody = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify({ name: fileName, parents: [folderId], mimeType: "application/json" }),
    `--${boundary}`,
    "Content-Type: application/json",
    "",
    snapshotJson,
    `--${boundary}--`,
    "",
  ].join("\r\n");

  const response = await fetch(GOOGLE_DRIVE_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  });

  const data = await response.json();
  if (!response.ok || !data.id) {
    throw new Error(
      getGoogleDriveApiErrorMessage(data, "Failed to upload backup to Google Drive")
    );
  }

  await updateBackupSettingsMetadata(schoolId, { last_backup_at: new Date().toISOString() });

  return { fileId: data.id, webViewLink: data.webViewLink, folderId };
}

export async function runBackupForSchool(schoolId: string): Promise<{
  backupAt: string;
  driveUpload?: { fileId: string; webViewLink: string };
}> {
  const settings = await ensureBackupSettings(schoolId);
  const snapshot = await buildBackupSnapshot(schoolId);
  let driveUpload;

  if (settings.google_drive_connected) {
    driveUpload = await uploadBackupSnapshotToDrive(schoolId, settings, snapshot);
  }

  const backupAt = new Date().toISOString();
  await updateBackupSettingsMetadata(schoolId, { last_backup_at: backupAt });

  return { backupAt, driveUpload };
}

export async function importLatestGoogleDriveBackup(
  schoolId: string,
  settings: BackupSettingsRow
): Promise<{ fileId: string; fileName: string }> {
  if (!settings.google_drive_connected || !settings.google_drive_folder_id) {
    throw new Error("Google Drive is not connected");
  }

  const accessToken = await ensureGoogleAccessToken(settings);
  const queryValue = `'${settings.google_drive_folder_id}' in parents and trashed = false and mimeType = 'application/json'`;
  const listUrl = `${GOOGLE_DRIVE_FILES_URL}?q=${encodeURIComponent(queryValue)}&orderBy=createdTime desc&pageSize=1&fields=files(id,name,createdTime)`;
  const listResponse = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const listData = await listResponse.json();
  if (!listResponse.ok || !Array.isArray(listData.files) || listData.files.length === 0) {
    throw new Error("No backup files were found in the connected Google Drive folder");
  }

  const file = listData.files[0];
  const downloadUrl = `${GOOGLE_DRIVE_FILES_URL}/${file.id}?alt=media`;
  const downloadResponse = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!downloadResponse.ok) {
    const message = await downloadResponse.text();
    throw new Error(`Failed to download backup file: ${message}`);
  }

  const content = await downloadResponse.text();
  const payload = JSON.parse(content);
  await restoreBackupSnapshot(schoolId, payload);
  await updateBackupSettingsMetadata(schoolId, { last_restore_at: new Date().toISOString() });

  return { fileId: file.id, fileName: file.name };
}

export async function restoreBackupSnapshot(schoolId: string, payload: any): Promise<void> {
  const statements: { sql: string; args: (string | number | null)[] }[] = [];

  if (payload.school && typeof payload.school === "object" && payload.school.id === schoolId) {
    statements.push({
      sql: `UPDATE schools SET
              name = COALESCE(?, name),
              email = COALESCE(?, email),
              phone = COALESCE(?, phone),
              state = COALESCE(?, state),
              type = COALESCE(?, type),
              address = COALESCE(?, address),
              subscription_status = COALESCE(?, subscription_status),
              subscription_plan = COALESCE(?, subscription_plan),
              academic_session = COALESCE(?, academic_session),
              current_term = COALESCE(?, current_term),
              updated_at = datetime('now')
             WHERE id = ?`,
      args: [
        payload.school.name ?? null,
        payload.school.email ?? null,
        payload.school.phone ?? null,
        payload.school.state ?? null,
        payload.school.type ?? null,
        payload.school.address ?? null,
        payload.school.subscription_status ?? null,
        payload.school.subscription_plan ?? null,
        payload.school.academic_session ?? null,
        payload.school.current_term ?? null,
        schoolId,
      ],
    });
  }

  if (Array.isArray(payload.classes)) {
    statements.push({ sql: "DELETE FROM classes WHERE school_id = ?", args: [schoolId] });
    for (const cls of payload.classes) {
      if (!cls || typeof cls !== "object") continue;
      statements.push({
        sql: `INSERT OR REPLACE INTO classes
                (id, name, school_id, class_teacher_id, level, section, academic_session, current_term, capacity, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')), datetime('now'))`,
        args: [
          cls.id,
          cls.name ?? "",
          schoolId,
          cls.class_teacher_id ?? null,
          cls.level ?? null,
          cls.section ?? null,
          cls.academic_session ?? null,
          cls.current_term ?? null,
          cls.capacity ?? null,
          cls.created_at ?? null,
        ],
      });
    }
  }

  if (Array.isArray(payload.subjects)) {
    statements.push({ sql: "DELETE FROM subjects WHERE school_id = ?", args: [schoolId] });
    for (const subject of payload.subjects) {
      if (!subject || typeof subject !== "object") continue;
      statements.push({
        sql: `INSERT OR REPLACE INTO subjects
                (id, name, code, school_id, class_id, teacher_id, description, is_compulsory, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')), datetime('now'))`,
        args: [
          subject.id,
          subject.name ?? "",
          subject.code ?? null,
          schoolId,
          subject.class_id ?? null,
          subject.teacher_id ?? null,
          subject.description ?? null,
          subject.is_compulsory ? 1 : 0,
          subject.created_at ?? null,
        ],
      });
    }
  }

  if (Array.isArray(payload.users)) {
    for (const user of payload.users) {
      if (!user || typeof user !== "object" || !user.id || !user.email) continue;
      const existing = await queryOne<{ id: string }>("SELECT id FROM users WHERE id = ?", [user.id]);
      if (existing) {
        await execute(
          `UPDATE users SET
             name = COALESCE(?, name),
             email = COALESCE(?, email),
             role = COALESCE(?, role),
             phone = COALESCE(?, phone),
             first_name = COALESCE(?, first_name),
             last_name = COALESCE(?, last_name),
             avatar = COALESCE(?, avatar),
             admission_no = COALESCE(?, admission_no),
             class_id = COALESCE(?, class_id),
             dob = COALESCE(?, dob),
             gender = COALESCE(?, gender),
             parent_phone = COALESCE(?, parent_phone),
             address = COALESCE(?, address),
             state_of_origin = COALESCE(?, state_of_origin),
             updated_at = datetime('now')
           WHERE id = ?`,
          [
            user.name ?? null,
            user.email ?? null,
            user.role ?? null,
            user.phone ?? null,
            user.first_name ?? null,
            user.last_name ?? null,
            user.avatar ?? null,
            user.admission_no ?? null,
            user.class_id ?? null,
            user.dob ?? null,
            user.gender ?? null,
            user.parent_phone ?? null,
            user.address ?? null,
            user.state_of_origin ?? null,
            user.id,
          ]
        );
      } else {
        statements.push({
          sql: `INSERT OR IGNORE INTO users
                  (id, name, email, password, role, school_id, is_active, phone, first_name, last_name,
                   avatar, admission_no, class_id, dob, gender, parent_phone, address, state_of_origin,
                   created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, datetime('now')), datetime('now'))`,
          args: [
            user.id,
            user.name ?? "",
            user.email,
            user.password ?? "",
            user.role ?? "admin_staff",
            schoolId,
            user.phone ?? null,
            user.first_name ?? null,
            user.last_name ?? null,
            user.avatar ?? null,
            user.admission_no ?? null,
            user.class_id ?? null,
            user.dob ?? null,
            user.gender ?? null,
            user.parent_phone ?? null,
            user.address ?? null,
            user.state_of_origin ?? null,
            user.created_at ?? null,
          ],
        });
      }
    }
  }

  if (Array.isArray(payload.schoolServices)) {
    for (const service of payload.schoolServices) {
      if (!service || typeof service !== "object" || !service.slug) continue;
      const serviceRow = await queryOne<{ id: string }>("SELECT id FROM services WHERE slug = ? AND is_active = 1", [service.slug]);
      if (!serviceRow) continue;

      await execute(
        `INSERT OR REPLACE INTO school_services
         (id, school_id, service_id, status, subscribed_at, price_paid, billing_period, activated_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, COALESCE(?, datetime('now')), COALESCE(?, 0), COALESCE(?, 'monthly'), ?, COALESCE(?, datetime('now')), datetime('now'))`,
        [
          service.id || generateId(),
          schoolId,
          serviceRow.id,
          service.status === "active" ? "active" : "inactive",
          service.subscribed_at ?? null,
          service.price_paid ?? 0,
          service.billing_period ?? "monthly",
          service.activated_by ?? null,
          service.created_at ?? null,
        ]
      );
    }
  }

  if (statements.length > 0) {
    await transaction(statements);
  }
}

export async function createBackupSchedulerToken(): Promise<string | null> {
  return process.env.BACKUP_SCHEDULER_SECRET ?? null;
}

export async function listBackupEnabledSchools(): Promise<string[]> {
  const rows = await query<{ id: string }>(
    `SELECT s.id
     FROM schools s
     JOIN school_services ss ON ss.school_id = s.id
     JOIN services sv ON sv.id = ss.service_id
     WHERE sv.slug = 'backup' AND sv.is_active = 1 AND ss.status = 'active'`
  );
  return rows.map((row) => row.id);
}
