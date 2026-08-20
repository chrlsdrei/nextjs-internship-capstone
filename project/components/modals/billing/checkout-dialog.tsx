import type { ComponentProps } from "react"

import { Modal } from "@/components/ui/modal"

export function CheckoutDialog(props: ComponentProps<typeof Modal>) {
  return <Modal {...props} className="max-w-xl" />
}
