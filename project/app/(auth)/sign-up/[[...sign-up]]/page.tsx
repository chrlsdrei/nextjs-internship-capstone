import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-platinum-900 px-4 dark:bg-outer-space-600">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-bold text-3xl text-outer-space-500 dark:text-platinum-500">Create your account</h1>
          <p className="text-paynes-gray-500 dark:text-french-gray-400">
            Join ProjectFlow and start organizing your work
          </p>
        </div>
        <SignUp
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: "mx-auto w-full",
              cardBox: "w-full",
              card: "border border-french-gray-300 shadow-lg dark:border-paynes-gray-400",
              formFieldRow__phoneNumber: "hidden",
            },
          }}
        />
      </div>
    </main>
  )
}
