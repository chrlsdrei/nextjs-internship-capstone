"use client"

import { X } from "lucide-react"
import { type ReactNode, useEffect, useId, useRef } from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { TechFrameCard } from "@/components/ui/tech-frame-card"
import { cn } from "@/lib/utils"

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function Modal({ open, onClose, title, description, children, footer, className }: ModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    closeButtonRef.current?.focus()

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current()
    }
    window.addEventListener("keydown", closeOnEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", closeOnEscape)
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 cursor-default bg-slate-950/75 backdrop-blur-sm"
        onClick={onClose}
      />
      <TechFrameCard
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          "relative z-10 min-h-0 w-full max-w-xl text-cyan-50 drop-shadow-[0_24px_40px_rgb(0_0_0/0.65)]",
          className,
        )}
        contentClassName="min-h-0 max-h-[min(42rem,90vh)] gap-0 overflow-hidden p-0 sm:min-h-0 sm:p-0"
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-3 sm:px-6 sm:py-5">
          <header className="flex items-start justify-between gap-4 border-cyan-300/20 border-b px-1 pb-4">
            <div>
              <h2 id={titleId} className="font-semibold text-lg text-white">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-1 text-cyan-100/65 text-sm">
                  {description}
                </p>
              )}
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label={`Close ${title}`}
              className="rounded-md p-1.5 text-cyan-100/70 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <X size={18} />
            </button>
          </header>
          <ScrollArea className="min-h-0 flex-1 py-4">{children}</ScrollArea>
          {footer && <footer className="border-cyan-300/20 border-t pt-4">{footer}</footer>}
        </div>
      </TechFrameCard>
    </div>
  )
}
