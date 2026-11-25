"use client"

import Link from "next/link"
import Image from "next/image"
import { Leaf, ArrowLeft, Sun, Snowflake, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { fruits } from "@/lib/fruit-data"

const climactericFruits = fruits.filter(f => f.category === "climacteric")
const nonClimactericFruits = fruits.filter(f => f.category === "non-climacteric")

export default function BrowseFruitsPage() {
  return (
    <div className="bg-botanical-subtle min-h-screen bg-background">
      {/* Header Hero */}
      <div className="bg-botanical-hero text-white">
        <div className="mx-auto max-w-6xl px-4 pb-14 pt-6 sm:px-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              asChild
              className="-ml-2 rounded-full text-white/90 hover:bg-white/15 hover:text-white"
            >
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <ThemeToggle className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:border-white/40 [&_svg]:text-white" />
          </div>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-md">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Produce Freshness Guide
              </h1>
              <p className="mt-1 text-sm text-emerald-100/85">
                Explore climacteric and non-climacteric fruits available across TerraLoop
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Climacteric Fruits Section */}
        <section className="mb-14">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-500/20">
                <Sun className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Climacteric Fruits</h2>
                <p className="text-sm text-muted-foreground">Continue ripening after harvest</p>
              </div>
            </div>
            <Button variant="outline" asChild className="hidden rounded-full sm:flex">
              <Link href="/marketplace?category=climacteric">
                View in Marketplace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {climactericFruits.map((fruit) => (
              <Link
                key={fruit.id}
                href="/marketplace?category=climacteric"
                className="group"
              >
                <Card className="card-fresh overflow-hidden rounded-2xl border-border bg-card">
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <Image
                      src={fruit.image}
                      alt={fruit.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                  </div>
                  <CardContent className="p-3.5 text-center">
                    <h3 className="font-semibold text-foreground">{fruit.name}</h3>
                    <span className="mt-1.5 inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                      Climacteric
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <Button variant="outline" asChild className="mt-4 w-full rounded-full sm:hidden">
            <Link href="/marketplace?category=climacteric">
              View All Climacteric Fruits
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>

        {/* Non-Climacteric Fruits Section */}
        <section className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-500/20">
                <Snowflake className="h-5 w-5 text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Non-Climacteric Fruits</h2>
                <p className="text-sm text-muted-foreground">Harvested at peak ripeness</p>
              </div>
            </div>
            <Button variant="outline" asChild className="hidden rounded-full sm:flex">
              <Link href="/marketplace?category=non-climacteric">
                View in Marketplace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {nonClimactericFruits.map((fruit) => (
              <Link
                key={fruit.id}
                href="/marketplace?category=non-climacteric"
                className="group"
              >
                <Card className="card-fresh overflow-hidden rounded-2xl border-border bg-card">
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <Image
                      src={fruit.image}
                      alt={fruit.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                  </div>
                  <CardContent className="p-3.5 text-center">
                    <h3 className="font-semibold text-foreground">{fruit.name}</h3>
                    <span className="mt-1.5 inline-block rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-800 dark:bg-sky-500/15 dark:text-sky-300">
                      Non-Climacteric
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          <Button variant="outline" asChild className="mt-4 w-full rounded-full sm:hidden">
            <Link href="/marketplace?category=non-climacteric">
              View All Non-Climacteric Fruits
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>

        {/* CTA Section */}
        <div className="rounded-3xl border border-primary/20 bg-secondary/50 p-8 text-center">
          <h3 className="mb-2 text-xl font-bold text-foreground">Ready to shop fresh produce?</h3>
          <p className="mb-5 text-sm text-muted-foreground">
            Head to the marketplace to compare freshness ratings, shelf life, and nearby grocer prices
          </p>
          <Button asChild size="lg" className="rounded-full bg-primary px-8 text-primary-foreground hover:bg-primary/90">
            <Link href="/marketplace">
              Go to Marketplace
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
