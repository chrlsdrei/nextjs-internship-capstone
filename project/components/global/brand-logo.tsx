import Image from "next/image"

type BrandLogoProps = {
  compact?: boolean
  className?: string
  priority?: boolean
}

export function BrandLogo({ compact = false, className = "", priority = false }: BrandLogoProps) {
  if (compact) {
    return (
      <span className={`relative block size-10 shrink-0 overflow-hidden rounded-full ${className}`}>
        <Image
          src="/Quest-Board-av.png"
          alt="QuestBoard"
          fill
          priority={priority}
          sizes="40px"
          className="object-contain"
        />
      </span>
    )
  }

  return (
    <span className={`relative block h-10 w-40 shrink-0 overflow-hidden ${className}`}>
      <Image
        src="/quest-board-logo.png"
        alt="QuestBoard"
        width={1255}
        height={1254}
        priority={priority}
        className="pointer-events-none absolute top-1/2 left-0 h-auto w-full -translate-y-1/2"
      />
    </span>
  )
}
