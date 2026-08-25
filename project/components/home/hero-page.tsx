import { Show } from "@clerk/nextjs"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { Analytics } from "@/components/home/analytics"
import { Collaboration } from "@/components/home/collaboration"
import { Conclusion } from "@/components/home/conclusion"
import { Deadlines } from "@/components/home/deadlines"
import { Features } from "@/components/home/features"
import { HomeNavbar } from "@/components/home/home-navbar"
import { WhyQuestBoard } from "@/components/home/why-questboard"
import { Workflow } from "@/components/home/workflow"
import { BrokenByDesign } from "@/components/ui/broken-by-design"
import { RealisticFogBackground } from "@/components/ui/realistic-fog-background"

export function HeroPage() {
  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-[#020617]">
      <RealisticFogBackground className="fixed inset-0 z-0" />
      <div className="relative z-10">
        <HomeNavbar />

        <div className="pt-32 sm:pt-24">
          {/* Hero Section */}
          <BrokenByDesign title="QuestBoard">
            <div className="flex w-full max-w-3xl flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Show when="signed-out">
                <Link
                  href="/sign-up"
                  className="inline-flex w-full items-center justify-center rounded-lg border border-blue-munsell-300 bg-blue-munsell-500 px-6 py-3 font-semibold text-outer-space-700 shadow-[0_0_24px_rgb(35_216_245_/_0.28)] transition hover:bg-blue-munsell-300 sm:w-auto sm:px-8"
                >
                  Start your quest
                  <ArrowRight className="ml-2" size={20} />
                </Link>
              </Show>
              <Show when="signed-in">
                <Link
                  href="/dashboard"
                  className="inline-flex w-full items-center justify-center rounded-lg border border-blue-munsell-300 bg-blue-munsell-500 px-6 py-3 font-semibold text-outer-space-700 shadow-[0_0_24px_rgb(35_216_245_/_0.28)] transition hover:bg-blue-munsell-300 sm:w-auto sm:px-8"
                >
                  Get Started
                  <ArrowRight className="ml-2" size={20} />
                </Link>
              </Show>
              <Link
                href="#features"
                className="inline-flex w-full items-center justify-center rounded-lg border border-blue-munsell-500/80 bg-outer-space-700/85 px-6 py-3 font-semibold text-blue-munsell-300 backdrop-blur-md transition hover:bg-blue-munsell-900 sm:w-auto sm:px-8"
              >
                Explore Features
              </Link>
            </div>
          </BrokenByDesign>

          <Features />
          <Workflow />
          <Collaboration />
          <Analytics />
          <Deadlines />
          <WhyQuestBoard />
          <Conclusion />
        </div>
      </div>
    </div>
  )
}
