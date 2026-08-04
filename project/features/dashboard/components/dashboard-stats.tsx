import { CheckCircle, FolderKanban, Users } from "lucide-react"

export function DashboardStats({
  projectCount,
  memberCount,
  taskCount,
}: {
  projectCount: number
  memberCount: number
  taskCount: number
}) {
  const stats = [
    { name: "Projects", value: projectCount, icon: FolderKanban },
    { name: "Collaborators", value: memberCount, icon: Users },
    { name: "Tasks", value: taskCount, icon: CheckCircle },
  ]

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
      {stats.map((stat) => (
        <div
          key={stat.name}
          className="bg-white dark:bg-outer-space-500 overflow-hidden rounded-lg border border-french-gray-300 dark:border-paynes-gray-400 p-6"
        >
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-munsell-100 dark:bg-blue-munsell-900 rounded-lg flex items-center justify-center">
              <stat.icon className="text-blue-munsell-500" size={20} />
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-paynes-gray-500 dark:text-french-gray-400">{stat.name}</p>
              <p className="text-2xl font-semibold text-outer-space-500 dark:text-platinum-500">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
