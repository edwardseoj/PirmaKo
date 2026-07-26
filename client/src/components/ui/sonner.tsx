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
