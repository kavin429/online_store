import { getServerSession, type NextAuthOptions, type Session } from "next-auth";
import { redirect } from "next/navigation";
import { isRole, type Role } from "./types";

/** Reads the current session, or null when the visitor is anonymous. */
export async function getSession(
  authOptions: NextAuthOptions
): Promise<Session | null> {
  return getServerSession(authOptions);
}

/** True when the session belongs to one of the given roles. */
export function hasRole(
  session: Session | null | undefined,
  role: Role | Role[]
): boolean {
  if (!session?.user?.role) return false;
  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(session.user.role);
}

/**
 * Server-component guard. Redirects to the sign-in page when there is no
 * session, and to the app root when the session has the wrong role.
 */
export async function requireRole(
  authOptions: NextAuthOptions,
  role: Role | Role[],
  signInPage = "/login"
): Promise<Session> {
  const session = await getSession(authOptions);

  if (!session || !session.user) {
    redirect(signInPage);
  }

  if (!hasRole(session, role)) {
    redirect("/");
  }

  return session;
}

/**
 * Route-handler guard. Throws a 401/403 response instead of redirecting,
 * because API routes must answer with a status code.
 */
export async function requireRoleApi(
  authOptions: NextAuthOptions,
  role: Role | Role[]
): Promise<Session> {
  const session = await getSession(authOptions);

  if (!session?.user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!hasRole(session, role)) {
    throw new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return session;
}

/** The signed-in user's numeric id, parsed from the session. */
export function sessionUserId(session: Session | null | undefined): number | null {
  const raw = session?.user?.id;
  if (!raw || raw === "0") return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Narrows an untrusted value to a Role, or null. */
export function toRole(value: unknown): Role | null {
  return isRole(value) ? value : null;
}
