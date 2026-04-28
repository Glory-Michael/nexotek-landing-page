const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Email is required.';
  if (!EMAIL_RE.test(email.trim())) return 'Please enter a valid email address.';
  return null;
}

export function validatePhone(phone: string): string | null {
  if (!phone.trim()) return 'Phone number is required.';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return 'Phone number is too short.';
  if (digits.length > 15) return 'Phone number is too long.';
  return null;
}
