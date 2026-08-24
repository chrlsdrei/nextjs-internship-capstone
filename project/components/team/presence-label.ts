export const ONLINE_THRESHOLD_MS = 2 * 60 * 1000

function unitLabel(value: number, singular: string) {
  return `${value} ${singular}${value === 1 ? "" : "s"}`
}

export function getPresenceLabel(lastSeenAt: string | null, now = new Date()) {
  if (!lastSeenAt) return { isOnline: false, label: "Not seen online yet" }

  const lastSeenTime = new Date(lastSeenAt).getTime()
  if (!Number.isFinite(lastSeenTime)) return { isOnline: false, label: "Presence unavailable" }

  const elapsedMs = Math.max(0, now.getTime() - lastSeenTime)
  if (elapsedMs <= ONLINE_THRESHOLD_MS) return { isOnline: true, label: "Online" }

  const minutes = Math.max(1, Math.floor(elapsedMs / 60_000))
  if (minutes < 60) return { isOnline: false, label: `Offline ${unitLabel(minutes, "minute")} ago` }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return { isOnline: false, label: `Offline ${unitLabel(hours, "hour")} ago` }

  const days = Math.floor(hours / 24)
  return { isOnline: false, label: `Offline ${unitLabel(days, "day")} ago` }
}
