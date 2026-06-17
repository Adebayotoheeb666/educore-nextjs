-- Migration: 0012_update_admission_no_uppercase.sql
-- Normalize existing admission_no values to uppercase
BEGIN TRANSACTION;
UPDATE users SET admission_no = UPPER(admission_no) WHERE admission_no IS NOT NULL;
COMMIT;
