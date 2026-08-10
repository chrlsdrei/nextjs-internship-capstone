export type LabelDto = {
  id: string
  projectId: string
  name: string
  color: string
  createdAt: string
  updatedAt: string
}

export type SetTaskLabelsCommand = {
  projectId: string
  taskId: string
  labelIds: string[]
}
