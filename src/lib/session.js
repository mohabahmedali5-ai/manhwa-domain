import { serialize } from "cookie";
import { nanoid } from "nanoid";

export const SESSION_NAME = "admin_session";
export const SESSIONS = new Map();

const SESSION_DAYS = 7;
const SESSION_MAX_AGE = 60 * 60 * 24 * SESSION_DAYS; // 7 أيام

export function createSession(data = {}) {
  const sessionId = nanoid(32);
  const session = {
    ...data,
    iat: Date.now(),
    csrfToken: nanoid(24),
  };
  SESSIONS.set(sessionId, session);

  const cookie = serialize(SESSION_NAME, sessionId, {
    httpOnly: true,
    path: "/",
    sameSite: "Strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
  });

  return { sessionId, cookie, session };
}

export function getSessionFromRequest(req) {
  const cookieHeader = req.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`${SESSION_NAME}=([^;]+)`));
  if (!match) return null;
  const id = match[1];
  const session = SESSIONS.get(id) || null;

  if (session) {
    const cookie = serialize(SESSION_NAME, id, {
      httpOnly: true,
      path: "/",
      sameSite: "Strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_MAX_AGE,
    });
    session._renewedCookie = cookie;
  }

  return session;
}

export function destroySessionCookie() {
  return serialize(SESSION_NAME, "", {
    httpOnly: true,
    path: "/",
    expires: new Date(0),
  });
}
