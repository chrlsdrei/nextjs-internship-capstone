import { describe, expect, it } from "vitest"

import {
  createLabelSchema,
  normalizeLabelName,
  setTaskLabelsSchema,
  updateLabelSchema,
} from "../../features/labels/label.schema"

describe("label validation", () => {
  it("normalizes display names, uniqueness keys, and colors", () => {
    expect(createLabelSchema.parse({ name: "  Needs   Review  ", color: "#A1B2C3" })).toEqual({
      name: "Needs Review",
      normalizedName: "needs review",
      color: "#a1b2c3",
    })
    expect(normalizeLabelName("  NEEDS\tReview ")).toBe("needs review")
  })

  it("rejects invalid colors, empty updates, and duplicate task-label IDs", () => {
    expect(createLabelSchema.safeParse({ name: "Urgent", color: "red" }).success).toBe(false)
    expect(updateLabelSchema.safeParse({}).success).toBe(false)
    const id = "00000000-0000-4000-8000-000000000001"
    expect(
      setTaskLabelsSchema.safeParse({
        projectId: "00000000-0000-4000-8000-000000000002",
        taskId: "00000000-0000-4000-8000-000000000003",
        labelIds: [id, id],
      }).success,
    ).toBe(false)
  })
})
