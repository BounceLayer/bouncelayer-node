import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verify HMAC SHA-256 signature for incoming BounceLayer webhooks.
 *
 * @param payload - Raw payload string or Buffer from HTTP body
 * @param signatureHeader - Value of the `X-BounceLayer-Signature` or `X-Signature` header
 * @param secret - Webhook signing secret from your BounceLayer dashboard
 * @returns boolean indicating whether the webhook signature is authentic
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signatureHeader: string,
  secret: string
): boolean {
  if (!payload || !signatureHeader || !secret) {
    return false;
  }

  try {
    const rawBody = typeof payload === "string" ? payload : payload.toString("utf8");
    const hmac = createHmac("sha256", secret);
    hmac.update(rawBody);
    const expectedSignature = hmac.digest("hex");

    const providedSignature = signatureHeader.startsWith("sha256=")
      ? signatureHeader.slice(7)
      : signatureHeader;

    if (expectedSignature.length !== providedSignature.length) {
      return false;
    }

    return timingSafeEqual(
      Buffer.from(expectedSignature, "utf8"),
      Buffer.from(providedSignature, "utf8")
    );
  } catch {
    return false;
  }
}
