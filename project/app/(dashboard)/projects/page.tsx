import { CreateProjectButton } from "@/components/create-project-button"
import { ProjectDirectory } from "@/components/project-directory"
import { getAccessibleProjectSummaries } from "@/lib/db/queries/projects"

export default async function ProjectsPage() {
  const projects = await getAccessibleProjectSummaries()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-outer-space-500 dark:text-platinum-500">Projects</h1>
          <p className="mt-2 text-paynes-gray-500 dark:text-french-gray-500">Projects you own or collaborate on.</p>
        </div>
        <CreateProjectButton />
      </div>
      <ProjectDirectory projects={projects} />
    </div>
  )
}
