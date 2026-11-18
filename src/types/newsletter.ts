export type NewsletterSubscriberStatus = "ACTIVE" | "UNSUBSCRIBED";

export type AdminNewsletterSubscriberListItem = {
  id: string;
  email: string;
  status: NewsletterSubscriberStatus;
  subscribedAt: string;
  consentAt: string;
  notificationSentAt: string | null;
  lastNotificationError: string | null;
  createdAt: string;
  updatedAt: string;
};
