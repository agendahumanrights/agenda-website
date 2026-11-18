import { z } from "zod";

import {
  localeSchema,
  optionalSearchSchema,
  paginationSchema,
} from "@/server/validations/common";

/** Public subscribe body. `website` is a honeypot — must stay empty. */
export const newsletterSubscribeSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .max(254, "Email is too long.")
    .email("Please enter a valid email address."),
  /** UI locale at subscribe time — drives welcome email language. */
  locale: localeSchema.optional().default("en"),
  /** Honeypot — bots fill this; humans leave it blank. */
  website: z.string().trim().max(200).optional().default(""),
});

export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>;

export const newsletterSubscriberStatusSchema = z.enum([
  "ACTIVE",
  "UNSUBSCRIBED",
]);

export const adminNewsletterListQuerySchema = paginationSchema
  .merge(optionalSearchSchema)
  .extend({
    status: newsletterSubscriberStatusSchema.optional(),
  });

export type AdminNewsletterListQuery = z.infer<
  typeof adminNewsletterListQuerySchema
>;
