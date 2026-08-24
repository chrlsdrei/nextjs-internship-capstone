import { Gauge, Mail } from "lucide-react"

import { ActionFeedback } from "@/components/ui/action-feedback"
import { TechFrameCard } from "@/components/ui/tech-frame-card"
import type { ActionState } from "@/lib/action-state"

type AccountPreferencesProps = {
  emailEnabled: boolean
  emailAction: (payload: FormData) => void
  emailPending: boolean
  emailState: ActionState<{ enabled: boolean }>
  reduceMotion: boolean
  motionReady: boolean
  onReduceMotionChange: (enabled: boolean) => void
}

export function AccountPreferences({
  emailEnabled,
  emailAction,
  emailPending,
  emailState,
  reduceMotion,
  motionReady,
  onReduceMotionChange,
}: AccountPreferencesProps) {
  return (
    <TechFrameCard contentClassName="gap-10 px-8 py-11 sm:px-[clamp(4.5rem,7vw,7rem)] sm:py-[clamp(4.5rem,6vw,6rem)]">
      <section className="min-w-0">
        <div className="flex items-start gap-4">
          <span className="rounded-md border border-cyan-400/40 bg-cyan-950/60 p-3 text-cyan-300">
            <Mail aria-hidden="true" size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-white text-xl">Email notifications</h2>
            <p className="mt-1 text-cyan-100/70">
              Receive email updates for task assignments, comments on assigned tasks, and approaching deadlines.
            </p>
          </div>
        </div>

        <form action={emailAction} className="mt-8 border-cyan-400/25 border-t pt-7">
          <label className="flex cursor-pointer items-start justify-between gap-5 rounded-md border border-cyan-400/25 bg-[#061a34]/75 p-4 sm:p-5">
            <span>
              <span className="block font-semibold text-white">Send optional notifications by email</span>
              <span className="mt-1 block text-cyan-100/65 text-sm leading-relaxed">
                In-app notifications remain enabled. Invitation emails required to join a workspace or board are always
                sent.
              </span>
            </span>
            <span className="relative mt-1 inline-flex shrink-0 items-center">
              <input
                type="checkbox"
                name="enabled"
                value="true"
                defaultChecked={emailEnabled}
                className="peer sr-only"
                aria-label="Enable email notifications"
              />
              <span className="h-7 w-12 rounded-full border border-cyan-500/60 bg-slate-900 transition peer-checked:bg-cyan-500 peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-300 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#061a34]" />
              <span className="absolute left-1 size-5 rounded-full bg-cyan-100 shadow transition-transform peer-checked:translate-x-5" />
            </span>
          </label>
          <button
            type="submit"
            disabled={emailPending}
            className="mt-5 rounded-md border border-cyan-300/60 bg-cyan-500 px-5 py-2.5 font-semibold text-[#001827] shadow-[0_0_14px_rgb(25_215_255/0.28)] transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {emailPending ? "Saving…" : "Save email preference"}
          </button>
          <ActionFeedback state={emailState} />
        </form>
      </section>

      <section className="min-w-0 border-cyan-400/25 border-t pt-9">
        <div className="flex items-start gap-4">
          <span className="rounded-md border border-cyan-400/40 bg-cyan-950/60 p-3 text-cyan-300">
            <Gauge aria-hidden="true" size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-white text-xl">Performance</h2>
            <p className="mt-1 text-cyan-100/70">
              Reduce visual motion for a smoother experience on slower devices while keeping every feature available.
            </p>
          </div>
        </div>

        <label className="mt-8 flex cursor-pointer items-start justify-between gap-5 rounded-md border border-cyan-400/25 bg-[#061a34]/75 p-4 sm:p-5">
          <span>
            <span className="block font-semibold text-white">Reduce motion</span>
            <span className="mt-1 block text-cyan-100/65 text-sm leading-relaxed">
              Disables the animated fog and minimizes decorative transitions. This preference is saved on this device.
            </span>
          </span>
          <span className="relative mt-1 inline-flex shrink-0 items-center">
            <input
              type="checkbox"
              checked={motionReady && reduceMotion}
              disabled={!motionReady}
              onChange={(event) => onReduceMotionChange(event.target.checked)}
              className="peer sr-only"
              aria-label="Reduce motion"
            />
            <span className="h-7 w-12 rounded-full border border-cyan-500/60 bg-slate-900 transition peer-checked:bg-cyan-500 peer-disabled:opacity-60 peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-300 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#061a34]" />
            <span className="absolute left-1 size-5 rounded-full bg-cyan-100 shadow transition-transform peer-checked:translate-x-5 peer-disabled:opacity-60" />
          </span>
        </label>
      </section>
    </TechFrameCard>
  )
}
