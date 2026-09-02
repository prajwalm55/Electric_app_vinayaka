export function validateMobile(mobile: string): boolean {
  return /^[6-9]\d{9}$/.test(mobile.replace(/\s/g, ''))
}

export function validatePinCode(pin: string): boolean {
  return /^\d{6}$/.test(pin)
}

export function validateAadhaar(aadhaar: string): boolean {
  const cleaned = aadhaar.replace(/\s/g, '')
  return /^\d{12}$/.test(cleaned)
}

export function validateAmount(amount: number): boolean {
  return !isNaN(amount) && amount >= 0
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
