export const normalizePhoneClient = (value: string | null | undefined): string => {
  if (!value) return "";
  const s = String(value).trim();
  const plus = s.startsWith("+") ? "+" : "";
  const digits = s.replace(/[^0-9]/g, "");
  return plus + digits;
};

export const formatPhoneDisplay = (value: string | null | undefined): string => {
  const raw = normalizePhoneClient(value);
  if (!raw) return "";
  // If starts with + and country code (e.g. +234), keep prefix then group rest
  if (raw.startsWith("+")) {
    const after = raw.slice(1);
    // try to detect 3-digit country code
    const country = after.length > 10 ? after.slice(0, 3) : after.slice(0, 2);
    const rest = after.slice(country.length);
    const groups = rest.match(/\d{1,4}/g) || [];
    return `+${country} ${groups.join(" ")}`.trim();
  }
  // fallback: group by 3s
  const groups = raw.match(/\d{1,3}/g) || [];
  return groups.join(" ");
};
