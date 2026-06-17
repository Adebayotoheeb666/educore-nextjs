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
  // Admission numbers follow SC-<year>-<seq> pattern but accept other alphanumeric with dashes
  // Accept slashes, dashes, underscores and spaces as used in some admission formats
    return /^[A-Z0-9\/\-_\s]{3,}$/.test(String(value).trim().toUpperCase());
};
