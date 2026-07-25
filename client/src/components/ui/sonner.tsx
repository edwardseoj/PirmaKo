/**
 * SonnerToaster — A thin wrapper around the "sonner" toast library.
 *
 * What it does:
 * - Provides a global <Toaster /> component that renders toast notifications.
 * - Configured for dark mode with an indigo accent color to match PirmaKo's design.
 *
 * Usage:
 *   Import and render <SonnerToaster /> once in your app (usually in App.tsx).
 *   Then call toast("message") from anywhere to show a notification.
 */
import { Toaster } from "sonner"

export function SonnerToaster() {
  return (
    <Toaster
      theme="dark"
      position="bottom-center"
      richColors
      closeButton
      toastOptions={{
        style: {
          background: "#1e1e2e",
          border: "1px solid #313244",
          color: "#cdd6f4",
        },
      }}
    />
  )
}
