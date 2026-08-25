import { SignIn } from "@clerk/nextjs"
import { BrandLogo } from "@/components/global/brand-logo"
import { RealisticFogBackground } from "@/components/ui/realistic-fog-background"
import { authenticationHref, safeInvitationRedirect } from "@/features/invitations/invitation-redirect"

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string | string[] }>
}) {
  const redirectUrl = safeInvitationRedirect((await searchParams).redirect_url)
  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] px-4 py-10">
      <RealisticFogBackground className="absolute inset-0 -z-10" />
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <BrandLogo className="mx-auto mb-4" priority />
          <h1 className="mb-2 font-bold text-3xl text-white">Welcome back</h1>
          <p className="text-cyan-100/65">Sign in to continue to QuestBoard</p>
        </div>
        <SignIn
          path="/sign-in"
          signUpUrl={redirectUrl ? authenticationHref("/sign-up", redirectUrl) : "/sign-up"}
          forceRedirectUrl={redirectUrl}
          fallbackRedirectUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: "mx-auto w-full",
              cardBox: "w-full",
              formFieldAction: "hidden",
            },
          }}
        />
      </div>
    </main>
  )
}
