export const capitalizeName = (value: string): string => {
  if (!value) return "";

  return String(value)
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/(^|[\s'-])([a-z])/g, (_, prefix, letter) => `${prefix}${letter.toUpperCase()}`);
};

export const normalizePhone = (value: string | null | undefined): string => {
  if (!value) return "";
  // strip non-digits, keep leading + if present
  const s = String(value).trim();
  const plus = s.startsWith("+") ? "+" : "";
  const digits = s.replace(/[^0-9]/g, "");
  return plus + digits;
};

export const looksLikeAdmissionNo = (value: string | null | undefined): boolean => {
  if (!value) return false;
  const s = String(value).trim().toUpperCase();
  // Admission numbers should contain at least one letter and may contain digits,
  // dashes, underscores, slashes, and spaces. This avoids treating plain phone
  // numbers as admission numbers.
  if (!/^[A-Z0-9\/\-_\s]{3,}$/.test(s)) return false;
  return /[A-Z]/.test(s);
};
