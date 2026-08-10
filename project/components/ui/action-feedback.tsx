import type { ActionState } from "@/lib/action-state"

export function ActionFeedback({ state }: { state: ActionState<unknown> }) {
  if (state.status === "error") {
    return (
      <p role="alert" className="mt-2 text-sm text-red-600">
        {state.message}
      </p>
    )
  }

  if (state.status === "success") {
    return (
      <p role="status" className="mt-2 text-sm text-green-600">
        {state.message ?? "Saved."}
      </p>
    )
  }

  return null
}
