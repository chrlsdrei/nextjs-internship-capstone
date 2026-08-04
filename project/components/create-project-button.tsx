"use client"

import { Plus, X } from "lucide-react"
import { useActionState, useEffect, useState } from "react"

import { createProjectAction, initialProjectActionState } from "@/app/(dashboard)/projects/actions"

export function CreateProjectButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(createProjectAction, initialProjectActionState)

  useEffect(() => {
    if (state.success) {
      setIsOpen(false)
    }
  }, [state.success])

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 bg-blue-munsell-500 text-white rounded-lg hover:bg-blue-munsell-600 transition-colors"
      >
        <Plus size={20} className="mr-2" />
        New Project
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-project-title"
        >
          <div className="bg-white dark:bg-outer-space-500 rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2
                id="create-project-title"
                className="text-lg font-semibold text-outer-space-500 dark:text-platinum-500"
              >
                Create new project
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-platinum-500 dark:hover:bg-paynes-gray-400 rounded"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <form action={formAction} className="space-y-4">
              <label className="block text-sm font-medium text-outer-space-500 dark:text-platinum-500">
                Project name
                <input
                  name="name"
                  required
                  maxLength={100}
                  className="mt-2 w-full px-3 py-2 border border-french-gray-300 dark:border-paynes-gray-400 rounded-lg bg-white dark:bg-outer-space-400"
                />
              </label>
              <label className="block text-sm font-medium text-outer-space-500 dark:text-platinum-500">
                Description
                <textarea
                  name="description"
                  maxLength={500}
                  rows={3}
                  className="mt-2 w-full px-3 py-2 border border-french-gray-300 dark:border-paynes-gray-400 rounded-lg bg-white dark:bg-outer-space-400"
                />
              </label>
              <label className="block text-sm font-medium text-outer-space-500 dark:text-platinum-500">
                Due date
                <input
                  name="dueDate"
                  type="date"
                  className="mt-2 w-full px-3 py-2 border border-french-gray-300 dark:border-paynes-gray-400 rounded-lg bg-white dark:bg-outer-space-400"
                />
              </label>
              {state.error && (
                <p role="alert" className="text-sm text-red-600">
                  {state.error}
                </p>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-lg hover:bg-platinum-500 dark:hover:bg-paynes-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-blue-munsell-500 disabled:opacity-60 text-white rounded-lg hover:bg-blue-munsell-600"
                >
                  {isPending ? "Creating…" : "Create project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
