export const MIN_VISIT_MINUTES = 120;

export function appleMapsDirectionsUrl(address: string): string {
  return `https://maps.apple.com/?daddr=${encodeURIComponent(address)}`;
}
