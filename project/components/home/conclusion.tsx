import { Show } from "@clerk/nextjs"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

import { BrandLogo } from "@/components/global/brand-logo"

export function Conclusion() {
  return (
    <>
      <section
        className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8 lg:py-36"
        aria-labelledby="conclusion-heading"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[12%] bottom-0 h-3/4 bg-[radial-gradient(ellipse_at_bottom,rgb(7_93_240/0.23),transparent_66%)]"
        />

        <div className="relative mx-auto flex max-w-6xl flex-col items-center text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-400/5 px-4 py-2 font-semibold text-[0.68rem] text-cyan-300 uppercase tracking-[0.2em] shadow-[0_0_18px_rgb(35_216_245/0.08)]">
            <Sparkles aria-hidden="true" size={13} /> Your next chapter starts here
          </p>

          <h2
            id="conclusion-heading"
            className="mt-9 text-balance font-bold text-5xl text-white leading-[0.95] tracking-[-0.055em] sm:text-7xl lg:text-8xl"
          >
            Your next project
            <span className="block bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              starts with one idea.
            </span>
          </h2>

          <p className="mt-8 max-w-2xl text-pretty text-base text-cyan-100/70 leading-8 sm:text-xl">
            Turn that idea into a structured plan, bring your team together, and keep meaningful work moving.
          </p>

          <div className="mt-10 flex w-full max-w-xl flex-col items-center justify-center gap-4 sm:flex-row">
            <Show when="signed-out">
              <Link
                href="/sign-up"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-cyan-200 bg-cyan-300 px-7 py-3 font-bold text-blue-950 shadow-[0_0_24px_rgb(35_216_245/0.24)] transition hover:bg-cyan-200 sm:w-auto"
              >
                Start your quest <ArrowRight aria-hidden="true" size={18} />
              </Link>
              <Link
                href="/sign-in"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 px-6 py-3 font-semibold text-cyan-100/75 transition hover:text-cyan-200 sm:w-auto"
              >
                Sign in to your workspace <ArrowRight aria-hidden="true" size={17} />
              </Link>
            </Show>

            <Show when="signed-in">
              <Link
                href="/dashboard"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-cyan-200 bg-cyan-300 px-7 py-3 font-bold text-blue-950 shadow-[0_0_24px_rgb(35_216_245/0.24)] transition hover:bg-cyan-200 sm:w-auto"
              >
                Open your dashboard <ArrowRight aria-hidden="true" size={18} />
              </Link>
              <Link
                href="/projects"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 px-6 py-3 font-semibold text-cyan-100/75 transition hover:text-cyan-200 sm:w-auto"
              >
                Browse your projects <ArrowRight aria-hidden="true" size={17} />
              </Link>
            </Show>
          </div>
        </div>
      </section>

      <footer className="border-cyan-300/20 border-t px-4 py-7 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[94rem] flex-col items-center justify-between gap-5 sm:flex-row">
          <div className="flex items-center gap-3">
            <BrandLogo compact />
            <span className="h-8 w-px bg-cyan-300/20" aria-hidden="true" />
            <BrandLogo />
          </div>
          <p className="text-cyan-100/50 text-sm">© QuestBoard 2026</p>
        </div>
      </footer>
    </>
  )
}
