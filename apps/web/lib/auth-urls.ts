import { API_URL } from "./api";

/** Only same-site relative paths are forwarded to the API as post-login destinations. */
export function googleLoginUrl(returnTo: string | null): string {
  const safe =
    returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? returnTo
      : null;
  return `${API_URL}/auth/google${safe ? `?return_to=${encodeURIComponent(safe)}` : ""}`;
}
