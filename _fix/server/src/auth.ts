import type { FastifyReply, FastifyRequest } from "fastify";
import "@fastify/jwt";
import { getActiveSession } from "./db/repo.js";
import type { StaffRole } from "./db/staff.js";
import type { SessionRow } from "./types.js";

/* Authentication & session plumbing.
   - Staff (manager / waiter): stateless JWT bearer token (signed with
     JWT_SECRET). The token carries the role, which decides what the account may
     call — see requireManager below.
   - Guest/table: HTTP-only cookie holding an opaque server-side session id
     that is re-verified against the DB on every request. The browser never
     supplies a trusted table id. */

export const SESSION_COOKIE = "pi_gssid";

export interface StaffJwtPayload {
  sub: string;
  username: string;
  /** Absent on tokens issued before staff roles existed: treated as manager. */
  role?: StaffRole;
}

declare module "fastify" {
  interface FastifyRequest {
    guestSession?: SessionRow;
  }
}

/** Reads the verified JWT payload. Undefined when the token is missing/invalid. */
function payloadOf(req: FastifyRequest): StaffJwtPayload | undefined {
  try {
    return (req as { user?: StaffJwtPayload }).user;
  } catch {
    return undefined;
  }
}

/** The role this request is allowed to act with (legacy tokens = manager). */
export function staffRole(req: FastifyRequest): StaffRole {
  return payloadOf(req)?.role ?? "manager";
}

async function verify(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<boolean> {
  try {
    const payload = await req.jwtVerify<StaffJwtPayload>();
    // Keep the decoded payload reachable for staffRole().
    (req as { user?: StaffJwtPayload }).user = payload;
    return true;
  } catch {
    reply
      .code(401)
      .send({ error: { code: "unauthorized", message: "Login required" } });
    return false;
  }
}

/** preHandler: any signed-in staff member (manager or waiter). */
export async function requireAdmin(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  await verify(req, reply);
}

/** preHandler: managers only. Waiters get 403 — the role check is server-side,
    never a UI detail. */
export async function requireManager(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!(await verify(req, reply))) return;
  if (staffRole(req) !== "manager") {
    reply
      .code(403)
      .send({
        error: {
          code: "forbidden",
          message: "This section needs a manager account.",
        },
      });
  }
}

/** Reads and verifies the guest session cookie. Returns undefined if absent/expired. */
export function resolveGuestSession(
  req: FastifyRequest,
): SessionRow | undefined {
  const sessionId = req.cookies?.[SESSION_COOKIE];
  if (!sessionId || typeof sessionId !== "string") return undefined;
  return getActiveSession(sessionId);
}

/** preHandler: require an active guest session, else 401. */
export async function requireGuestSession(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const session = resolveGuestSession(req);
  if (!session) {
    reply
      .code(401)
      .send({
        error: { code: "no_session", message: "Valid table session required" },
      });
    return;
  }
  req.guestSession = session;
}
