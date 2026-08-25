import { Activity, ArrowRight, Check, ShieldCheck } from "lucide-react"

import { TaskFrame } from "@/components/ui/task-frame"

const activities = [
  {
    initials: "AM",
    person: "Alex",
    action: "moved",
    subject: "Launch dashboard",
    detail: "To Do → In Progress",
    time: "8 min ago",
  },
  {
    initials: "JT",
    person: "Jordan",
    action: "commented on",
    subject: "Authentication flow",
    detail: "For Testing",
    time: "42 min ago",
  },
  {
    initials: "KL",
    person: "Kim",
    action: "completed",
    subject: "Database structure",
    detail: "Done",
    time: "2 hrs ago",
  },
] as const

const roles = [
  {
    initials: "CA",
    name: "Workspace owner",
    description: "Workspace control and implicit board administration",
  },
  {
    initials: "AM",
    name: "Board administrator",
    description: "Manage members, labels, settings, and project access",
  },
  {
    initials: "JT",
    name: "Editor",
    description: "Create, assign, update, and move project tasks",
  },
  {
    initials: "KL",
    name: "Viewer",
    description: "Follow project progress without changing the board",
  },
] as const

function TeamActivityPreview() {
  return (
    <TaskFrame className="h-full" contentClassName="flex h-full min-h-[32rem] flex-col px-6 py-7 sm:px-8 sm:py-8">
      <div className="flex flex-col gap-5 border-cyan-300/20 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-lg border border-cyan-300/20 bg-cyan-400/10">
            <Activity aria-hidden="true" className="text-cyan-300" size={20} />
          </span>
          <div>
            <h3 className="font-semibold text-lg text-white">Team activity</h3>
            <p className="text-cyan-100/55 text-xs">Updates stay visible as work moves forward.</p>
          </div>
        </div>
        <span className="w-fit rounded-md border border-cyan-300/20 bg-cyan-400/5 px-3 py-2 text-cyan-100/65 text-xs">
          This week
        </span>
      </div>

      <div className="divide-y divide-cyan-300/15">
        {activities.map((item) => (
          <article
            key={`${item.person}-${item.subject}`}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-4 py-7"
          >
            <span className="grid size-9 place-items-center rounded-full bg-cyan-400 font-bold text-[0.65rem] text-blue-950 ring-2 ring-cyan-100/70">
              {item.initials}
            </span>
            <div className="min-w-0">
              <p className="text-sm text-white leading-6">
                <span className="text-cyan-100/70">{item.person} </span>
                {item.action} <strong className="font-semibold">{item.subject}</strong>
              </p>
              <p className="mt-1 text-cyan-100/50 text-xs">
                {item.detail} · <time>{item.time}</time>
              </p>
            </div>
            <ArrowRight aria-hidden="true" className="text-cyan-300/65" size={17} />
          </article>
        ))}
      </div>
    </TaskFrame>
  )
}

function PermissionPreview() {
  return (
    <TaskFrame
      isHighlighted
      className="h-full"
      contentClassName="flex h-full min-h-[32rem] flex-col px-6 py-7 sm:px-8 sm:py-8"
    >
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-lg border border-cyan-300/20 bg-cyan-400/10">
          <ShieldCheck aria-hidden="true" className="text-cyan-300" size={20} />
        </span>
        <div>
          <p className="font-semibold text-[0.65rem] text-cyan-300 uppercase tracking-[0.2em]">Clear by design</p>
          <h3 className="mt-1 font-bold text-2xl text-white">Everyone knows where they stand.</h3>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {roles.map((role) => (
          <div
            key={role.name}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-xl border border-cyan-300/15 bg-[#041328]/75 p-4"
          >
            <span className="grid size-9 place-items-center rounded-full bg-cyan-400 font-bold text-[0.65rem] text-blue-950 ring-2 ring-cyan-100/70">
              {role.initials}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-white">{role.name}</p>
              <p className="mt-1 text-cyan-100/50 text-xs leading-5">{role.description}</p>
            </div>
            <Check aria-hidden="true" className="text-emerald-300" size={18} />
          </div>
        ))}
      </div>

      <p className="mt-auto border-cyan-300/20 border-t pt-6 text-cyan-100/60 text-sm leading-6">
        Permissions remain explicit from the workspace down to every board, while assignments and activity preserve
        accountability.
      </p>
    </TaskFrame>
  )
}

export function Collaboration() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28" aria-labelledby="collaboration-heading">
      <div className="mx-auto max-w-[94rem]">
        <p className="font-semibold text-[0.68rem] text-cyan-300 uppercase tracking-[0.24em]">02 / Collaboration</p>

        <div className="mt-8 grid items-end gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.75fr)] lg:gap-20">
          <h2
            id="collaboration-heading"
            className="max-w-4xl text-balance font-bold text-4xl text-white leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-7xl"
          >
            Built for projects
            <span className="block bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              that move together.
            </span>
          </h2>

          <p className="max-w-xl text-pretty text-base text-cyan-100/70 leading-8 sm:text-lg">
            Give everyone the right level of access, context, and ownership. Less permission overhead, clearer
            accountability, and more forward motion.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
          <TeamActivityPreview />
          <PermissionPreview />
        </div>
      </div>
    </section>
  )
}
