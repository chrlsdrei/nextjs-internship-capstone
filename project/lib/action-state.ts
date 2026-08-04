export type ActionState<T = undefined> =
  | { status: "idle" }
  | { status: "success"; data?: T; message?: string }
  | {
      status: "error"
      message: string
      fieldErrors?: Record<string, string[]>
    }

export const initialActionState: ActionState = { status: "idle" }

export function actionSuccess<T = undefined>(data?: T, message?: string): ActionState<T> {
  return { status: "success", ...(data === undefined ? {} : { data }), ...(message ? { message } : {}) }
}

export function actionError(message: string, fieldErrors?: Record<string, string[]>): ActionState {
  return { status: "error", message, ...(fieldErrors ? { fieldErrors } : {}) }
}
