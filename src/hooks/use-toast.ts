import { toast } from "sonner"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive" | "success"
}

export function useToast() {
  return {
    toast: ({ title, description, variant }: ToastProps) => {
      if (variant === "destructive") {
        toast.error(title, {
          description,
        })
      } else if (variant === "success") {
        toast.success(title, {
          description,
        })
      } else {
        toast(title, {
          description,
        })
      }
    },
    dismiss: (toastId?: string | number) => toast.dismiss(toastId),
  }
}
