import Link from "next/link"

import { BrandLogo } from "@/components/global/brand-logo"
import { OrnamentalFrame } from "@/components/ui/ornamental-frame"

export function HomeNavbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-2 pt-2 sm:px-4 sm:pt-3">
      <OrnamentalFrame
        className="mx-auto max-w-[96rem] border-cyan-300/70 bg-[#06172c]/95 px-0 pb-0 pt-0 shadow-[inset_0_0_0_2px_var(--ornament-edge-dark),inset_0_0_28px_var(--ornament-depth),0_8px_28px_rgb(0_5_18/0.72),0_0_16px_rgb(34_211_238/0.2)] backdrop-blur-xl"
        contentClassName="flex flex-col items-center gap-3 px-5 py-3 sm:flex-row sm:justify-between sm:px-8"
      >
        <Link href="/" aria-label="QuestBoard home" className="shrink-0 rounded focus-visible:outline-cyan-300">
          <BrandLogo priority className="h-9 w-36 sm:h-10 sm:w-40" />
        </Link>

        <nav
          aria-label="Homepage navigation"
          className="flex w-full items-center justify-center gap-2 sm:w-auto sm:gap-3"
        >
          <Link
            href="#features"
            className="inline-flex min-h-10 items-center justify-center rounded-md px-3 font-semibold text-cyan-100/80 text-sm transition hover:bg-cyan-300/10 hover:text-cyan-200 focus-visible:outline-2 focus-visible:outline-cyan-300"
          >
            Features
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-cyan-300/35 bg-blue-950/35 px-3 font-semibold text-cyan-100 text-sm transition hover:border-cyan-300/70 hover:bg-cyan-300/10 focus-visible:outline-2 focus-visible:outline-cyan-300 sm:px-4"
          >
            Log in
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-cyan-200 bg-cyan-300 px-3 font-bold text-blue-950 text-sm shadow-[0_0_18px_rgb(35_216_245/0.22)] transition hover:bg-cyan-200 focus-visible:outline-2 focus-visible:outline-white sm:px-5"
          >
            Get Started
          </Link>
        </nav>
      </OrnamentalFrame>
    </header>
  )
}
