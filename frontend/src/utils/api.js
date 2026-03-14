/**
 * Extract user-facing message from API error (supports axios-style and plain errors)
 */
export function getApiMessage(err, fallback = "Có lỗi xảy ra. Vui lòng thử lại.") {
  if (!err) return fallback;
  const msg = err?.message ?? err?.response?.data?.message;
  return msg && typeof msg === "string" ? msg : fallback;
}
