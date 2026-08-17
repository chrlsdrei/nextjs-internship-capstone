import type * as React from "react"

import { cn } from "@/lib/utils"

type TechFrameCardProps = React.ComponentProps<"div"> & {
  /** Adds a brighter frame treatment for selected or drag-over states. */
  isHighlighted?: boolean
}

function FrameDecoration() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full overflow-visible"
      fill="none"
      preserveAspectRatio="none"
      viewBox="0 0 1000 360"
    >
      <path
        className="text-[var(--tech-frame-shadow)]"
        d="M50 8H950L990 48V312L950 352H50L10 312V48L50 8Z"
        stroke="currentColor"
        strokeWidth="13"
        vectorEffect="non-scaling-stroke"
      />
      <path
        className="text-[var(--tech-frame-edge)]"
        d="M50 8H950L990 48V312L950 352H50L10 312V48L50 8Z"
        stroke="currentColor"
        strokeWidth="7"
        vectorEffect="non-scaling-stroke"
      />
      <path
        className="text-[var(--tech-frame-glow)]"
        d="M61 21H939L977 59V301L939 339H61L23 301V59L61 21Z"
        stroke="currentColor"
        strokeWidth="2.5"
        vectorEffect="non-scaling-stroke"
      />
      <path
        className="text-cyan-100/70"
        d="M72 31H928L966 69M966 291L928 329H72L34 291V69L72 31"
        stroke="currentColor"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />

      <g className="text-[var(--tech-frame-edge)]" fill="currentColor">
        <path d="M62 8h58l9 13H52l10-13Zm818 0h58l10 13h-77l9-13Z" />
        <path d="M62 352h58l9-13H52l10 13Zm818 0h58l10-13h-77l9 13Z" />
        <path d="M10 75h13v55L10 143V75Zm0 142 13 13v55H10v-68ZM990 75h-13v55l13 13V75Zm0 142-13 13v55h13v-68Z" />
      </g>

      <g className="text-[var(--tech-frame-glow)]" fill="currentColor">
        <rect x="363" y="13" width="28" height="13" rx="2" />
        <rect x="609" y="13" width="28" height="13" rx="2" />
        <rect x="363" y="334" width="28" height="13" rx="2" />
        <rect x="609" y="334" width="28" height="13" rx="2" />
        <rect x="26" y="103" width="10" height="18" rx="2" />
        <rect x="26" y="239" width="10" height="18" rx="2" />
        <rect x="964" y="103" width="10" height="18" rx="2" />
        <rect x="964" y="239" width="10" height="18" rx="2" />
      </g>

      <g className="text-blue-400/25" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke">
        <path d="M75 42h145l-66 82H75V42Zm850 0H780l66 82h79V42Z" />
        <path d="M75 318h180l22-25h125M925 318H745l-22-25H598" />
      </g>
    </svg>
  )
}

function TechFrameCard({ className, isHighlighted = false, children, ...props }: TechFrameCardProps) {
  return (
    <div
      data-highlighted={isHighlighted || undefined}
      data-slot="tech-frame-card"
      className={cn(
        "group/tech-card relative isolate min-h-40 p-[14px] text-[var(--tech-card-foreground)] sm:p-[18px]",
        className,
      )}
      {...props}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[10px] bg-[radial-gradient(circle_at_50%_10%,var(--tech-card-surface-bright),transparent_48%),linear-gradient(145deg,var(--tech-card-surface),var(--tech-card-surface-deep))] [clip-path:polygon(4%_0,96%_0,100%_12%,100%_88%,96%_100%,4%_100%,0_88%,0_12%)] sm:inset-[14px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[14px] opacity-70 shadow-[inset_0_0_38px_rgba(0,217,255,0.16),inset_0_-24px_48px_rgba(0,22,115,0.35)] [clip-path:polygon(4%_0,96%_0,100%_12%,100%_88%,96%_100%,4%_100%,0_88%,0_12%)] sm:inset-[18px]"
      />
      <FrameDecoration />
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-1 -z-10 opacity-70 blur-xl transition-opacity duration-200 [background:var(--tech-frame-aura)]",
          "group-data-[highlighted]/tech-card:opacity-100",
        )}
      />
      <div className="relative z-10 flex min-h-[calc(10rem-28px)] flex-col gap-6 px-4 py-5 sm:min-h-[calc(10rem-36px)] sm:px-6 sm:py-6">
        {children}
      </div>
    </div>
  )
}

function TechFrameCardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="tech-frame-card-header" className={cn("grid gap-1.5", className)} {...props} />
}

function TechFrameCardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="tech-frame-card-title"
      className={cn("font-semibold leading-none tracking-wide text-white", className)}
      {...props}
    />
  )
}

function TechFrameCardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="tech-frame-card-description" className={cn("text-sm text-cyan-100/70", className)} {...props} />
  )
}

function TechFrameCardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="tech-frame-card-content" className={cn("flex-1", className)} {...props} />
}

function TechFrameCardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="tech-frame-card-footer" className={cn("flex items-center", className)} {...props} />
}

export {
  TechFrameCard,
  TechFrameCardContent,
  TechFrameCardDescription,
  TechFrameCardFooter,
  TechFrameCardHeader,
  TechFrameCardTitle,
}
