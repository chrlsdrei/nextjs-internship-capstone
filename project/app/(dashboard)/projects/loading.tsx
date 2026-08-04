export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse" role="status" aria-label="Loading projects">
      <div className="flex justify-between">
        <div className="h-10 w-40 rounded bg-french-gray-300 dark:bg-paynes-gray-400" />
        <div className="h-10 w-32 rounded bg-french-gray-300 dark:bg-paynes-gray-400" />
      </div>
      <div className="h-10 rounded bg-french-gray-300 dark:bg-paynes-gray-400" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-52 rounded-lg bg-french-gray-300 dark:bg-paynes-gray-400" />
        ))}
      </div>
    </div>
  )
}
