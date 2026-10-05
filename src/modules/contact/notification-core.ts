export type NotificationSubmission = {
  id: string;
  name: string;
  email: string;
  organization: string | null;
};

export type ContactNotificationDependencies = {
  claim(id: string): Promise<NotificationSubmission | null>;
  send(submission: NotificationSubmission): Promise<void>;
  markSent(id: string): Promise<void>;
  markFailed(id: string, errorCode: string): Promise<void>;
};

function safeErrorCode(error: unknown) {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string" && /^[A-Z0-9_-]{1,80}$/i.test(error.code)) {
    return error.code;
  }
  return error instanceof Error ? error.name.slice(0, 80) : "UNKNOWN";
}

export async function deliverContactNotification(id: string, dependencies: ContactNotificationDependencies) {
  const submission = await dependencies.claim(id);
  if (!submission) return { outcome: "not-claimed" as const };

  try {
    await dependencies.send(submission);
    await dependencies.markSent(id);
    return { outcome: "sent" as const };
  } catch (error) {
    const errorCode = safeErrorCode(error);
    await dependencies.markFailed(id, errorCode);
    return { outcome: "failed" as const, errorCode };
  }
}
