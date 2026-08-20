import type { ComponentProps } from "react"

import { Modal } from "@/components/ui/modal"

export function AiFeatureDialog(props: ComponentProps<typeof Modal>) {
  return <Modal {...props} className="max-w-2xl" />
}
