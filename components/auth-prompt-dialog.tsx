"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { LogIn, ShieldCheck } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface AuthPromptDialogProps {
  isOpen: boolean
  onClose: () => void
  itemName?: string | null
  actionText?: string
}

export function AuthPromptDialog({
  isOpen,
  onClose,
  itemName,
  actionText = "add items to your cart",
}: AuthPromptDialogProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleSignIn = () => {
    const query = searchParams.toString()
    const currentPath = query ? `${pathname}?${query}` : pathname
    const safeRedirect = currentPath && currentPath.startsWith("/") ? currentPath : "/marketplace"
    onClose()
    router.push(`/login?redirect=${encodeURIComponent(safeRedirect)}`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-3xl border-border bg-card text-card-foreground">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Sign in required
          </DialogTitle>
          <DialogDescription className="pt-1 text-sm leading-relaxed text-muted-foreground">
            {itemName
              ? `Please log in or sign in to add ${itemName} to your cart and reserve local grocer pickup.`
              : `You're browsing as a guest. Please log in or sign in to ${actionText} and reserve local grocer pickup.`}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-2.5">
          <Button
            onClick={handleSignIn}
            className="w-full rounded-full bg-primary py-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Log In / Sign In
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full rounded-full text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Continue Exploring
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
