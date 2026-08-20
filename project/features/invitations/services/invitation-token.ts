import "server-only"

import { createHash, randomBytes } from "node:crypto"

export const INVITATION_EXPIRY_DAYS = 7

export function createInvitationToken() {
  return randomBytes(32).toString("base64url")
}

export function hashInvitationToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex")
}

export function invitationExpiry(now = new Date()) {
  return new Date(now.getTime() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
}
