import { clerkMiddleware } from "@clerk/nextjs/server"

const protectedRoutePrefixes = ["/dashboard", "/projects", "/team", "/analytics", "/calendar", "/settings"]

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl
  const isProtectedRoute = protectedRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )

  if (isProtectedRoute) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
