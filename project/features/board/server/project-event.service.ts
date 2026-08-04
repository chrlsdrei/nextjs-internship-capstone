import "server-only"

export type ProjectEventType =
  | "board.sync"
  | "board.updated"
  | "members.updated"
  | "project.updated"
  | "project.deleted"

export type ProjectEvent = {
  id: string
  projectId: string
  type: ProjectEventType
}

type ProjectEventListener = (event: ProjectEvent) => void

class ProjectEventHub {
  private readonly listeners = new Map<string, Set<ProjectEventListener>>()
  private sequence = 0

  publish(projectId: string, type: Exclude<ProjectEventType, "board.sync">) {
    const event: ProjectEvent = {
      id: `${Date.now()}-${++this.sequence}`,
      projectId,
      type,
    }

    for (const listener of this.listeners.get(projectId) ?? []) listener(event)
    return event
  }

  subscribe(projectId: string, listener: ProjectEventListener) {
    const projectListeners = this.listeners.get(projectId) ?? new Set<ProjectEventListener>()
    projectListeners.add(listener)
    this.listeners.set(projectId, projectListeners)

    return () => {
      projectListeners.delete(listener)
      if (projectListeners.size === 0) this.listeners.delete(projectId)
    }
  }
}

type EventGlobal = typeof globalThis & { __projectEventHub?: ProjectEventHub }

const eventGlobal = globalThis as EventGlobal
const hub = eventGlobal.__projectEventHub ?? new ProjectEventHub()
eventGlobal.__projectEventHub = hub

/**
 * Delivers project invalidation notices inside one local Node.js process only.
 * Deployments with multiple instances need a shared pub/sub service before this
 * can be treated as production realtime infrastructure.
 */
export function publishProjectEvent(projectId: string, type: Exclude<ProjectEventType, "board.sync">) {
  return hub.publish(projectId, type)
}

export function subscribeToProjectEvents(projectId: string, listener: ProjectEventListener) {
  return hub.subscribe(projectId, listener)
}
