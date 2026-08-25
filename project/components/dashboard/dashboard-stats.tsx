import { Building2, CheckCircle, FolderKanban, Users } from "lucide-react"

import { TaskFrame } from "@/components/ui/task-frame"

export function DashboardStats({
  projectCount,
  memberCount,
  taskCount,
  workspaceMemberCount,
}: {
  projectCount: number
  memberCount: number
  taskCount: number
  workspaceMemberCount: number
}) {
  const stats = [
    { name: "Workspace members", value: workspaceMemberCount, icon: Building2 },
    { name: "Projects", value: projectCount, icon: FolderKanban },
    { name: "Collaborators", value: memberCount, icon: Users },
    { name: "Tasks", value: taskCount, icon: CheckCircle },
  ]

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <TaskFrame key={stat.name} className="h-full" contentClassName="h-full px-7 py-6 sm:px-8 sm:py-7">
          <div className="flex items-center">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cyan-400/15 ring-1 ring-cyan-300/20">
              <stat.icon className="text-cyan-300" size={20} />
            </div>
            <div className="ml-5">
              <p className="font-medium text-cyan-100/75 text-sm">{stat.name}</p>
              <p className="font-semibold text-2xl text-white">{stat.value}</p>
            </div>
          </div>
        </TaskFrame>
      ))}
    </div>
  )
}
