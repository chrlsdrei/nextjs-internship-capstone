import type * as React from "react"

import { cn } from "@/lib/utils"

export type OrnamentalFrameProps = React.ComponentProps<"div"> & {
  title?: string
  actions?: React.ReactNode
  contentClassName?: string
  titleClassName?: string
  isHighlighted?: boolean
}

function CornerFlourish({ position }: { position: "top-left" | "top-right" | "bottom-left" | "bottom-right" }) {
  const positionClass = {
    "top-left": "left-0 top-0",
    "top-right": "right-0 top-0 rotate-90",
    "bottom-right": "bottom-0 right-0 rotate-180",
    "bottom-left": "bottom-0 left-0 -rotate-90",
  }[position]

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 72 72"
      className={cn("absolute size-14 overflow-visible sm:size-16", positionClass)}
      fill="none"
    >
      <path d="M3 69V23C3 11.954 11.954 3 23 3h46" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
      <path
        d="M7 52c7-2 12-8 13-16-7 1-12 7-13 16Zm13-31c7 0 13-4 17-11-8-2-15 2-17 11ZM18 35c8 0 14-4 18-11-8-2-15 2-18 11Zm17-17c6 2 13 0 19-6-6-4-14-2-19 6ZM9 62c7 0 13-4 17-11-8-2-15 2-17 11Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M7 62c12-12 20-25 28-44M19 35l-9-8m25-9-6-10M20 21l-7-9" stroke="currentColor" strokeWidth="1.35" />
      <circle cx="5" cy="67" r="2.5" fill="currentColor" />
    </svg>
  )
}

function CrownFlourish() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 180 50"
      className="absolute left-1/2 top-0 h-12 w-44 -translate-x-1/2 -translate-y-[32%] overflow-visible text-[var(--ornament-accent)] drop-shadow-[0_0_5px_var(--ornament-glow)]"
      fill="none"
    >
      <path
        d="M5 38c21 0 33-5 44-17 8 11 17 15 29 16M175 38c-21 0-33-5-44-17-8 11-17 15-29 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M53 27c7-12 19-17 37-17s30 5 37 17M64 31c7-7 15-11 26-11s19 4 26 11M76 31c3-6 8-9 14-9s11 3 14 9"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="m90 2 5 9-5 8-5-8 5-9Zm-39 18-9-6 3 11 6-5Zm78 0 9-6-3 11-6-5Z" fill="currentColor" />
      <circle cx="90" cy="34" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

export function OrnamentalFrame({
  title,
  actions,
  children,
  className,
  contentClassName,
  titleClassName,
  isHighlighted = false,
  ...props
}: OrnamentalFrameProps) {
  return (
    <div
      data-slot="ornamental-frame"
      className={cn(
        "relative isolate flex min-h-0 flex-col overflow-visible rounded-sm border border-[var(--ornament-edge-bright)] bg-[var(--ornament-surface)] px-3 pb-3 pt-7 text-[var(--ornament-foreground)] shadow-[inset_0_0_0_2px_var(--ornament-edge-dark),inset_0_0_28px_var(--ornament-depth),0_10px_30px_rgb(0_10_25/0.38)] transition-[border-color,box-shadow] duration-200",
        isHighlighted &&
          "border-[var(--ornament-accent)] shadow-[inset_0_0_0_2px_var(--ornament-edge-bright),inset_0_0_32px_var(--ornament-depth),0_0_18px_var(--ornament-glow)]",
        className,
      )}
      {...props}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-[3px] border border-[color-mix(in_srgb,var(--ornament-edge-bright)_62%,transparent)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-3 top-1 h-px bg-gradient-to-r from-transparent via-[var(--ornament-accent)] to-transparent opacity-85 shadow-[0_0_7px_var(--ornament-glow)]"
      />
      <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden text-[var(--ornament-accent)] drop-shadow-[0_0_4px_var(--ornament-glow)]">
        <CornerFlourish position="top-left" />
        <CornerFlourish position="top-right" />
        <CornerFlourish position="bottom-left" />
        <CornerFlourish position="bottom-right" />
      </div>
      <div className="pointer-events-none absolute inset-0 z-20">
        <CrownFlourish />
      </div>

      {title && (
        <header className="relative z-30 mx-5 mb-3 flex min-h-16 items-center justify-center border-[var(--ornament-edge-bright)] border-b px-7 text-center shadow-[0_8px_14px_-12px_var(--ornament-glow)]">
          <h2
            title={title}
            className={cn(
              "max-w-full truncate font-semibold text-base text-[var(--ornament-foreground)] tracking-[0.08em] drop-shadow-[0_0_5px_rgb(255_255_255/0.28)]",
              titleClassName,
            )}
          >
            {title}
          </h2>
          {actions && <div className="absolute right-0 top-1/2 -translate-y-1/2">{actions}</div>}
        </header>
      )}

      <div className={cn("relative z-10 min-h-0 flex-1", contentClassName)}>{children}</div>
    </div>
  )
}
