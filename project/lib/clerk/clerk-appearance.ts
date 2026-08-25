import type { ClerkProvider } from "@clerk/nextjs"
import type { ComponentProps } from "react"

export type ClerkAppearance = NonNullable<ComponentProps<typeof ClerkProvider>["appearance"]>

export const questBoardClerkAppearance: ClerkAppearance = {
  variables: {
    colorPrimary: "#22d3ee",
    colorBackground: "#061326",
    colorForeground: "#eaf8ff",
    colorMutedForeground: "#8fb6ca",
    colorInput: "#020b18",
    colorInputForeground: "#eaf8ff",
    colorDanger: "#fb7185",
    colorSuccess: "#34d399",
    borderRadius: "0.75rem",
    fontFamily: "var(--font-oxanium), sans-serif",
    fontFamilyButtons: "var(--font-oxanium), sans-serif",
  },
  elements: {
    cardBox: "shadow-none",
    card: "border border-cyan-400/35 bg-[#061326] text-cyan-50 shadow-[0_18px_55px_rgb(0_5_18/0.65),0_0_22px_rgb(34_211_238/0.16)]",
    modalBackdrop: "bg-[#020617]/85 backdrop-blur-sm",
    modalContent:
      "max-h-[calc(100dvh-1rem)] border border-cyan-400/35 bg-[#061326] shadow-[0_22px_70px_rgb(0_5_18/0.8),0_0_30px_rgb(34_211_238/0.18)]",
    headerTitle: "font-[var(--font-inter)] font-bold text-white",
    headerSubtitle: "font-[var(--font-sora)] text-cyan-100/65",
    socialButtonsBlockButton:
      "cursor-pointer border border-cyan-300/30 bg-blue-950/55 text-cyan-50 hover:bg-cyan-300/10",
    socialButtonsBlockButtonText: "font-semibold text-cyan-50",
    dividerLine: "bg-cyan-300/20",
    dividerText: "text-cyan-100/55",
    formFieldLabel: "font-[var(--font-sora)] font-semibold text-cyan-50",
    formFieldInput:
      "border border-cyan-300/30 bg-[#020b18] text-cyan-50 placeholder:text-cyan-100/35 focus:border-cyan-300 focus:shadow-[0_0_0_2px_rgb(34_211_238/0.18)]",
    formButtonPrimary:
      "cursor-pointer bg-cyan-400 font-bold text-blue-950 shadow-[0_0_16px_rgb(34_211_238/0.25)] hover:bg-cyan-300 focus:shadow-[0_0_0_2px_rgb(165_243_252/0.45)]",
    formFieldAction: "font-semibold text-cyan-300 hover:text-cyan-100",
    footer: "bg-transparent",
    footerActionText: "text-cyan-100/60",
    footerActionLink: "font-semibold text-cyan-300 hover:text-cyan-100",
    identityPreview: "border border-cyan-300/20 bg-blue-950/45",
    identityPreviewText: "text-cyan-50",
    userButtonPopoverCard:
      "border border-cyan-400/35 bg-[#061326] text-cyan-50 shadow-[0_18px_55px_rgb(0_5_18/0.75),0_0_22px_rgb(34_211_238/0.16)]",
    userButtonPopoverActionButton:
      "cursor-pointer border-cyan-300/15 text-cyan-50 hover:bg-cyan-300/10 hover:text-white",
    userButtonPopoverActionButtonIcon: "text-cyan-200",
    userButtonPopoverFooter: "border-cyan-300/15 bg-[#020b18] text-cyan-100/55",
    userPreviewMainIdentifier: "font-semibold text-white",
    userPreviewSecondaryIdentifier: "text-cyan-100/55",
    navbar: "border-cyan-300/20 bg-[#04101f]",
    navbarButton: "cursor-pointer text-cyan-100/65 hover:bg-cyan-300/10 hover:text-white",
    navbarButtonIcon: "text-cyan-200/70",
    pageScrollBox: "min-h-0 overflow-y-auto bg-[#061326]",
    profileSection: "border-cyan-300/15",
    profileSectionTitleText: "font-[var(--font-sora)] font-semibold text-cyan-50",
    profileSectionContent: "text-cyan-100/75",
    badge: "border border-cyan-300/20 bg-cyan-300/10 text-cyan-200",
    menuButton: "cursor-pointer text-cyan-100/60 hover:bg-cyan-300/10 hover:text-white",
    accordionTriggerButton: "cursor-pointer text-cyan-50 hover:bg-cyan-300/10",
    actionCard: "border border-cyan-300/20 bg-blue-950/35",
    actionCardButton: "cursor-pointer font-semibold text-cyan-300 hover:text-cyan-100",
  },
}
