/** Tiny classNames joiner — dependency-free. Later args win nothing special,
 * it just filters falsy values and joins. Keeps component class lists readable. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
