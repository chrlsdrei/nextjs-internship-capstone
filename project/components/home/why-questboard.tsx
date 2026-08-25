import { ArrowUpRight, CalendarClock, ChartNoAxesCombined, Columns3, ShieldCheck, Sparkles, Users } from "lucide-react"

import { TaskFrame } from "@/components/ui/task-frame"

const reasons = [
  {
    number: "01",
    title: "AI-powered project generation",
    description: "Turn a project goal into an organized Kanban board and focused starting tasks.",
    detail: "Generate boards and task breakdowns without surrendering control of the workflow.",
    icon: Sparkles,
    highlighted: true,
  },
  {
    number: "02",
    title: "Flexible Kanban management",
    description: "Rename, reorder, filter, and adapt every list and task as priorities change.",
    detail: "Optimistic drag-and-drop keeps the board responsive while every change remains persistent.",
    icon: Columns3,
    highlighted: false,
  },
  {
    number: "03",
    title: "Workspace collaboration",
    description: "Bring the right teammates into shared workspaces and project boards.",
    detail: "Invitations, comments, task assignments, and activity updates keep context close to the work.",
    icon: Users,
    highlighted: false,
  },
  {
    number: "04",
    title: "Clear ownership and roles",
    description: "Make responsibility explicit from the workspace down to each project.",
    detail: "Owner, administrator, editor, and viewer permissions give every collaborator the right access.",
    icon: ShieldCheck,
    highlighted: false,
  },
  {
    number: "05",
    title: "Progress and activity analytics",
    description: "Understand completion, contribution history, and team momentum at a glance.",
    detail: "Project progress bars, activity charts, and completion heatmaps turn movement into insight.",
    icon: ChartNoAxesCombined,
    highlighted: false,
  },
  {
    number: "06",
    title: "Calendar and deadline awareness",
    description: "Keep upcoming work visible and make overdue tasks difficult to miss.",
    detail: "Combined task, project, and workspace dates provide context with timely notifications.",
    icon: CalendarClock,
    highlighted: false,
  },
] as const

export function WhyQuestBoard() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28" aria-labelledby="why-questboard-heading">
      <div className="mx-auto max-w-[94rem]">
        <p className="text-center font-semibold text-[0.68rem] text-cyan-300 uppercase tracking-[0.24em]">
          08 / Why QuestBoard
        </p>

        <h2
          id="why-questboard-heading"
          className="mx-auto mt-8 max-w-5xl text-balance text-center font-bold text-4xl text-white leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-7xl"
        >
          Designed for the way
          <span className="block bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
            good work actually happens.
          </span>
        </h2>

        <p className="mx-auto mt-8 max-w-2xl text-center text-cyan-100/65 text-lg">
          Powerful where it matters. Quiet where it should be. Flexible enough to support the way your team already
          works.
        </p>

        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {reasons.map((reason) => (
            <TaskFrame
              key={reason.number}
              isHighlighted={reason.highlighted}
              className="h-full transition-transform duration-200 hover:-translate-y-1"
              contentClassName="flex h-full min-h-52 flex-col px-6 py-7 sm:px-7"
            >
              <div className="flex items-start justify-between gap-5">
                <span className="font-semibold text-[0.62rem] text-cyan-100/45 tracking-[0.18em]">{reason.number}</span>
                <ArrowUpRight aria-hidden="true" className="text-cyan-300/65" size={18} />
              </div>

              <reason.icon aria-hidden="true" className="mt-5 text-cyan-300" size={22} />
              <h3 className="mt-4 font-semibold text-lg text-white">{reason.title}</h3>
              <p className="mt-3 text-cyan-100/65 text-sm leading-6">{reason.description}</p>
              <p className="mt-auto border-cyan-300/15 border-t pt-5 text-cyan-100/45 text-xs leading-5">
                {reason.detail}
              </p>
            </TaskFrame>
          ))}
        </div>
      </div>
    </section>
  )
}
