"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sun, Snowflake } from "lucide-react"
import Link from "next/link"

interface CategoryCardProps {
  title: string
  description: string
  icon: React.ReactNode
  examples: string[]
  href: string
  badgeStyle: string
  iconBg: string
}

function CategoryCard({ title, description, icon, examples, href, badgeStyle, iconBg }: CategoryCardProps) {
  return (
    <Card className="card-fresh group relative overflow-hidden rounded-3xl border-border bg-card">
      <CardHeader className="pb-4">
        <div className={`mb-4 flex h-13 w-13 items-center justify-center rounded-2xl ${iconBg}`}>
          {icon}
        </div>
        <CardTitle className="text-xl font-bold text-foreground">{title}</CardTitle>
        <CardDescription className="text-muted-foreground">{description}</CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="mb-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Popular Examples
          </p>
          <div className="flex flex-wrap gap-2">
            {examples.map((example) => (
              <span
                key={example}
                className={`rounded-full px-3 py-1 text-xs font-medium ${badgeStyle}`}
              >
                {example}
              </span>
            ))}
          </div>
        </div>

        <Button asChild className="group/btn w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href={href}>
            Browse {title}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export function CategorySelection() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <CategoryCard
        title="Climacteric Fruits"
        description="Fruits that continue to ripen after harvest. They produce natural ethylene gas and can finish ripening at home."
        icon={<Sun className="h-6 w-6 text-amber-600 dark:text-amber-400" />}
        examples={["Apples", "Bananas", "Mangoes", "Avocados"]}
        href="/marketplace?category=climacteric"
        badgeStyle="bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30"
        iconBg="bg-amber-100 dark:bg-amber-500/20"
      />

      <CategoryCard
        title="Non-Climacteric Fruits"
        description="Fruits picked at peak ripeness that won't ripen further after harvest. Best enjoyed chilled and fresh."
        icon={<Snowflake className="h-6 w-6 text-sky-600 dark:text-sky-400" />}
        examples={["Oranges", "Grapes", "Strawberries", "Cherries"]}
        href="/marketplace?category=non-climacteric"
        badgeStyle="bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30"
        iconBg="bg-sky-100 dark:bg-sky-500/20"
      />
    </div>
  )
}
