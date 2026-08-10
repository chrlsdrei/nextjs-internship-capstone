import type { ReactNode } from "react"

import type { BoardListDto } from "@/features/board/board.types"

export function BoardColumn({
  list,
  totalTasks,
  header,
  children,
  addTask,
  isDropTarget,
  dropRef,
}: {
  list: BoardListDto
  totalTasks: number
  header: ReactNode
  children: ReactNode
  addTask?: () => void
  isDropTarget: boolean
  dropRef: (element: HTMLDivElement | null) => void
}) {
  return (
    <section className="w-[min(20rem,calc(100vw-2rem))] shrink-0 rounded-lg border border-french-gray-300 bg-platinum-800 p-3 dark:border-paynes-gray-400 dark:bg-outer-space-400">
      <div className="border-b border-french-gray-300 pb-3 dark:border-paynes-gray-400">
        {header}
        <p className="mt-1 text-xs text-paynes-gray-500 dark:text-french-gray-400">
          {list.tasks.length} shown · {totalTasks} total
        </p>
      </div>
      <div
        ref={dropRef}
        className={`mt-3 min-h-24 space-y-3 rounded transition-colors ${
          isDropTarget ? "bg-blue-munsell-50/60 dark:bg-blue-munsell-900/20" : ""
        }`}
      >
        {children}
        {list.tasks.length === 0 && (
          <p className="rounded border border-dashed border-french-gray-300 p-4 text-center text-sm text-paynes-gray-500 dark:border-paynes-gray-400 dark:text-french-gray-400">
            Drop a task here.
          </p>
        )}
        {addTask && (
          <button
            type="button"
            onClick={addTask}
            className="w-full rounded border-2 border-dashed border-french-gray-300 p-2 text-sm text-paynes-gray-500 hover:border-blue-munsell-500 hover:text-blue-munsell-600 dark:border-paynes-gray-400"
          >
            + Add task
          </button>
        )}
      </div>
    </section>
  )
}
