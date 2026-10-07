import "server-only";
import { z } from "zod";

const booleanFromString = z.enum(["true", "false"]).transform((value) => value === "true");

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
  BETTER_AUTH_SECRET: z.string().min(32),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_SECURE: booleanFromString.default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  E2E_MAILBOX_PATH: z.string().optional(),
  EMAIL_FROM: z.string().min(1).default("SyntaVera <no-reply@syntavera.dev>"),
  CONTACT_NOTIFICATION_TO: z.email().optional(),
  CONTACT_ACCEPT_WITHOUT_NOTIFICATION: booleanFromString.default(false),
  CONTACT_DELIVERY_VERIFIED: booleanFromString.default(false),
  PUBLIC_CONTACT_ENABLED: booleanFromString.default(false),
  PRIVACY_POLICY_VERSION: z.string().optional(),
  CONTACT_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(3600),
  CONTACT_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  S3_ENDPOINT: z.url().optional(),
  S3_REGION: z.string().default("auto"),
  S3_BUCKET: z.string().default("syntavera-private"),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_FORCE_PATH_STYLE: booleanFromString.default(false),
  SIGNED_URL_TTL_SECONDS: z.coerce.number().int().min(60).max(3600).default(300),
  MAX_UPLOAD_BYTES: z.coerce.number().int().positive().default(26_214_400),
}).superRefine((env, context) => {
  if (Boolean(env.SMTP_USER) !== Boolean(env.SMTP_PASSWORD)) {
    context.addIssue({ code: "custom", message: "SMTP_USER and SMTP_PASSWORD must be configured together", path: ["SMTP_USER"] });
  }
  if (env.NODE_ENV === "production" && env.E2E_MAILBOX_PATH) {
    context.addIssue({ code: "custom", message: "E2E_MAILBOX_PATH is forbidden in production", path: ["E2E_MAILBOX_PATH"] });
  }
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid server environment: ${z.prettifyError(parsed.error)}`);
  }
  cachedEnv = parsed.data;
  return cachedEnv;
}

export function hasDatabaseConfig() {
  return Boolean(process.env.DATABASE_URL);
}

export function resetEnvForTests() {
  cachedEnv = undefined;
}
