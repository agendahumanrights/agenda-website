import { assertSameOrigin } from "@/server/auth";
import { badRequest } from "@/server/http/errors";
import { parseJsonBody } from "@/server/http/parse";
import { jsonCreated, jsonError, jsonOk } from "@/server/http/responses";
import { subscribeToNewsletter } from "@/server/services/newsletter";
import {
  assertNewsletterNotThrottled,
  newsletterThrottleKeys,
  recordNewsletterAttempt,
} from "@/server/services/newsletter-throttle";
import { newsletterSubscribeSchema } from "@/server/validations/newsletter";

/**
 * Public newsletter subscribe.
 * Always returns generic outcomes — never exposes whether an address exists
 * beyond the friendly already_subscribed message for ACTIVE duplicates.
 */
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);

    const contentLength = Number(request.headers.get("content-length") || "0");
    if (Number.isFinite(contentLength) && contentLength > 4_096) {
      throw badRequest("Request body is too large.");
    }

    const body = await parseJsonBody(request, newsletterSubscribeSchema);

    // Honeypot: pretend success so bots do not learn the trap.
    if (body.website && body.website.length > 0) {
      return jsonOk({ outcome: "subscribed" as const });
    }

    const keys = newsletterThrottleKeys(request, body.email);
    await assertNewsletterNotThrottled(keys);
    await recordNewsletterAttempt(keys);

    const result = await subscribeToNewsletter(body.email, body.locale);
    if (result.outcome === "already_subscribed") {
      return jsonOk(result);
    }
    return jsonCreated(result);
  } catch (error) {
    return jsonError(error);
  }
}
