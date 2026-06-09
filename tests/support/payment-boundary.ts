export const PAYMENT_BOUNDARY_TIMEOUT = 15_000;

export function reachedPaymentProvider(
  currentUrl: string,
  sourceOrigins: readonly string[],
): boolean {
  if (!/^https?:\/\//i.test(currentUrl)) {
    return false;
  }
  if (/\/(failed|fail|error|declined)\b/i.test(currentUrl)) {
    return false;
  }
  const stillOnSource = sourceOrigins.some((origin) => currentUrl.startsWith(origin));
  if (stillOnSource) {
    return /[?&]gateway=[^&]+/.test(currentUrl);
  }
  return true;
}
