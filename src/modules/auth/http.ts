import { AuthorizationError } from "./guards";

export function authorizationHttpError(error: unknown, options: { concealForbidden?: boolean } = {}) {
  if (!(error instanceof AuthorizationError)) return null;
  const status = options.concealForbidden && error.status !== 401 ? 404 : error.status;
  const message = status === 401 ? "Authentication required" : status === 403 ? "Forbidden" : "Not found";
  return { status, message } as const;
}
