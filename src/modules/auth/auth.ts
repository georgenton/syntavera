import "server-only";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { prisma } from "@/lib/db";
import { sendMagicLinkEmail } from "@/modules/email/service";

const baseURL = process.env.BETTER_AUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000";
const secret = process.env.BETTER_AUTH_SECRET
  ?? (process.env.NEXT_PHASE === "phase-production-build"
    ? "build-only-secret-that-is-never-used-at-runtime"
    : undefined);

if (!secret) throw new Error("BETTER_AUTH_SECRET is required at runtime");

export const auth = betterAuth({
  appName: "SyntaVera",
  baseURL,
  secret,
  trustedOrigins: [baseURL],
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 12,
  },
  advanced: {
    cookiePrefix: "syntavera",
    useSecureCookies: process.env.NODE_ENV === "production",
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-in/email" && ctx.path !== "/sign-in/magic-link") return;
      const email = typeof ctx.body?.email === "string" ? ctx.body.email.trim().toLowerCase() : "";
      if (!email) throw new APIError("BAD_REQUEST", { message: "Solicitud inválida" });

      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          kind: true,
          disabledAt: true,
          projectMemberships: { where: { status: "ACTIVE" }, select: { id: true }, take: 1 },
        },
      });

      const allowed = ctx.path === "/sign-in/email"
        ? user?.kind === "INTERNAL" && !user.disabledAt
        : user?.kind === "CLIENT" && !user.disabledAt && user.projectMemberships.length > 0;

      if (!allowed) throw new APIError("UNAUTHORIZED", { message: "No se pudo iniciar sesión con esas credenciales" });
    }),
  },
  plugins: [
    magicLink({
      expiresIn: 10 * 60,
      disableSignUp: true,
      storeToken: "hashed",
      sendMagicLink: async ({ email, url }) => sendMagicLinkEmail(email, url),
    }),
    nextCookies(),
  ],
  telemetry: { enabled: false },
});

export type AuthSession = typeof auth.$Infer.Session;
