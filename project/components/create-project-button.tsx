"use client"

import { Plus, X } from "lucide-react"
import { useState } from "react"

export function CreateProjectButton() {
  const [isOpen, setIsOpen] = useState(false)

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-outer-space-500 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-outer-space-500 dark:text-platinum-500">Create New Project</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-platinum-500 dark:hover:bg-paynes-gray-400 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <form className="space-y-4">
              <div>
                <label
                  htmlFor="project-name"
                  className="block text-sm font-medium text-outer-space-500 dark:text-platinum-500 mb-2"
                >
                  Project Name
                </label>
                <input
                  type="text"
                  id="project-name"
                  className="w-full px-3 py-2 border border-french-gray-300 dark:border-paynes-gray-400 rounded-lg bg-white dark:bg-outer-space-400 text-outer-space-500 dark:text-platinum-500 focus:outline-none focus:ring-2 focus:ring-blue-munsell-500"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label
                  htmlFor="project-description"
                  className="block text-sm font-medium text-outer-space-500 dark:text-platinum-500 mb-2"
                >
                  Description
                </label>
                <textarea
                  id="project-description"
                  rows={3}
                  className="w-full px-3 py-2 border border-french-gray-300 dark:border-paynes-gray-400 rounded-lg bg-white dark:bg-outer-space-400 text-outer-space-500 dark:text-platinum-500 focus:outline-none focus:ring-2 focus:ring-blue-munsell-500"
                  placeholder="Project description"
                />
              </div>

              <div>
                <label
                  htmlFor="project-due-date"
                  className="block text-sm font-medium text-outer-space-500 dark:text-platinum-500 mb-2"
                >
                  Due Date
                </label>
                <input
                  type="date"
                  id="project-due-date"
                  className="w-full px-3 py-2 border border-french-gray-300 dark:border-paynes-gray-400 rounded-lg bg-white dark:bg-outer-space-400 text-outer-space-500 dark:text-platinum-500 focus:outline-none focus:ring-2 focus:ring-blue-munsell-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-paynes-gray-500 dark:text-french-gray-400 hover:bg-platinum-500 dark:hover:bg-paynes-gray-400 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-munsell-500 text-white rounded-lg hover:bg-blue-munsell-600 transition-colors"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
