"use client"

import { type ReactNode, useEffect, useMemo, useRef } from "react"

type BrokenByDesignProps = {
  title?: string
  height?: string
  interactive?: boolean
  className?: string
  children?: ReactNode
}

const SHARDS = [
  "0 0, 34% 0, 29% 38%, 0 48%",
  "34% 0, 67% 0, 59% 35%, 29% 38%",
  "67% 0, 100% 0, 100% 43%, 82% 38%, 59% 35%",
  "0 48%, 29% 38%, 42% 61%, 19% 76%, 0 69%",
  "29% 38%, 59% 35%, 66% 63%, 42% 61%",
  "59% 35%, 82% 38%, 100% 43%, 100% 73%, 66% 63%",
  "0 69%, 19% 76%, 31% 100%, 0 100%",
  "19% 76%, 42% 61%, 66% 63%, 73% 100%, 31% 100%",
  "66% 63%, 100% 73%, 100% 100%, 73% 100%",
] as const

const CRACKS = [
  "M340 0 L290 152 L420 244 L310 400",
  "M670 0 L590 140 L660 252 L730 400",
  "M0 192 L290 152 L590 140 L820 152 L1000 172",
  "M0 276 L190 304 L420 244 L660 252 L1000 292",
] as const

export function BrokenByDesign({
  title = "QuestBoard",
  height = "calc(100svh - 4rem)",
  interactive = true,
  className = "",
  children,
}: BrokenByDesignProps) {
  const rootRef = useRef<HTMLElement>(null)
  const poses = useMemo(
    () =>
      SHARDS.map((_, index) => ({
        x: ((index % 3) - 1) * 1.8,
        y: (Math.floor(index / 3) - 1) * 1.4,
        rotate: ((index * 7) % 5) - 2,
      })),
    [],
  )

  useEffect(() => {
    const root = rootRef.current
    if (!root || !interactive) return

    const shards = Array.from(root.querySelectorAll<HTMLElement>("[data-quest-shard]"))
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduceMotion || document.documentElement.dataset.reduceMotion === "true") return

    const update = (event: PointerEvent) => {
      const bounds = root.getBoundingClientRect()
      const x = (event.clientX - bounds.left) / bounds.width - 0.5
      const y = (event.clientY - bounds.top) / bounds.height - 0.5

      shards.forEach((shard, index) => {
        const pose = poses[index]
        const depth = 0.55 + (index % 3) * 0.22
        shard.style.transform = `translate3d(${pose.x - x * 18 * depth}px, ${pose.y - y * 14 * depth}px, ${10 + depth * 18}px) rotateX(${-y * 5 * depth}deg) rotateY(${x * 7 * depth}deg) rotateZ(${pose.rotate * 0.18}deg)`
      })
    }

    const reset = () => {
      shards.forEach((shard, index) => {
        const pose = poses[index]
        shard.style.transform = `translate3d(${pose.x}px, ${pose.y}px, 10px) rotateZ(${pose.rotate * 0.18}deg)`
      })
    }

    reset()
    root.addEventListener("pointermove", update)
    root.addEventListener("pointerleave", reset)

    return () => {
      root.removeEventListener("pointermove", update)
      root.removeEventListener("pointerleave", reset)
    }
  }, [interactive, poses])

  return (
    <section
      ref={rootRef}
      className={`quest-shatter ${className}`}
      style={{ height }}
      aria-label={`${title} interactive glass hero`}
    >
      <style>{`
        .quest-shatter {
          position: relative;
          width: 100%;
          min-height: 38rem;
          overflow: hidden;
          isolation: isolate;
          perspective: 1200px;
          background:
            radial-gradient(circle at 50% 46%, rgb(22 191 232 / 18%), transparent 30%),
            radial-gradient(ellipse at 50% 110%, rgb(7 93 240 / 26%), transparent 54%),
            linear-gradient(145deg, rgb(1 7 17 / 35%) 0%, rgb(2 11 22 / 18%) 48%, rgb(6 26 53 / 32%) 100%);
          user-select: none;
        }

        .quest-shatter::before {
          position: absolute;
          inset: .5rem;
          border: 1px solid rgb(35 216 245 / 30%);
          box-shadow: inset 0 0 34px rgb(22 191 232 / 9%), 0 0 30px rgb(8 124 255 / 12%);
          content: "";
          clip-path: polygon(2rem 0, calc(100% - 2rem) 0, 100% 2rem, 100% calc(100% - 2rem), calc(100% - 2rem) 100%, 2rem 100%, 0 calc(100% - 2rem), 0 2rem);
        }

        .quest-shatter__grid {
          position: absolute;
          inset: 0;
          opacity: 0.2;
          background-image:
            linear-gradient(rgb(50 108 168 / 22%) 1px, transparent 1px),
            linear-gradient(90deg, rgb(50 108 168 / 22%) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(circle at center, black, transparent 73%);
        }

        .quest-shatter__stage {
          position: absolute;
          inset: 1.5% 0;
          transform-style: preserve-3d;
        }

        .quest-shatter__under,
        .quest-shatter__word {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          white-space: nowrap;
          font-family: var(--font-inter), sans-serif;
          font-size: clamp(3.75rem, 15vw, 15rem);
          font-weight: 850;
          letter-spacing: -0.075em;
          line-height: 0.9;
        }

        .quest-shatter__under {
          color: rgb(169 191 212 / 18%);
          text-shadow: 0 0 28px rgb(35 216 245 / 10%);
        }

        .quest-shatter__shard {
          position: absolute;
          inset: 0;
          overflow: hidden;
          will-change: transform;
          transition: transform 380ms cubic-bezier(.16, 1, .3, 1), filter 280ms ease;
          animation: quest-shatter-enter 950ms cubic-bezier(.16, 1, .3, 1) both;
          animation-delay: calc(var(--shard-index) * 42ms);
          background:
            linear-gradient(135deg, rgb(35 216 245 / 17%), transparent 38%, rgb(7 93 240 / 22%)),
            rgb(8 27 49 / 58%);
          filter: drop-shadow(0 0 1px #23d8f5) drop-shadow(0 14px 18px rgb(0 0 0 / 48%));
          clip-path: polygon(var(--shard-shape));
        }

        .quest-shatter__shard::after {
          position: absolute;
          inset: 0;
          background: linear-gradient(118deg, transparent 28%, rgb(191 246 255 / 22%) 45%, transparent 59%);
          content: "";
          opacity: 0.48;
        }

        .quest-shatter__shard:hover {
          z-index: 20;
          filter: brightness(1.25) drop-shadow(0 0 5px #23d8f5) drop-shadow(0 24px 30px rgb(0 0 0 / 58%));
        }

        .quest-shatter__word {
          color: #e9fbff;
          text-shadow: 0 0 8px rgb(35 216 245 / 64%), 0 0 34px rgb(22 191 232 / 40%);
        }

        .quest-shatter__cracks {
          position: absolute;
          inset: 0;
          z-index: 25;
          width: 100%;
          height: 100%;
          overflow: visible;
          pointer-events: none;
          filter: drop-shadow(0 0 5px rgb(35 216 245 / 75%));
        }

        .quest-shatter__cracks path {
          fill: none;
          stroke: rgb(141 236 255 / 68%);
          stroke-width: 1.2;
          vector-effect: non-scaling-stroke;
        }

        .quest-shatter__eyebrow {
          position: absolute;
          top: clamp(2rem, 7vh, 4.5rem);
          left: 50%;
          z-index: 30;
          translate: -50% 0;
          color: #a9bfd4;
          font-family: var(--font-sora), sans-serif;
          font-size: clamp(.68rem, 1.25vw, .9rem);
          font-weight: 700;
          letter-spacing: .28em;
          text-transform: uppercase;
        }

        .quest-shatter__caption {
          position: absolute;
          bottom: clamp(8.5rem, 17vh, 10rem);
          left: 50%;
          z-index: 30;
          width: min(90%, 46rem);
          translate: -50% 0;
          color: #bceeff;
          font-family: var(--font-oxanium), sans-serif;
          font-size: clamp(.9rem, 1.8vw, 1.18rem);
          font-weight: 600;
          letter-spacing: .04em;
          text-align: center;
          text-shadow: 0 2px 12px #020b16;
        }

        .quest-shatter__supporting-copy {
          display: block;
          margin-top: .65rem;
          color: #a9bfd4;
          font-family: var(--font-sora), sans-serif;
          font-size: clamp(.76rem, 1.35vw, .95rem);
          font-weight: 550;
          letter-spacing: .015em;
        }

        .quest-shatter__actions {
          position: absolute;
          right: 1rem;
          bottom: 2rem;
          left: 1rem;
          z-index: 40;
          display: flex;
          justify-content: center;
        }

        @keyframes quest-shatter-enter {
          from { opacity: 0; transform: translate3d(0, 0, 160px) scale(.88); filter: brightness(1.7) blur(2px); }
          to { opacity: 1; }
        }

        @media (max-width: 640px) {
          .quest-shatter { min-height: 42rem; }
          .quest-shatter__stage { inset: 2% 0; }
          .quest-shatter__under,
          .quest-shatter__word {
            font-size: clamp(3rem, 19vw, 5.75rem);
            letter-spacing: -.07em;
          }
          .quest-shatter__caption { bottom: 10.5rem; }
          .quest-shatter__actions { bottom: 2.25rem; }
        }

        @media (prefers-reduced-motion: reduce) {
          .quest-shatter__shard { animation: none; transition: none; }
        }

        html[data-reduce-motion="true"] .quest-shatter__shard {
          animation: none;
          transition: none;
        }
      `}</style>

      <div className="quest-shatter__grid" aria-hidden="true" />
      <p className="quest-shatter__eyebrow">Turn broken management into a clear structure</p>
      <div className="quest-shatter__stage" aria-hidden="true">
        <div className="quest-shatter__under">{title}</div>
        {SHARDS.map((shape, index) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: shard geometry has a stable, fixed order.
            key={index}
            data-quest-shard
            className="quest-shatter__shard"
            style={
              {
                "--shard-index": index,
                "--shard-shape": shape,
              } as React.CSSProperties
            }
          >
            <div className="quest-shatter__word">{title}</div>
          </div>
        ))}
        <svg className="quest-shatter__cracks" viewBox="0 0 1000 400" preserveAspectRatio="none">
          <title>Decorative fractured glass lines</title>
          {CRACKS.map((path) => (
            <path key={path} d={path} />
          ))}
        </svg>
      </div>
      <p className="quest-shatter__caption">
        Plan with your team. Let AI break down the work. Finish the quest.
        <span className="quest-shatter__supporting-copy">
          AI-powered Kanban for teams that want less planning and more progress.
        </span>
      </p>
      {children ? <div className="quest-shatter__actions">{children}</div> : null}
    </section>
  )
}
