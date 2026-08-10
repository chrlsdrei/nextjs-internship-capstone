"use client"

export default function ProjectBoardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100">
      <h2 className="font-semibold">We could not load this project board.</h2>
      <p className="mt-1 text-sm">Check your connection and try again.</p>
      <button type="button" onClick={reset} className="mt-4 rounded bg-red-700 px-3 py-2 text-sm text-white">
        Try again
      </button>
    </div>
  )
}
