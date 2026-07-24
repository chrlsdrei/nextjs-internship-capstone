import { Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-react"

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-outer-space-500 dark:text-platinum-500">Calendar</h1>
          <p className="text-paynes-gray-500 dark:text-french-gray-500 mt-2">
            View project deadlines and team schedules
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center px-4 py-2 bg-blue-munsell-500 text-white rounded-lg hover:bg-blue-munsell-600 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Add Event
        </button>
      </div>

      {/* Implementation Tasks Banner */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
          📅 Calendar Implementation Tasks
        </h3>
        <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
          <li>• Task 6.2: Add task due dates, priorities, and labels</li>
          <li>• Task 6.6: Add bulk task operations and keyboard shortcuts</li>
        </ul>
      </div>

      {/* Calendar Header */}
      <div className="bg-white dark:bg-outer-space-500 rounded-lg border border-french-gray-300 dark:border-paynes-gray-400 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button type="button" className="p-2 hover:bg-platinum-500 dark:hover:bg-paynes-gray-400 rounded-lg">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-xl font-semibold text-outer-space-500 dark:text-platinum-500">December 2024</h2>
            <button type="button" className="p-2 hover:bg-platinum-500 dark:hover:bg-paynes-gray-400 rounded-lg">
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              className="px-3 py-1 text-sm bg-blue-munsell-100 text-blue-munsell-700 dark:bg-blue-munsell-900 dark:text-blue-munsell-300 rounded"
            >
              Month
            </button>
            <button
              type="button"
              className="px-3 py-1 text-sm text-paynes-gray-500 dark:text-french-gray-400 hover:bg-platinum-500 dark:hover:bg-paynes-gray-400 rounded"
            >
              Week
            </button>
            <button
              type="button"
              className="px-3 py-1 text-sm text-paynes-gray-500 dark:text-french-gray-400 hover:bg-platinum-500 dark:hover:bg-paynes-gray-400 rounded"
            >
              Day
            </button>
          </div>
        </div>

        {/* Calendar Grid Placeholder */}
        <div className="h-96 bg-platinum-800 dark:bg-outer-space-400 rounded-lg flex items-center justify-center">
          <div className="text-center text-paynes-gray-500 dark:text-french-gray-400">
            <Calendar size={48} className="mx-auto mb-2" />
            <p>Calendar Component Placeholder</p>
            <p className="text-sm">TODO: Implement with react-big-calendar or similar</p>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white dark:bg-outer-space-500 rounded-lg border border-french-gray-300 dark:border-paynes-gray-400 p-6">
        <h3 className="text-lg font-semibold text-outer-space-500 dark:text-platinum-500 mb-4">Upcoming Deadlines</h3>
        <div className="space-y-3">
          {[
            { title: "Website Redesign", date: "Dec 15, 2024", type: "Project Deadline" },
            { title: "Team Meeting", date: "Dec 18, 2024", type: "Meeting" },
            { title: "Mobile App Launch", date: "Dec 22, 2024", type: "Milestone" },
          ].map((event) => (
            <div
              key={`${event.title}-${event.date}`}
              className="flex items-center justify-between p-3 bg-platinum-800 dark:bg-outer-space-400 rounded-lg"
            >
              <div>
                <div className="font-medium text-outer-space-500 dark:text-platinum-500">{event.title}</div>
                <div className="text-sm text-paynes-gray-500 dark:text-french-gray-400">{event.type}</div>
              </div>
              <div className="text-sm text-paynes-gray-500 dark:text-french-gray-400">{event.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
