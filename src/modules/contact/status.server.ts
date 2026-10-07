import "server-only";
import { isPrivacyPolicyReady } from "@/content/legal/privacy";
import { getServerEnv } from "@/lib/env";
import { resolveContactChannelStatus } from "./status";

export function getContactChannelStatus() {
  const env = getServerEnv();
  const passwordReady = Boolean(env.SMTP_USER && env.SMTP_PASSWORD);
  const oauthReady = Boolean(env.SMTP_USER && env.SMTP_OAUTH_TENANT_ID && env.SMTP_OAUTH_CLIENT_ID && env.SMTP_OAUTH_CLIENT_SECRET);
  return resolveContactChannelStatus({
    enabled: env.PUBLIC_CONTACT_ENABLED,
    privacyReady: isPrivacyPolicyReady(env.PRIVACY_POLICY_VERSION),
    notificationRecipient: env.CONTACT_NOTIFICATION_TO,
    smtpHost: env.SMTP_HOST,
    emailFrom: env.EMAIL_FROM,
    smtpCredentialsReady: passwordReady || oauthReady,
    deliveryVerified: env.CONTACT_DELIVERY_VERIFIED,
    acceptsWithoutNotification: env.CONTACT_ACCEPT_WITHOUT_NOTIFICATION,
  });
}
