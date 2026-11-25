import Link from "next/link"
import { Leaf, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CategorySelection } from "@/components/category-selection"
import { ThemeToggle } from "@/components/theme-toggle"

export default function SelectCategoryPage() {
  return (
    <div className="bg-botanical-subtle min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Top Bar */}
        <div className="mb-8 flex items-center justify-between">
          <Button variant="ghost" asChild className="-ml-2 rounded-full">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <ThemeToggle />
        </div>

        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-13 w-13 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/15">
            <Leaf className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Choose Fruit Category
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Select between climacteric and non-climacteric fruits to browse the local marketplace
          </p>
        </div>

        <CategorySelection />

        {/* Educational Section */}
        <div className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-3 text-base font-bold text-foreground">Why does ripening type matter?</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Understanding whether a fruit is climacteric or non-climacteric helps you pick the right ripeness, store it properly, and prevent household food waste.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-500/25 dark:bg-amber-500/10">
              <p className="mb-1 text-sm font-semibold text-amber-900 dark:text-amber-300">
                Climacteric Fruits
              </p>
              <p className="text-xs leading-relaxed text-amber-800/90 dark:text-amber-200/80">
                Can be bought slightly firm and will ripen at home. Keep at room temperature until ripe, then refrigerate.
              </p>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 dark:border-sky-500/25 dark:bg-sky-500/10">
              <p className="mb-1 text-sm font-semibold text-sky-900 dark:text-sky-300">
                Non-Climacteric Fruits
              </p>
              <p className="text-xs leading-relaxed text-sky-800/90 dark:text-sky-200/80">
                Harvested at peak sweetness and won&apos;t ripen further. Refrigerate promptly for maximum freshness.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
