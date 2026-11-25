"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Check, Globe } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { languages } from "@/lib/localization"

export default function LanguagePage() {
  const router = useRouter()
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>("en")

  const handleContinue = () => {
    if (selectedLanguage) {
      localStorage.setItem("terraloop_language", selectedLanguage)
      router.push("/login")
    }
  }

  return (
    <div className="bg-botanical-subtle relative min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 pt-6">
        <button
          onClick={() => router.push("/")}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-secondary"
          aria-label="Back to home"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span>Step 1 of 3</span>
        </div>
        <ThemeToggle />
      </header>

      <div className="mx-auto max-w-lg px-4 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/15">
            <Globe className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Select Language
          </h1>
          <p className="mt-1.5 text-sm font-medium text-primary">
            भाषा चुनें • Choose your preferred language
          </p>
        </div>

        {/* Language Grid */}
        <div className="mb-8 grid grid-cols-2 gap-3">
          {languages.map((lang) => {
            const isSelected = selectedLanguage === lang.code
            return (
              <Card
                key={lang.code}
                onClick={() => setSelectedLanguage(lang.code)}
                className={`card-fresh cursor-pointer rounded-2xl border transition-all ${
                  isSelected
                    ? "border-primary bg-secondary/70 ring-2 ring-primary/20"
                    : "border-border bg-card hover:border-primary/35"
                }`}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {lang.native}
                    </p>
                    <p className="text-xs text-muted-foreground">{lang.name}</p>
                  </div>
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full border transition-colors ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background"
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!selectedLanguage}
          className={`group flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-base font-semibold transition-all ${
            selectedLanguage
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
              : "cursor-not-allowed bg-muted text-muted-foreground"
          }`}
        >
          Continue / जारी रखें
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>

        {/* Step indicator */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="h-1.5 w-8 rounded-full bg-primary" />
          <div className="h-1.5 w-8 rounded-full bg-border" />
          <div className="h-1.5 w-8 rounded-full bg-border" />
        </div>
      </div>
    </div>
  )
}
