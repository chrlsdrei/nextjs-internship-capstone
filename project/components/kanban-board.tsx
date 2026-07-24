export function KanbanBoard({ projectId }: { projectId: string }) {
  return (
    <div className="rounded-lg border border-french-gray-300 bg-white p-6 dark:border-paynes-gray-400 dark:bg-outer-space-500">
      <div className="text-center text-paynes-gray-500 dark:text-french-gray-400">
        <h3 className="mb-2 font-semibold text-lg">TODO: Implement Kanban Board</h3>
        <p className="mb-4 text-sm">Project ID: {projectId}</p>
        <div className="rounded border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            📋 This will be the main interactive Kanban board with drag-and-drop functionality.
          </p>
        </div>
      </div>
    </div>
  )
}
