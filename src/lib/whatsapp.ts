/**
 * The one place WhatsApp links are built: https://wa.me/<number>?text=<message>.
 * Callers pass context (unit, compound, saved list, comparison) through the message builders below.
 */
export function whatsappUrl(number: string, message?: string): string {
  const digits = number.replace(/\D/g, '');
  return message ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : `https://wa.me/${digits}`;
}
