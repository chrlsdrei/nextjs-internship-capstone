export const REDUCE_MOTION_STORAGE_KEY = "projectflow:reduce-motion"
export const MOTION_PREFERENCE_EVENT = "projectflow:motion-preference-change"

export function readReduceMotionPreference() {
  if (typeof window === "undefined") return false
  return window.localStorage.getItem(REDUCE_MOTION_STORAGE_KEY) === "true"
}

export function applyReduceMotionPreference(enabled: boolean) {
  if (typeof document === "undefined") return
  document.documentElement.dataset.reduceMotion = String(enabled)
}

export function saveReduceMotionPreference(enabled: boolean) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(REDUCE_MOTION_STORAGE_KEY, String(enabled))
  applyReduceMotionPreference(enabled)
  window.dispatchEvent(new CustomEvent(MOTION_PREFERENCE_EVENT, { detail: { enabled } }))
}
