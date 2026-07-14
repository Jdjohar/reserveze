export function validateEmail(email: string): { isValid: boolean; isDisposable: boolean } {
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, isDisposable: false };
  }
  const domain = trimmed.split('@')[1].toLowerCase();
  const disposableDomains = [
    'mailinator.com', 'yopmail.com', 'tempmail.com', 'temp-mail.org', 
    'sharklasers.com', 'guerrillamail.com', 'dispostable.com', 
    'getairmail.com', 'maildrop.cc', 'throwawaymail.com', 
    '10minutemail.com', 'tempmailo.com', 'emailfake.com', 
    'fakeinbox.com', 'mohmal.com', 'trashmail.com'
  ];
  return {
    isValid: true,
    isDisposable: disposableDomains.includes(domain)
  };
}

export function validatePhone(phone: string): boolean {
  if (!phone) return true; // Optional field
  const cleanPhone = phone.trim().replace(/[-()\s]/g, '');
  const phoneRegex = /^\+?[0-9]{7,15}$/;
  return phoneRegex.test(cleanPhone);
}
