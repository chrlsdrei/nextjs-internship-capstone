const invitationPath = "/invitations/accept"

export function invitationReturnPath(token: string) {
  return `${invitationPath}?${new URLSearchParams({ token }).toString()}`
}

export function safeInvitationRedirect(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value
  if (!candidate) return undefined
  try {
    const url = new URL(candidate, "https://projectflow.local")
    if (
      url.origin !== "https://projectflow.local" ||
      url.pathname !== invitationPath ||
      !url.searchParams.get("token")
    ) {
      return undefined
    }
    return `${url.pathname}${url.search}`
  } catch {
    return undefined
  }
}

export function authenticationHref(route: "/sign-in" | "/sign-up", returnPath: string) {
  return `${route}?${new URLSearchParams({ redirect_url: returnPath }).toString()}`
}
