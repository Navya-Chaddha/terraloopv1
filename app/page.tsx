"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Leaf } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

const missionPoints = [
  "Empower local grocers",
  "Make fresh produce accessible",
  "Reduce avoidable food waste",
]

const steps = [
  "Grocers upload surplus fruit.",
  "AI analyses freshness and estimates shelf life.",
  "Nearby buyers discover affordable produce and collect it.",
]

export default function IntroPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
          <Link href="/" className="flex items-center gap-2.5" aria-label="TerraLoop home">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">TerraLoop</span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-6">
            <Link
              href="/browse-fruits"
              className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-primary sm:inline"
            >
              Produce Guide
            </Link>
            <Link
              href="/marketplace"
              className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-primary sm:inline"
            >
              Marketplace
            </Link>
            <Link
              href="/login"
              className="border border-border px-3.5 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary sm:px-4"
            >
              Sign In
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      <section className="bg-forest-deep text-white">
        <div className="mx-auto grid max-w-7xl lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-center px-5 py-14 sm:px-8 sm:py-16 lg:px-14 lg:py-20">
            <p className="mb-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
              <span className="h-px w-8 bg-white/50" />
              Neighbourhood food rescue
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Good food deserves a second chance.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/80 sm:text-lg sm:leading-8">
              We connect neighbourhood grocers with nearby buyers to rescue surplus fresh produce
              before it goes to waste. Better prices for buyers, less waste for everyone.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => router.push("/language")}
                className="inline-flex min-h-12 items-center justify-center gap-2 bg-white px-6 py-3 text-sm font-semibold text-forest-deep transition-colors hover:bg-secondary"
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                href="/marketplace"
                className="inline-flex min-h-12 items-center justify-center border border-white/50 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Explore Marketplace
              </Link>
            </div>
          </div>

          <figure className="flex flex-col">
            <div className="relative min-h-[300px] flex-1 sm:min-h-[420px] lg:min-h-[560px]">
              <Image
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=85"
                alt="Fresh seasonal produce displayed at a neighbourhood market"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 48vw"
                className="object-cover"
                unoptimized
              />
            </div>
            <figcaption className="px-5 py-3 text-[11px] font-medium uppercase tracking-[0.16em] text-white/65 sm:px-8 lg:px-10">
              Good produce, kept in the neighbourhood
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Our mission
            </p>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Less food wasted. More communities nourished.
            </h2>
          </div>

          <ol className="mt-12 grid gap-8 md:grid-cols-3 md:gap-10">
            {missionPoints.map((point, index) => (
              <li key={point} className="border-t border-border pt-5">
                <span className="text-sm font-semibold tracking-wide text-primary">
                  0{index + 1}
                </span>
                <h3 className="mt-5 text-lg font-medium tracking-tight sm:text-xl">{point}</h3>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-secondary/45">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:px-10 lg:py-24">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              How it works
            </p>
            <h2 className="max-w-md text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              A better loop for good food.
            </h2>
          </div>

          <ol className="divide-y divide-border border-y border-border">
            {steps.map((step, index) => (
              <li key={step} className="flex gap-5 py-5 sm:gap-8 sm:py-6">
                <span className="pt-0.5 text-sm font-semibold tracking-wide text-primary">
                  0{index + 1}
                </span>
                <p className="text-base font-medium leading-7 sm:text-lg">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <Link href="/" className="font-semibold tracking-tight text-primary">
            TerraLoop
          </Link>
          <div className="flex gap-5">
            <Link href="/browse-fruits" className="transition-colors hover:text-primary">
              Produce Guide
            </Link>
            <Link href="/marketplace" className="transition-colors hover:text-primary">
              Marketplace
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
