export function isValidMobile(value: string): boolean {
  const compact = value.replace(/[\s-]/g, '')
  return /^\+91[6-9]\d{9}$/.test(compact) || /^[6-9]\d{9}$/.test(compact)
}

export function isValidContactNumber(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 8 && digits.length <= 15
}

export function telUrl(phone: string): string {
  const compact = phone.replace(/[^\d+]/g, '')
  return `tel:${compact}`
}

export function whatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '')
  const withCountry = digits.length === 10 ? `91${digits}` : digits
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`
}

export function whatsAppMessage(leadName: string, agencyName: string, agentName: string): string {
  return `Hello ${leadName}, this is ${agentName} from ${agencyName}. I'm following up regarding your property enquiry. Please let me know a convenient time to speak.`
}
