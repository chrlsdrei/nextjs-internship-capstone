import { Show, UserButton } from "@clerk/nextjs"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { BrandLogo } from "@/components/global/brand-logo"
import { Analytics } from "@/components/home/analytics"
import { Collaboration } from "@/components/home/collaboration"
import { Conclusion } from "@/components/home/conclusion"
import { Deadlines } from "@/components/home/deadlines"
import { Features } from "@/components/home/features"
import { WhyQuestBoard } from "@/components/home/why-questboard"
import { Workflow } from "@/components/home/workflow"
import { BrokenByDesign } from "@/components/ui/broken-by-design"
import { RealisticFogBackground } from "@/components/ui/realistic-fog-background"

export function HeroPage() {
  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-[#020617]">
      <RealisticFogBackground className="fixed inset-0 z-0" />
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-french-gray-300 dark:border-paynes-gray-400 bg-white/80 dark:bg-outer-space-500/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" aria-label="QuestBoard home">
                <BrandLogo priority />
              </Link>
              <div className="flex items-center space-x-4">
                <Show when="signed-in">
                  <Link
                    href="/dashboard"
                    className="text-outer-space-500 hover:text-blue-munsell-500 dark:text-platinum-500"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/projects"
                    className="text-outer-space-500 hover:text-blue-munsell-500 dark:text-platinum-500"
                  >
                    Projects
                  </Link>
                  <UserButton />
                </Show>
                <Show when="signed-out">
                  <Link
                    href="/sign-in"
                    className="hidden text-outer-space-500 hover:text-blue-munsell-500 dark:text-platinum-500 sm:inline"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="rounded-lg bg-blue-munsell-500 px-4 py-2 text-white hover:bg-blue-munsell-600"
                  >
                    <span className="sm:hidden">Join</span>
                    <span className="hidden sm:inline">Get Started</span>
                  </Link>
                </Show>
              </div>
            </div>
          </div>
        </header>

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
  )
}
