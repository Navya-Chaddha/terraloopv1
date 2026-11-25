"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Leaf,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Store,
  ShoppingBag,
  TrendingUp,
  Clock,
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

const WEEKLY_RECOVERY = [
  { day: "S", height: "48%" },
  { day: "M", height: "72%" },
  { day: "T", height: "58%" },
  { day: "W", height: "40%" },
  { day: "T", height: "64%" },
  { day: "F", height: "86%" },
  { day: "S", height: "54%" },
]

export default function IntroPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section inspired by serene botanical healthtech UI */}
      <section className="bg-botanical-hero relative overflow-hidden text-white">
        {/* Top Nav */}
        <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-md">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">
              TerraLoop
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/browse-fruits"
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              Produce Guide
            </Link>
            <Link
              href="/marketplace"
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              Marketplace
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-white/12 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20 transition-colors hover:bg-white/20"
            >
              Sign In
            </Link>
            <ThemeToggle className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:border-white/40 [&_svg]:text-white" />
          </div>
        </header>

        {/* Hero Copy + Live Preview Card */}
        <div
          className={`relative z-10 mx-auto max-w-5xl px-6 pb-20 pt-10 text-center transition-all duration-700 ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-1.5 text-xs font-medium text-emerald-100 ring-1 ring-white/20 backdrop-blur-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-200" />
            AI-Verified Freshness for Neighbourhood Grocers
          </div>

          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl md:leading-[1.1]">
            Fresh produce recovery for local communities
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-emerald-100/85 sm:text-lg">
            Rescue ripe surplus fruit before it goes to waste. Neighbourhood grocers get instant AI freshness scoring and dynamic pricing, while nearby buyers shop verified quality.
          </p>

          {/* Primary Actions */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={() => router.push("/language")}
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-8 py-3.5 text-base font-semibold text-[#183d2b] shadow-lg shadow-black/15 transition-all hover:bg-emerald-50 hover:shadow-xl sm:w-auto"
            >
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <Link
              href="/marketplace"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white/12 px-7 py-3.5 text-base font-medium text-white ring-1 ring-white/25 backdrop-blur-sm transition-all hover:bg-white/20 sm:w-auto"
            >
              Explore Marketplace
            </Link>
          </div>

          {/* Floating Clean Dashboard Preview Card (echoing reference visual) */}
          <div className="mx-auto mt-14 max-w-md rounded-3xl bg-card p-5 text-left text-card-foreground shadow-2xl shadow-black/25 ring-1 ring-black/5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Live Snapshot</p>
                <h2 className="text-lg font-bold tracking-tight text-foreground">Dashboard</h2>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                <MapPin className="h-3.5 w-3.5" />
                2.5 km radius
              </span>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-background/70 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Avg. Shelf Life</span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Clock className="h-3.5 w-3.5" />
                  </span>
                </div>
                <p className="mt-1.5 text-base font-bold text-foreground">4–5 Days</p>
              </div>

              <div className="rounded-2xl border border-border bg-background/70 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Quality Status</span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </span>
                </div>
                <p className="mt-1.5 text-base font-bold text-foreground">9.1 / 10 Fresh</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Produce Rescued</span>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-secondary-foreground">
                  Weekly
                </span>
              </div>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-2xl font-bold tracking-tight text-foreground">
                    42 <span className="text-sm font-medium text-muted-foreground">kg</span>
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-primary">
                    <TrendingUp className="h-3 w-3" />
                    +18% this week
                  </p>
                </div>
                <div className="flex h-16 items-end gap-2">
                  {WEEKLY_RECOVERY.map((bar, idx) => (
                    <div key={idx} className="flex h-full flex-col items-center justify-end gap-1">
                      <div
                        className="w-3.5 rounded-t-md bg-primary/25 transition-all"
                        style={{ height: bar.height }}
                      />
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {bar.day}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Pillars Section */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="card-fresh rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
              <Store className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">For Neighbourhood Grocers</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Upload 4 quick angles of surplus fruit to receive an instant AI freshness rating, shelf-life estimate, and fair pricing guide.
            </p>
          </div>

          <div className="card-fresh rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">For Local Buyers</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Discover quality-graded climacteric and non-climacteric fruits from verified shops within 2.5 km with QR pickup.
            </p>
          </div>

          <div className="card-fresh rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
              <Leaf className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Zero-Waste Impact</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Every purchase rescues fresh food from spoilage, tracks real shelf-life, and recommends best culinary uses by ripeness.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
