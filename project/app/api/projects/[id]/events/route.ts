import { type ProjectEvent, subscribeToProjectEvents } from "@/features/board/server/project-event.service"
import { projectIdSchema } from "@/features/projects/project.schema"
import { ProjectAccessError, requireProjectPermission } from "@/features/projects/server/project-access.service"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const encoder = new TextEncoder()
const heartbeat = encoder.encode(": keep-alive\n\n")

function eventPayload(event: ProjectEvent) {
  return encoder.encode(
    `id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify({
      projectId: event.projectId,
    })}\n\n`,
  )
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const parsedProjectId = projectIdSchema.safeParse(id)
  if (!parsedProjectId.success) return new Response("Not found", { status: 404 })

  try {
    await requireProjectPermission(parsedProjectId.data, "view")
  } catch (error) {
    if (error instanceof ProjectAccessError) return new Response("Not found", { status: 404 })
    throw error
  }

  let cleanup = () => undefined
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false
      const close = () => {
        if (closed) return
        closed = true
        cleanup()
        try {
          controller.close()
        } catch {
          // The browser may abort after the stream has already closed.
        }
      }
      const enqueue = (chunk: Uint8Array) => {
        if (closed || (controller.desiredSize !== null && controller.desiredSize <= 0)) {
          close()
          return false
        }
        try {
          controller.enqueue(chunk)
          return true
        } catch {
          close()
          return false
        }
      }
      const interval = setInterval(() => enqueue(heartbeat), 20_000)
      const unsubscribe = subscribeToProjectEvents(parsedProjectId.data, (event) => {
        enqueue(eventPayload(event))
      })

      cleanup = () => {
        clearInterval(interval)
        unsubscribe()
        request.signal.removeEventListener("abort", close)
      }
      request.signal.addEventListener("abort", close, { once: true })
      enqueue(eventPayload({ id: `sync-${Date.now()}`, projectId: parsedProjectId.data, type: "board.sync" }))
    },
    cancel() {
      cleanup()
    },
  })

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  })
}
