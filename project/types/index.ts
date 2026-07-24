import type {
  Comment,
  List,
  NewComment,
  NewList,
  NewProject,
  NewTask,
  NewUser,
  Project,
  Task,
  TaskPriority,
  User,
} from "@/lib/db/schema"

export type { Comment, List, NewComment, NewList, NewProject, NewTask, NewUser, Project, Task, TaskPriority, User }

export type TaskWithComments = Task & {
  comments: Comment[]
}

export type ListWithTasks = List & {
  tasks: TaskWithComments[]
}

export type ProjectWithLists = Project & {
  lists: ListWithTasks[]
}
