import { ArrowLeft } from "lucide-react"
import Link from "next/link"

import { TechFrameCard } from "@/components/ui/tech-frame-card"
import { CreateWorkspaceController } from "@/controllers/workspaces/create-workspace.controller"

export default function NewWorkspacePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <TechFrameCard
        className="min-h-0 w-full"
        contentClassName="min-h-0 gap-0 px-[clamp(2.5rem,5vw,6rem)] py-6 sm:min-h-0 sm:px-[clamp(2.5rem,5vw,6rem)] sm:py-8"
      >
        <header className="flex items-start gap-3">
          <Link
            href="/workspaces"
            aria-label="Back to workspaces"
            className="mt-1 rounded-lg p-2 text-cyan-50 transition-colors hover:bg-white/10"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-bold text-3xl text-white">Create a workspace</h1>
            <p className="mt-2 text-cyan-100/70">
              You will become the owner and can configure the workspace after creation.
            </p>
          </div>
        </header>
      </TechFrameCard>
      <CreateWorkspaceController />
    </div>
  )
}
