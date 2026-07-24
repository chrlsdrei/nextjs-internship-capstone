import { Calendar, MoreHorizontal, Users } from "lucide-react"
import Link from "next/link"

const projects = [
  {
    id: "1",
    name: "Website Redesign",
    description: "Complete overhaul of company website",
    progress: 75,
    members: 5,
    dueDate: "2024-02-15",
    status: "In Progress",
  },
  {
    id: "2",
    name: "Mobile App Development",
    description: "iOS and Android app development",
    progress: 45,
    members: 8,
    dueDate: "2024-03-20",
    status: "In Progress",
  },
  {
    id: "3",
    name: "Marketing Campaign",
    description: "Q1 marketing campaign planning",
    progress: 90,
    members: 3,
    dueDate: "2024-01-30",
    status: "Review",
  },
]

export function RecentProjects() {
  return (
    <div className="bg-white dark:bg-outer-space-500 rounded-lg border border-french-gray-300 dark:border-paynes-gray-400 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-outer-space-500 dark:text-platinum-500">Recent Projects</h3>
        <Link href="/projects" className="text-blue-munsell-500 hover:text-blue-munsell-600 text-sm font-medium">
          View all
        </Link>
      </div>

      <div className="space-y-4">
        {projects.map((project) => (
          <div key={project.id} className="border border-french-gray-300 dark:border-paynes-gray-400 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-outer-space-500 dark:text-platinum-500">{project.name}</h4>
                <p className="text-sm text-paynes-gray-500 dark:text-french-gray-400 mt-1">{project.description}</p>

                <div className="flex items-center space-x-4 mt-3 text-sm text-paynes-gray-500 dark:text-french-gray-400">
                  <div className="flex items-center">
                    <Users size={16} className="mr-1" />
                    {project.members}
                  </div>
                  <div className="flex items-center">
                    <Calendar size={16} className="mr-1" />
                    {project.dueDate}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-paynes-gray-500 dark:text-french-gray-400">Progress</span>
                    <span className="text-outer-space-500 dark:text-platinum-500">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-french-gray-300 dark:bg-paynes-gray-400 rounded-full h-2">
                    <div
                      className="bg-blue-munsell-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              <button type="button" className="p-1 hover:bg-platinum-500 dark:hover:bg-paynes-gray-400 rounded">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
