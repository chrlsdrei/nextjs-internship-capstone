import { BrainCircuit, Clock3, Sparkles, Users } from "lucide-react"

import { OrnamentalFrame } from "@/components/ui/ornamental-frame"
import { TaskFrame } from "@/components/ui/task-frame"
import { TechFrameCard } from "@/components/ui/tech-frame-card"

const columns = [
  {
    title: "To Do",
    accent: "bg-slate-400",
    tasks: [
      { title: "Define customer onboarding", label: "Planning", meta: "Today", owner: "CA" },
      { title: "Draft launch checklist", label: "Product", meta: "Mar 28", owner: "MS" },
    ],
  },
  {
    title: "In Progress",
    accent: "bg-blue-400",
    tasks: [
      { title: "Build workspace dashboard", label: "Development", meta: "Tomorrow", owner: "JT" },
      { title: "Connect activity insights", label: "Analytics", meta: "Mar 29", owner: "CA" },
    ],
  },
  {
    title: "For Testing",
    accent: "bg-cyan-300",
    tasks: [
      { title: "Verify AI board generator", label: "AI feature", meta: "Mar 30", owner: "KL" },
      { title: "Test team invitations", label: "Quality", meta: "Mar 30", owner: "RS" },
    ],
  },
  {
    title: "Done",
    accent: "bg-emerald-400",
    tasks: [
      { title: "Create project workspace", label: "Foundation", meta: "Completed", owner: "CA" },
      { title: "Configure team permissions", label: "Security", meta: "Completed", owner: "AM" },
    ],
  },
] as const

function ExampleTask({
  task,
}: {
  task: { readonly title: string; readonly label: string; readonly meta: string; readonly owner: string }
}) {
  return (
    <TaskFrame className="min-h-32" contentClassName="flex h-full flex-col gap-3 p-3 sm:p-4">
      <span className="w-fit rounded-md border border-cyan-300/20 bg-cyan-400/10 px-2 py-1 font-semibold text-[0.65rem] text-cyan-200 uppercase tracking-wide">
        {task.label}
      </span>
      <h4 className="text-balance font-semibold text-sm text-white leading-snug">{task.title}</h4>
      <div className="mt-auto flex items-center justify-between gap-3 text-[0.7rem] text-cyan-100/65">
        <span className="inline-flex items-center gap-1.5">
          <Clock3 aria-hidden="true" size={12} />
          {task.meta}
        </span>
        <span className="grid size-7 place-items-center rounded-full border border-cyan-200/45 bg-blue-500/40 font-bold text-[0.65rem] text-white">
          {task.owner}
        </span>
      </div>
    </TaskFrame>
  )
}

function ExampleBoard() {
  return (
    <TechFrameCard
      className="min-h-0 w-full"
      contentClassName="min-h-0 gap-6 px-5 py-8 sm:px-12 sm:py-14 lg:px-14"
      aria-label="Example QuestBoard Kanban board"
    >
      <div className="flex flex-col gap-5 border-cyan-300/20 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BrainCircuit aria-hidden="true" className="text-cyan-300" size={20} />
            <h3 className="font-semibold text-base text-white sm:text-lg">AI Product Launch Board</h3>
          </div>
          <p className="mt-1 text-cyan-100/60 text-xs">Generated from one project goal, ready for your team.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <span className="sr-only">Three collaborating team members</span>
            {["CA", "JT", "KL"].map((member) => (
              <span
                key={member}
                className="grid size-7 place-items-center rounded-full border-2 border-[#061326] bg-blue-500 text-[0.6rem] text-white"
              >
                {member}
              </span>
            ))}
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2.5 py-1 text-[0.7rem] text-emerald-200">
            <span className="size-1.5 rounded-full bg-emerald-300" /> On track
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-center">
        <div>
          <p className="font-semibold text-[0.65rem] text-cyan-300 uppercase tracking-[0.18em]">Project progress</p>
          <p className="font-bold text-2xl text-white">38%</p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-blue-950/80">
          <div className="h-full w-[38%] rounded-full bg-gradient-to-r from-blue-500 to-cyan-300 shadow-[0_0_12px_rgb(35_216_245/0.55)]" />
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {columns.map((column) => (
          <OrnamentalFrame
            key={column.title}
            title={column.title}
            className="min-h-[25rem] min-w-0"
            contentClassName="flex min-w-0 flex-col gap-3 px-2 pb-4"
            titleClassName="overflow-visible text-clip whitespace-normal text-sm leading-tight tracking-[0.035em]"
          >
            <div className="mb-1 flex items-center justify-between px-2 text-[0.7rem] text-cyan-100/60">
              <span className="inline-flex items-center gap-2">
                <span className={`size-1.5 rounded-full ${column.accent}`} />
                {column.tasks.length} tasks
              </span>
              <span aria-hidden="true">•••</span>
            </div>
            {column.tasks.map((task) => (
              <ExampleTask key={task.title} task={task} />
            ))}
          </OrnamentalFrame>
        ))}
      </div>
    </TechFrameCard>
  )
}

export function Features() {
  return (
    <section id="features" className="scroll-mt-32 px-4 py-20 sm:scroll-mt-24 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto grid max-w-[94rem] items-center gap-12 xl:grid-cols-[minmax(20rem,0.72fr)_minmax(0,1.45fr)] xl:gap-14">
        <div className="max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/5 px-4 py-2 font-semibold text-[0.68rem] text-cyan-300 uppercase tracking-[0.18em] shadow-[0_0_18px_rgb(35_216_245/0.08)]">
            <Sparkles aria-hidden="true" size={13} />
            AI-powered project control
          </div>

          <h2 className="text-balance font-bold text-4xl text-white leading-[0.98] tracking-[-0.045em] sm:text-6xl xl:text-7xl">
            Plan smarter.
            <span className="block bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              Build together.
            </span>
            Finish what matters.
          </h2>

          <p className="mt-8 max-w-xl text-pretty text-base text-cyan-100/70 leading-8 sm:text-lg">
            Turn one idea into an actionable project. QuestBoard uses AI to shape your starting plan, then gives your
            team the clarity and control to move it forward.
          </p>

          <div className="mt-8 grid gap-4 text-sm text-cyan-50/80 sm:grid-cols-3 xl:grid-cols-1">
            <span className="inline-flex items-center gap-3">
              <BrainCircuit aria-hidden="true" className="shrink-0 text-cyan-300" size={18} />
              Generate structured boards with AI
            </span>
            <span className="inline-flex items-center gap-3">
              <Users aria-hidden="true" className="shrink-0 text-cyan-300" size={18} />
              Collaborate through shared workspaces
            </span>
            <span className="inline-flex items-center gap-3">
              <Sparkles aria-hidden="true" className="shrink-0 text-cyan-300" size={18} />
              Break project goals into focused tasks
            </span>
          </div>
        </div>

        <ExampleBoard />
      </div>
    </section>
  )
}
