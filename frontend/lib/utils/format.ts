/**
 * Format money for Vietnamese dong
 * 7000 → "7.000 ₫"
 */
export function vnd(amount: number): string {
  return amount.toLocaleString("vi-VN") + " ₫";
}

/**
 * Format date to Vietnamese locale
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("vi-VN");
}

/**
 * Format datetime to Vietnamese locale
 */
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString("vi-VN");
}

/**
 * Get days ago string
 */
export function daysAgo(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
  return formatDate(date);
}

/**
 * Truncate string with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}
