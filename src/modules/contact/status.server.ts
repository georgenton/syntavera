import "server-only";
import { isPrivacyPolicyReady } from "@/content/legal/privacy";
import { getServerEnv } from "@/lib/env";
import { resolveContactChannelStatus } from "./status";

export function getContactChannelStatus() {
  const env = getServerEnv();
  return resolveContactChannelStatus({
    enabled: env.PUBLIC_CONTACT_ENABLED,
    privacyReady: isPrivacyPolicyReady(env.PRIVACY_POLICY_VERSION),
    notificationRecipient: env.CONTACT_NOTIFICATION_TO,
    smtpHost: env.SMTP_HOST,
    emailFrom: env.EMAIL_FROM,
    smtpCredentialsReady: Boolean(env.SMTP_USER) === Boolean(env.SMTP_PASSWORD),
    deliveryVerified: env.CONTACT_DELIVERY_VERIFIED,
    acceptsWithoutNotification: env.CONTACT_ACCEPT_WITHOUT_NOTIFICATION,
  });
}
