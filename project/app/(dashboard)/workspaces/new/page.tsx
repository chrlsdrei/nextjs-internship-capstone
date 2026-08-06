import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { CreateWorkspaceController } from "@/features/workspaces/controllers/create-workspace.controller"

export default function NewWorkspacePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-start gap-3">
        <Link
          href="/workspaces"
          aria-label="Back to workspaces"
          className="mt-1 rounded-lg p-2 hover:bg-platinum-500 dark:hover:bg-paynes-gray-400"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-bold text-3xl text-outer-space-500 dark:text-platinum-500">Create a workspace</h1>
          <p className="mt-2 text-paynes-gray-500 dark:text-french-gray-400">
            You will become the owner and can configure the workspace after creation.
          </p>
        </div>
      </header>
      <CreateWorkspaceController />
    </div>
  )
}
