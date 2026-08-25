import { Show, UserButton } from "@clerk/nextjs"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

import { BrandLogo } from "@/components/global/brand-logo"
import { Features } from "@/components/home/features"
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

        {/* Navigation Demo Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50 dark:bg-outer-space-400/50">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold text-outer-space-500 dark:text-platinum-500 mb-8">
              Explore the QuestBoard workspace
            </h2>
            <p className="text-lg text-paynes-gray-500 dark:text-french-gray-500 mb-8">
              Sign in to access the protected dashboard, project boards, and team workspace.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <Link
                href="/dashboard"
                className="p-4 bg-white dark:bg-outer-space-500 rounded-lg border border-french-gray-300 dark:border-paynes-gray-400 hover:shadow-lg transition-shadow"
              >
                <h3 className="font-semibold text-outer-space-500 dark:text-platinum-500 mb-2">Dashboard</h3>
                <p className="text-sm text-paynes-gray-500 dark:text-french-gray-400">Main dashboard view</p>
              </Link>

              <Link
                href="/projects"
                className="p-4 bg-white dark:bg-outer-space-500 rounded-lg border border-french-gray-300 dark:border-paynes-gray-400 hover:shadow-lg transition-shadow"
              >
                <h3 className="font-semibold text-outer-space-500 dark:text-platinum-500 mb-2">Projects</h3>
                <p className="text-sm text-paynes-gray-500 dark:text-french-gray-400">Projects listing page</p>
              </Link>

              <Link
                href="/projects/1"
                className="p-4 bg-white dark:bg-outer-space-500 rounded-lg border border-french-gray-300 dark:border-paynes-gray-400 hover:shadow-lg transition-shadow"
              >
                <h3 className="font-semibold text-outer-space-500 dark:text-platinum-500 mb-2">Kanban Board</h3>
                <p className="text-sm text-paynes-gray-500 dark:text-french-gray-400">Project board view</p>
              </Link>

              <Link
                href="/sign-in"
                className="p-4 bg-white dark:bg-outer-space-500 rounded-lg border border-french-gray-300 dark:border-paynes-gray-400 hover:shadow-lg transition-shadow"
              >
                <h3 className="font-semibold text-outer-space-500 dark:text-platinum-500 mb-2">Auth Pages</h3>
                <p className="text-sm text-paynes-gray-500 dark:text-french-gray-400">Secure Clerk authentication</p>
              </Link>
            </div>
          </div>
        </section>

        {/* Task Implementation Status */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center text-outer-space-500 dark:text-platinum-500 mb-12">
              Implementation Roadmap
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { phase: "1.0", title: "Project Setup", status: "pending", tasks: 6 },
                { phase: "2.0", title: "Authentication", status: "pending", tasks: 6 },
                { phase: "3.0", title: "Database Setup", status: "pending", tasks: 6 },
                { phase: "4.0", title: "Core Features", status: "pending", tasks: 6 },
                { phase: "5.0", title: "Kanban Board", status: "pending", tasks: 6 },
                { phase: "6.0", title: "Advanced Features", status: "pending", tasks: 6 },
                { phase: "7.0", title: "Testing", status: "pending", tasks: 6 },
                { phase: "8.0", title: "Deployment", status: "pending", tasks: 6 },
              ].map((item) => (
                <div
                  key={item.phase}
                  className="bg-white dark:bg-outer-space-500 p-6 rounded-lg border border-french-gray-300 dark:border-paynes-gray-400"
                >
                  <div className="text-sm text-blue-munsell-500 font-semibold mb-2">Phase {item.phase}</div>
                  <h3 className="font-semibold text-outer-space-500 dark:text-platinum-500 mb-2">{item.title}</h3>
                  <div className="text-sm text-paynes-gray-500 dark:text-french-gray-400 mb-3">{item.tasks} tasks</div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                    <span className="text-sm text-paynes-gray-500 dark:text-french-gray-400 capitalize">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
