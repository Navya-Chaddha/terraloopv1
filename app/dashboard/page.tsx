"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ShoppingCart,
  Store,
  Leaf,
  Trophy,
  CheckCircle2,
  LogOut,
  MapPin,
  Loader2,
  ArrowRight,
  BookOpen,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { useUser } from "@/contexts/UserContext"

export default function DashboardPage() {
  const router = useRouter()
  const {
    user,
    isAuthenticated,
    isLoading,
    logout,
    currentLocation,
    isLocationTracking,
    startLocationTracking,
    GEOFENCE_RADIUS_KM,
  } = useUser()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const legacyPhone = localStorage.getItem("terraloop_phone")
      const legacyName = localStorage.getItem("terraloop_name")
      if (!legacyPhone || !legacyName) {
        router.push("/login")
      }
    }
  }, [isAuthenticated, isLoading, router])

  useEffect(() => {
    if (isAuthenticated && !isLocationTracking) {
      startLocationTracking()
    }
  }, [isAuthenticated, isLocationTracking, startLocationTracking])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-botanical-subtle min-h-screen bg-background">
      {/* Top Botanical Header Strip */}
      <div className="bg-botanical-hero text-white">
        <div className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-md">
                <Leaf className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-white">
                TerraLoop
              </span>
            </Link>

            <div className="flex items-center gap-2.5">
              {currentLocation && (
                <div className="hidden items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-medium text-emerald-50 ring-1 ring-white/20 backdrop-blur-sm sm:flex">
                  <MapPin className="h-3.5 w-3.5 text-emerald-200" />
                  <span>{GEOFENCE_RADIUS_KM} km radius active</span>
                </div>
              )}
              <ThemeToggle className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:border-white/40 [&_svg]:text-white" />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-10 w-10 rounded-full border border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-emerald-200/90">
                Welcome back{user?.name && user.name !== "User" ? `, ${user.name}` : ""}
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Dashboard
              </h1>
              <p className="mt-1.5 text-sm text-emerald-100/85">
                Fresh produce recovery connecting local grocers and nearby buyers
              </p>
            </div>

            <div className="inline-flex items-center gap-3 self-start rounded-2xl bg-white/12 px-4 py-2.5 ring-1 ring-white/20 backdrop-blur-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Trophy className="h-4 w-4 text-emerald-100" />
              </div>
              <div>
                <p className="text-xs text-emerald-100/80">Impact Status</p>
                <p className="text-sm font-semibold text-white">Level 1 • 0 / 100 XP</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content overlapping Hero slightly */}
      <div className="mx-auto -mt-8 max-w-5xl px-4 pb-16 sm:px-6">
        {/* Role Selection Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Buyer Card */}
          <Link href="/buyer" className="group block">
            <Card className="card-fresh h-full overflow-hidden rounded-3xl border-border bg-card">
              <CardContent className="p-0">
                <div className="border-b border-border/60 bg-secondary/45 px-6 py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
                      <ShoppingCart className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-primary ring-1 ring-border">
                      For Shoppers
                    </span>
                  </div>
                  <h2 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
                    Buyer Marketplace
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Browse fresh surplus produce from verified neighbourhood grocers
                  </p>
                </div>

                <div className="px-6 py-6">
                  <ul className="space-y-3 text-sm text-foreground/90">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      <span>Filter by climacteric and non-climacteric fruits</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      <span>Check AI freshness scores and remaining shelf life</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      <span>Reserve nearby produce with instant QR pickup</span>
                    </li>
                  </ul>

                  <div className="mt-6 flex items-center justify-between rounded-2xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground transition-colors group-hover:bg-primary/90">
                    <span>Enter Marketplace</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Grocer Card */}
          <Link href="/grocer" className="group block">
            <Card className="card-fresh h-full overflow-hidden rounded-3xl border-border bg-card">
              <CardContent className="p-0">
                <div className="border-b border-border/60 bg-secondary/45 px-6 py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
                      <Store className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-primary ring-1 ring-border">
                      For Retailers
                    </span>
                  </div>
                  <h2 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
                    Grocer Studio
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Grade surplus fruit with AI and publish listings to nearby buyers
                  </p>
                </div>

                <div className="px-6 py-6">
                  <ul className="space-y-3 text-sm text-foreground/90">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      <span>Upload 4 quick angles of your fresh produce</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      <span>Instant AI freshness scoring and pricing estimates</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                      <span>Eliminate spoilage and reach shoppers within {GEOFENCE_RADIUS_KM} km</span>
                    </li>
                  </ul>

                  <div className="mt-6 flex items-center justify-between rounded-2xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground transition-colors group-hover:bg-primary/90">
                    <span>List Your Produce</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Helpful Quick Links */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link
            href="/browse-fruits"
            className="card-fresh flex items-center justify-between rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Browse Fruit Guide</p>
                <p className="text-xs text-muted-foreground">Learn ripening & storage tips</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>

          <Link
            href="/select-category"
            className="card-fresh flex items-center justify-between rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <Leaf className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Shop by Category</p>
                <p className="text-xs text-muted-foreground">Climacteric vs. non-climacteric</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </div>
    </div>
  )
}
