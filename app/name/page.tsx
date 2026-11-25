"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowRight, User, Leaf, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { useUser } from "@/contexts/UserContext"

function getSafeRedirect(redirectParam: string | null): string {
  if (redirectParam && redirectParam.startsWith("/") && !redirectParam.startsWith("//")) {
    return redirectParam
  }
  return "/dashboard"
}

function NamePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTarget = getSafeRedirect(searchParams.get("redirect"))

  const { updateUserName } = useUser()
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleContinue = async () => {
    if (name.trim().length >= 2) {
      setIsSubmitting(true)
      updateUserName(name.trim())
      await new Promise(resolve => setTimeout(resolve, 400))
      router.push(redirectTarget)
    }
  }

  return (
    <div className="bg-botanical-subtle relative min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 pt-6">
        <button
          onClick={() => router.push("/login")}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-secondary"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-medium text-muted-foreground">Step 3 of 3</span>
        <ThemeToggle />
      </header>

      <div className="mx-auto max-w-md px-4 py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/15">
            <User className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            What&apos;s Your Name?
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Personalize your TerraLoop profile for orders and listings
          </p>
        </div>

        <Card className="card-fresh mb-6 rounded-2xl border-border bg-card">
          <CardContent className="p-6">
            <label className="mb-2 block text-sm font-medium text-foreground">
              Full Name or Shop Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleContinue()}
                placeholder="e.g., Aarav Sharma"
                className="h-12 w-full rounded-xl border border-border bg-input px-4 pr-11 text-base font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <Leaf className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/50" />
            </div>
          </CardContent>
        </Card>

        {name.trim().length >= 2 && (
          <div className="mb-6 rounded-2xl border border-primary/20 bg-secondary/60 p-4 text-center">
            <p className="text-xs font-medium text-muted-foreground">
              Welcome to TerraLoop
            </p>
            <p className="mt-0.5 text-lg font-bold text-primary">
              {name.trim()}
            </p>
          </div>
        )}

        <button
          onClick={handleContinue}
          disabled={name.trim().length < 2 || isSubmitting}
          className={`group flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-base font-semibold transition-all ${
            name.trim().length >= 2 && !isSubmitting
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
              : "cursor-not-allowed bg-muted text-muted-foreground"
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Setting up workspace...
            </>
          ) : (
            <>
              {redirectTarget === "/dashboard" ? "Continue to Dashboard" : "Continue"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </button>

        {/* Step indicator */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="h-1.5 w-8 rounded-full bg-primary" />
          <div className="h-1.5 w-8 rounded-full bg-primary" />
          <div className="h-1.5 w-8 rounded-full bg-primary" />
        </div>
      </div>
    </div>
  )
}

export default function NamePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      }
    >
      <NamePageContent />
    </Suspense>
  )
}
