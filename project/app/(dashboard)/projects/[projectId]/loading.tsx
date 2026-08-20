export default function LoadingProjectBoard() {
  return (
    <div className="space-y-6 animate-pulse" role="status" aria-label="Loading project board">
      <div className="h-16 w-2/3 rounded bg-french-gray-300 dark:bg-paynes-gray-400" />
      <div className="h-14 rounded bg-french-gray-300 dark:bg-paynes-gray-400" />
      <div className="flex gap-4 overflow-hidden">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-96 w-80 shrink-0 rounded bg-french-gray-300 dark:bg-paynes-gray-400" />
        ))}
      </div>
    </div>
  )
}
