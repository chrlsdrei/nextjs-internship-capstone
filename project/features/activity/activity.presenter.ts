import type { ActivityDto } from "@/features/activity/activity.types"

export type ActivityDescription = { title: string; detail?: string }

function roleName(role: string) {
  return role.replaceAll("_", " ")
}

function knownActivityDescription(activity: Extract<ActivityDto, { kind: "known" }>): ActivityDescription {
  const { event } = activity
  const actor = event.metadata.actorName

  switch (event.action) {
    case "workspace.created":
      return { title: `${actor} created the workspace`, detail: event.metadata.workspaceName }
    case "workspace.updated":
      return { title: `${actor} updated the workspace`, detail: event.metadata.workspaceName }
    case "workspace.settings_updated":
      return {
        title: `${actor} updated workspace settings`,
        detail: `Members ${event.metadata.membersCanCreateProjects ? "can" : "cannot"} create projects`,
      }
    case "workspace.member_role_updated":
      return {
        title: `${actor} changed ${event.metadata.memberName}’s workspace role`,
        detail: `${roleName(event.metadata.previousRole)} → ${roleName(event.metadata.role)}`,
      }
    case "workspace.member_removed":
      return { title: `${actor} removed ${event.metadata.memberName} from the workspace` }
    case "workspace.ownership_transferred":
      return {
        title: `${actor} transferred workspace ownership`,
        detail: `${event.metadata.previousOwnerName} → ${event.metadata.newOwnerName}`,
      }
    case "invitation.created":
      return {
        title: `${actor} invited ${event.metadata.invitedEmail}`,
        detail: event.metadata.projectTitle ?? undefined,
      }
    case "invitation.resent":
      return { title: `${actor} resent an invitation to ${event.metadata.invitedEmail}` }
    case "invitation.revoked":
      return { title: `${actor} revoked ${event.metadata.invitedEmail}’s invitation` }
    case "invitation.accepted":
      return { title: `${event.metadata.invitedEmail} accepted an invitation` }
    case "project.created":
      return { title: `${actor} created the project`, detail: event.metadata.projectTitle }
    case "project.updated":
      return { title: `${actor} updated the project`, detail: event.metadata.projectTitle }
    case "project.settings_updated":
      return {
        title: `${actor} updated board rules`,
        detail: `Editors ${event.metadata.editorsCanAssignTasks ? "can" : "cannot"} assign tasks`,
      }
    case "project.deleted":
      return { title: `${actor} deleted the project`, detail: event.metadata.projectTitle }
    case "project.member_added":
      return {
        title: `${actor} added ${event.metadata.memberName}`,
        detail: roleName(event.metadata.role),
      }
    case "project.member_role_updated":
      return {
        title: `${actor} changed ${event.metadata.memberName}’s board role`,
        detail: roleName(event.metadata.role),
      }
    case "project.member_removed":
      return { title: `${actor} removed ${event.metadata.memberName} from the project` }
    case "list.created":
      return { title: `${actor} created a list`, detail: event.metadata.listName }
    case "list.renamed":
      return { title: `${actor} renamed a list`, detail: event.metadata.listName }
    case "list.deleted":
      return { title: `${actor} deleted a list`, detail: event.metadata.listName }
    case "list.reordered":
      return { title: `${actor} reordered the board’s lists` }
    case "task.created":
      return { title: `${actor} created a task`, detail: event.metadata.taskTitle }
    case "task.updated":
      return { title: `${actor} updated a task`, detail: event.metadata.taskTitle }
    case "task.deleted":
      return { title: `${actor} deleted a task`, detail: event.metadata.taskTitle }
    case "task.moved":
      return {
        title: `${actor} moved ${event.metadata.taskTitle}`,
        detail: `${event.metadata.sourceListName} → ${event.metadata.targetListName}`,
      }
    case "task.reordered":
      return { title: `${actor} reordered tasks`, detail: event.metadata.listName }
  }
}

export function describeActivity(activity: ActivityDto): ActivityDescription {
  if (activity.kind === "known") return knownActivityDescription(activity)
  return { title: "Project activity was updated", detail: `Unsupported activity version ${activity.schemaVersion}` }
}
