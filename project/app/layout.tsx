import { ClerkProvider } from "@clerk/nextjs"
import type { Metadata } from "next"
import { Inter, Oxanium, Sora } from "next/font/google"
import type React from "react"

import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })
const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap" })
const oxanium = Oxanium({ subsets: ["latin"], variable: "--font-oxanium", display: "swap" })

export const metadata: Metadata = {
  applicationName: "QuestBoard",
  title: {
    default: "QuestBoard",
    template: "%s | QuestBoard",
  },
  description: "AI-powered team collaboration and Kanban project management platform",
  icons: {
    icon: "/Quest-Board-av.png",
    apple: "/Quest-Board-av.png",
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.variable} ${sora.variable} ${oxanium.variable}`}>{children}</body>
      </html>
    </ClerkProvider>
  )
}
