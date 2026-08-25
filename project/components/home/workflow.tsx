import { ArrowDown, ArrowRight, Check, Quote, SlidersHorizontal, Sparkles } from "lucide-react"

import { TaskFrame } from "@/components/ui/task-frame"

function FlowArrow() {
  return (
    <div aria-hidden="true" className="flex items-center justify-center text-cyan-300">
      <ArrowDown className="lg:hidden" size={24} />
      <ArrowRight className="hidden lg:block" size={26} />
    </div>
  )
}

export function Workflow() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28" aria-labelledby="workflow-heading">
      <div className="mx-auto max-w-[94rem]">
        <p className="font-semibold text-[0.68rem] text-cyan-300 uppercase tracking-[0.24em]">01 / The workflow</p>

        <div className="mt-8 grid items-end gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.75fr)] lg:gap-20">
          <h2
            id="workflow-heading"
            className="max-w-4xl text-balance font-bold text-4xl text-white leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-7xl"
          >
            From one idea to an
            <span className="block bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              actionable plan.
            </span>
          </h2>

          <p className="max-w-xl text-pretty text-base text-cyan-100/70 leading-8 sm:text-lg">
            You bring the direction. QuestBoard removes the blank page and turns your objective into a project your team
            can organize, own, and move forward.
          </p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)_2.5rem_minmax(0,1fr)] lg:items-stretch">
          <TaskFrame className="h-full" contentClassName="flex min-h-72 h-full flex-col px-7 py-8 sm:px-8">
            <p className="font-semibold text-[0.68rem] text-cyan-300 uppercase tracking-[0.2em]">01 — Describe</p>
            <Quote aria-hidden="true" className="mt-8 text-cyan-300" size={28} />
            <p className="mt-7 max-w-sm text-pretty font-semibold text-lg text-white leading-8">
              Build a launch plan for our new product and organize the work into clear stages.
            </p>
            <div className="mt-auto pt-8">
              <span className="block h-0.5 w-16 bg-gradient-to-r from-cyan-300 to-blue-500 shadow-[0_0_8px_rgb(35_216_245/0.55)]" />
              <p className="mt-4 text-cyan-100/55 text-sm">
                Choose the workspace, project size, and optional due date.
              </p>
            </div>
          </TaskFrame>

          <FlowArrow />

          <TaskFrame
            isHighlighted
            className="h-full"
            contentClassName="flex min-h-72 h-full flex-col px-7 py-8 sm:px-8"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="font-semibold text-[0.68rem] text-cyan-300 uppercase tracking-[0.2em]">02 — Generate</p>
              <Sparkles aria-hidden="true" className="text-cyan-300" size={20} />
            </div>
            <ul className="mt-9 space-y-5 text-cyan-50/85 text-sm">
              {[
                "A structured Kanban project",
                "Ordered workflow columns",
                "Focused task titles and descriptions",
                "A ready-to-edit starting plan",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-300" size={16} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-auto border-cyan-300/20 border-t pt-6 font-semibold text-cyan-100 text-sm">
              AI creates the initial board in one action—without taking control away from your team.
            </p>
          </TaskFrame>

          <FlowArrow />

          <TaskFrame className="h-full" contentClassName="flex min-h-72 h-full flex-col px-7 py-8 sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <p className="font-semibold text-[0.68rem] text-cyan-300 uppercase tracking-[0.2em]">03 — Take control</p>
              <SlidersHorizontal aria-hidden="true" className="text-cyan-300" size={20} />
            </div>
            <div className="mt-9 flex flex-wrap gap-2">
              {["Rename", "Reorder", "Assign", "Reschedule", "Collaborate"].map((control) => (
                <span
                  key={control}
                  className="rounded-md border border-cyan-300/20 bg-cyan-400/5 px-3 py-2 text-cyan-100/75 text-xs"
                >
                  {control}
                </span>
              ))}
            </div>
            <p className="mt-auto pt-10 font-bold text-2xl text-white leading-tight">
              AI starts the work.
              <span className="block text-cyan-300">You decide where it goes.</span>
            </p>
          </TaskFrame>
        </div>
      </div>
    </section>
  )
}
