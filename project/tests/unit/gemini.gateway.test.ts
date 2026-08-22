import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ generateContent: vi.fn() }))

vi.mock("@google/genai", () => ({
  GoogleGenAI: class GoogleGenAI {
    models = { generateContent: mocks.generateContent }
  },
}))

import { geminiProvider } from "@/features/ai/gateways/gemini.gateway"

function response(data: unknown) {
  return {
    text: JSON.stringify(data),
    responseId: "gemini-response",
    usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 20 },
  }
}

describe("Gemini Kanban prompts", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.GEMINI_API_KEY = "test-key"
    process.env.GEMINI_MODEL = "test-model"
  })

  afterEach(() => {
    delete process.env.GEMINI_API_KEY
    delete process.env.GEMINI_MODEL
  })

  it("acts as a product manager and guarantees all generated board tasks start in the first column", async () => {
    mocks.generateContent.mockResolvedValue(
      response({
        lists: [
          { name: "Backlog", tasks: [{ title: "Define scope", description: "Document the product scope." }] },
          { name: "In Progress", tasks: [{ title: "Build feature", description: "Implement the approved scope." }] },
          { name: "Done", tasks: [] },
        ],
      }),
    )

    const result = await geminiProvider.generateBoard({
      projectTitle: "Customer portal",
      goal: "Plan and deliver a customer self-service portal.",
      listCount: 3,
      taskCount: 2,
    })

    expect(result.data.lists.map((list) => list.tasks.length)).toEqual([2, 0, 0])
    expect(result.data.lists[0]?.tasks.map((task) => task.title)).toEqual(["Define scope", "Build feature"])
    const request = mocks.generateContent.mock.calls[0]?.[0]
    expect(request.contents).toContain("Act as a senior product manager")
    expect(request.contents).toContain("place every task in the first column only")
    expect(request.contents).toContain("Customer portal")
  })

  it("frames selected-column task generation as Kanban product-management work", async () => {
    mocks.generateContent.mockResolvedValue(
      response([{ title: "Clarify requirements", description: "Capture the expected user outcome." }]),
    )

    await geminiProvider.generateTasks({
      projectTitle: "Customer portal",
      columnName: "Backlog",
      goal: "Prepare the authentication work for implementation.",
      taskCount: 1,
    })

    const request = mocks.generateContent.mock.calls[0]?.[0]
    expect(request.contents).toContain("Act as a senior product manager")
    expect(request.contents).toContain("existing Kanban project")
    expect(request.contents).toContain("Backlog")
  })
})
