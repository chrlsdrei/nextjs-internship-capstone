import { Building2, Plus } from "lucide-react"
import Link from "next/link"

export function WorkspaceEmptyState({ compact = false }: { compact?: boolean }) {
  return (
    <section className="rounded-xl border border-french-gray-300 border-dashed bg-white p-8 text-center dark:border-paynes-gray-400 dark:bg-outer-space-500">
      <Building2 className="mx-auto text-blue-munsell-500" size={compact ? 32 : 40} />
      <h2 className="mt-4 font-semibold text-outer-space-500 text-xl dark:text-platinum-500">
        Create your first workspace
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-paynes-gray-500 text-sm dark:text-french-gray-400">
        Workspaces organize your projects and members. Creating one is explicit—new accounts do not receive a hidden
        default workspace.
      </p>
      <Link
        href="/workspaces/new"
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-munsell-500 px-4 py-2 font-medium text-sm text-white hover:bg-blue-munsell-600"
      >
        <Plus size={18} /> Create workspace
      </Link>
    </section>
  )
}
