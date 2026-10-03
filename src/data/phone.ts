export function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) return '+7' + digits;
  if (digits.length === 11 && /^[78]/.test(digits)) return '+7' + digits.slice(1);
  return value.trim();
}

export function formatPhone(value: string): string {
  const normalized = normalizePhone(value);
  return /^\+7\d{10}$/.test(normalized)
    ? normalized.replace(/^\+7(\d{3})(\d{3})(\d{2})(\d{2})$/, '+7 ($1) $2-$3-$4')
    : value;
}
export function validPhone(value: string): boolean {
  return /^\+?[\d\s().-]+$/.test(value.trim()) && value.replace(/\D/g, '').length >= 3;
}
