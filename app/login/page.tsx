"use client"

import { FormEvent, Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, Phone } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { useUser } from "@/contexts/UserContext"

function getSafeRedirect(redirectParam: string | null): string | null {
  if (!redirectParam) return null
  return redirectParam.startsWith("/") && !redirectParam.startsWith("//") ? redirectParam : null
}

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTarget = getSafeRedirect(searchParams.get("redirect"))
  const { login, isAuthenticated, isLoading: isAuthLoading, logout, user } = useUser()
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const continueToAccount = () => {
    router.push(redirectTarget || (user?.role === "grocer" ? "/grocer" : "/buyer"))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      const signedInUser = await login(identifier.trim(), password)
      router.push(redirectTarget || (signedInUser.role === "grocer" ? "/grocer" : "/buyer"))
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not sign in.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-botanical-subtle relative min-h-screen bg-background">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 pt-6">
        <button
          onClick={() => router.push(redirectTarget || "/")}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-secondary"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <ThemeToggle />
      </header>

      <main className="mx-auto max-w-md px-4 py-12">
        {!isAuthLoading && isAuthenticated && user && (
          <Card className="mb-6 rounded-2xl border-primary/25 bg-secondary/60 shadow-sm">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Active session</p>
                <p className="truncate text-sm font-medium text-foreground">{user.name} · +91 {user.phone}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={continueToAccount}
                  className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground"
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"
                >
                  Sign out
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/15">
            <Phone className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Sign in to TerraLoop</h1>
          <p className="mt-2 text-sm text-muted-foreground">Use your phone number or email and password.</p>
        </div>

        <Card className="card-fresh rounded-2xl border-border bg-card">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="identifier" className="mb-2 block text-sm font-medium text-foreground">
                  Phone number or email
                </label>
                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  required
                  className="h-12 w-full rounded-xl border border-border bg-input px-4 text-base font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="9876543210 or you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="h-12 w-full rounded-xl border border-border bg-input px-11 pr-12 text-base font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={isSubmitting || !identifier || !password}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign in"}
              </button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to TerraLoop?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </main>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  )
}
