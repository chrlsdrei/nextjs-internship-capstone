import { TechFrameCard } from "@/components/ui/tech-frame-card"
import { EmailNotificationSettingsController } from "@/controllers/settings/email-notification-settings.controller"
import { getEmailNotificationPreference } from "@/features/notifications/queries/get-email-notification-preference"

export default async function SettingsPage() {
  const preference = await getEmailNotificationPreference()
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <TechFrameCard contentClassName="px-10 py-9 sm:px-14">
        <h1 className="font-bold text-3xl text-white">Account settings</h1>
        <p className="mt-2 text-cyan-100/70">Manage your account preferences.</p>
      </TechFrameCard>
      <EmailNotificationSettingsController preference={preference} />
    </div>
  )
}
