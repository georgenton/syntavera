export const CONTACT_UNAVAILABLE_MESSAGE = "Estamos habilitando nuestro canal de contacto. Mientras tanto, puedes conocer cómo trabajamos";

export type ContactChannelReason =
  | "available"
  | "disabled"
  | "privacy-not-ready"
  | "notification-not-ready"
  | "notification-unverified";

export type ContactChannelStatus = {
  available: boolean;
  reason: ContactChannelReason;
  notificationConfigured: boolean;
  acceptsWithoutNotification: boolean;
};

export function resolveContactChannelStatus(input: {
  enabled: boolean;
  privacyReady: boolean;
  notificationRecipient: string | undefined;
  smtpHost: string | undefined;
  emailFrom: string;
  smtpCredentialsReady: boolean;
  deliveryVerified: boolean;
  acceptsWithoutNotification: boolean;
}): ContactChannelStatus {
  const notificationConfigured = Boolean(input.notificationRecipient && input.smtpHost && input.emailFrom && input.smtpCredentialsReady);

  if (!input.enabled) {
    return { available: false, reason: "disabled", notificationConfigured, acceptsWithoutNotification: input.acceptsWithoutNotification };
  }
  if (!input.privacyReady) {
    return { available: false, reason: "privacy-not-ready", notificationConfigured, acceptsWithoutNotification: input.acceptsWithoutNotification };
  }
  if (!notificationConfigured && !input.acceptsWithoutNotification) {
    return { available: false, reason: "notification-not-ready", notificationConfigured, acceptsWithoutNotification: false };
  }
  if (!input.deliveryVerified && !input.acceptsWithoutNotification) {
    return { available: false, reason: "notification-unverified", notificationConfigured, acceptsWithoutNotification: false };
  }

  return { available: true, reason: "available", notificationConfigured, acceptsWithoutNotification: input.acceptsWithoutNotification };
}
