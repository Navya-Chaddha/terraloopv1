"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  Upload,
  Store,
  Sparkles,
  Camera,
  X,
  Check,
  Loader2,
  Trophy,
  Star,
  ImageIcon,
  RotateCcw,
  Leaf,
  Droplets,
  Utensils,
  AlertCircle,
  Layers,
  MapPin,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggle } from "@/components/theme-toggle"
import type { GrocerListing } from "@/lib/store"
import { useLocalization, type Language } from "@/lib/localization"
import { createListing, getGrocerListingsFromApi } from "@/lib/listing-service"
import { compressPhoto } from "@/lib/image-client"
import { classifyFruitCategory } from "@/lib/fruit-category"
import {
  autoDetectLocation,
  getSavedLocation,
  getLocationStatus,
  isWithinNoidaRegion,
  NOIDA_SECTORS,
  saveUserLocation,
  type UserLocation,
} from "@/lib/location"
import { useUser } from "@/contexts/UserContext"

interface DetectedFruit {
  fruitType: string
  imageIndices: number[]
  rating: number
  consumeStatus: string
  shelfLife: string
  verdict: string
  alternativeUses: string[]
  category?: "climacteric" | "non-climacteric"
  recommendedUses: string[]
  qualityGrade: string
  priceEstimate: number
}

interface MultiAnalysisResult {
  isMixedFruits: boolean
  summary: string
  fruits: DetectedFruit[]
  sourceImages: string[]
}

export default function GrocerPage() {
  const { user: authUser, isLoading: isAuthLoading } = useUser()
  const [uploadedFruits, setUploadedFruits] = useState<GrocerListing[]>([])
  const [currentImages, setCurrentImages] = useState<(string | null)[]>([null, null, null, null])
  const [isDragging, setIsDragging] = useState<number | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<MultiAnalysisResult | null>(null)
  const [analysisStep, setAnalysisStep] = useState(0)
  const [xpEarned, setXpEarned] = useState(0)
  const [t, setT] = useState<ReturnType<typeof useLocalization>["t"] | null>(null)
  const [adjustedPrices, setAdjustedPrices] = useState<Record<number, number>>({})
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [listedIndices, setListedIndices] = useState<number[]>([])
  const [grocerCoords, setGrocerCoords] = useState<UserLocation | null>(null)
  const [justListedBanner, setJustListedBanner] = useState<string | null>(null)
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null])

  const ANGLE_LABELS = t ? [t.frontView, t.sideView, t.topView, t.closeUp] : ["Front View", "Side View", "Top View", "Close-up"]

  useEffect(() => {
    const savedLang = (localStorage.getItem("terraloop_language") as Language) || "en"
    import("@/lib/localization").then(mod => {
      setT(mod.getTranslation(savedLang))
    })

    if (!isAuthLoading && authUser?.role === "grocer") {
      getGrocerListingsFromApi()
        .then((listings) => {
          setUploadedFruits(listings)
          setXpEarned(listings.length * 50)
        })
        .catch((error: unknown) => {
          setAnalysisError(error instanceof Error ? error.message : "Could not load your listings")
        })
    }

    const saved = getSavedLocation()
    if (saved) {
      setGrocerCoords(saved)
    } else {
      autoDetectLocation()
        .then((loc) => setGrocerCoords(loc))
        .catch(() => {
          // Non-fatal; grocer can still list locally or retry location
        })
    }
  }, [authUser, isAuthLoading])

  const uploadedCount = currentImages.filter(img => img !== null).length

  const handleFile = useCallback(async (file: File, index: number) => {
    try {
      const image = await compressPhoto(file, 1200)
      setCurrentImages(prev => {
        const newImages = [...prev]
        newImages[index] = image
        return newImages
      })
      setAnalysisError(null)
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "Could not process this image")
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    setIsDragging(null)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file, index)
  }, [handleFile])

  const clearImage = (index: number) => {
    setCurrentImages(prev => {
      const newImages = [...prev]
      newImages[index] = null
      return newImages
    })
    if (fileInputRefs.current[index]) {
      fileInputRefs.current[index]!.value = ""
    }
    setAnalysisResult(null)
    setAnalysisError(null)
    setListedIndices([])
  }

  const clearAllImages = () => {
    setCurrentImages([null, null, null, null])
    setAnalysisResult(null)
    setAnalysisError(null)
    setListedIndices([])
    fileInputRefs.current.forEach(ref => {
      if (ref) ref.value = ""
    })
  }

  const analyzeImages = async () => {
    const validImages = currentImages.filter((img): img is string => img !== null)
    if (validImages.length < 4) return

    setIsAnalyzing(true)
    setAnalysisError(null)
    setListedIndices([])
    setAnalysisStep(1)

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: validImages }),
      })

      setAnalysisStep(2)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed")
      }

      setAnalysisStep(3)

      let rawParsed: Record<string, unknown>
      try {
        const cleanedText = String(data.analysis || "").replace(/```json\n?|\n?```/g, "").trim()
        rawParsed = JSON.parse(cleanedText)
      } catch {
        throw new Error("Failed to parse AI analysis response")
      }

      // Support both multi-fruit payload { fruits: [...] } and legacy flat payload
      const rawFruits: DetectedFruit[] = Array.isArray(rawParsed.fruits)
        ? (rawParsed.fruits as DetectedFruit[])
        : [rawParsed as unknown as DetectedFruit]

      const normalizedFruits: DetectedFruit[] = rawFruits.map((fruit, idx) => {
        const validIndices = Array.isArray(fruit.imageIndices)
          ? fruit.imageIndices.filter(i => Number.isInteger(i) && i >= 0 && i < validImages.length)
          : []
        const normalizedName = (fruit.fruitType || "Fruit")
          .trim()
          .replace(/\b\w/g, c => c.toUpperCase())
        return {
          ...fruit,
          fruitType: normalizedName,
          imageIndices: validIndices.length > 0 ? validIndices : idx === 0 ? validImages.map((_, i) => i) : [idx % validImages.length],
          category: classifyFruitCategory(normalizedName),
          recommendedUses: Array.isArray(fruit.recommendedUses) ? fruit.recommendedUses : [],
          alternativeUses: Array.isArray(fruit.alternativeUses) ? fruit.alternativeUses : [],
          priceEstimate: Number(fruit.priceEstimate) || 100,
          rating: Number(fruit.rating) || 7,
        }
      })

      const initialPrices: Record<number, number> = {}
      const initialQuantities: Record<number, number> = {}
      normalizedFruits.forEach((fruit, idx) => {
        initialPrices[idx] = fruit.priceEstimate || 100
        initialQuantities[idx] = 1
      })

      setAdjustedPrices(initialPrices)
      setQuantities(initialQuantities)
      setAnalysisResult({
        isMixedFruits: Boolean(rawParsed.isMixedFruits) || normalizedFruits.length > 1,
        summary:
          typeof rawParsed.summary === "string" && rawParsed.summary.trim().length > 0
            ? rawParsed.summary
            : `Analyzed all ${validImages.length} photos.`,
        fruits: normalizedFruits,
        sourceImages: validImages,
      })
      setAnalysisStep(4)
    } catch (error) {
      console.error("Analysis error:", error)
      setAnalysisResult(null)
      setAnalysisError(error instanceof Error ? error.message : "Failed to analyze images")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const confirmSingleListing = async (fruitIndex: number) => {
    if (!analysisResult) return
    const fruit = analysisResult.fruits[fruitIndex]
    if (!fruit || listedIndices.includes(fruitIndex)) return
    if (!authUser || authUser.role !== "grocer") {
      setAnalysisError("Sign in with a grocer account to publish a listing.")
      return
    }

    const matchedImages = fruit.imageIndices
      .map(i => analysisResult.sourceImages[i])
      .filter((img): img is string => Boolean(img))

    let activeLocation = grocerCoords || getSavedLocation()
    if (!activeLocation) {
      try {
        activeLocation = await autoDetectLocation()
        setGrocerCoords(activeLocation)
      } catch {
        // Proceed below to check Noida region
      }
    }

    if (!activeLocation || !isWithinNoidaRegion(activeLocation.latitude, activeLocation.longitude)) {
      setAnalysisError("Please select a Noida sector above to publish a listing within the Noida service region.")
      return
    }

    const grocerLocation = activeLocation.label || "Noida"
    const listingData = {
      fruitName: fruit.fruitType,
      category: classifyFruitCategory(fruit.fruitType, fruit.category),
      freshness: fruit.rating,
      shelfLife: fruit.shelfLife,
      verdict: fruit.verdict,
      images: matchedImages.length > 0 ? matchedImages : analysisResult.sourceImages,
      recommendedUses: fruit.recommendedUses || [],
      grocerLocation,
      price: adjustedPrices[fruitIndex] ?? fruit.priceEstimate ?? 100,
      basePrice: fruit.priceEstimate ?? 100,
      quantity: quantities[fruitIndex] ?? 1,
      latitude: activeLocation.latitude,
      longitude: activeLocation.longitude,
    }

    let newListing: GrocerListing
    try {
      newListing = await createListing(listingData)
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : "Could not publish the listing")
      return
    }

    setAnalysisError(null)
    setUploadedFruits(prev => [...prev, newListing])
    setXpEarned(prev => prev + 50)
    setJustListedBanner(`${fruit.fruitType} is now live in the Buyer Marketplace!`)
    window.dispatchEvent(new Event("marketplaceUpdated"))

    const nextListed = [...listedIndices, fruitIndex]
    setListedIndices(nextListed)

    if (nextListed.length >= analysisResult.fruits.length) {
      clearAllImages()
    }
  }

  const confirmAllListings = async () => {
    if (!analysisResult) return
    for (let i = 0; i < analysisResult.fruits.length; i++) {
      if (!listedIndices.includes(i)) {
        await confirmSingleListing(i)
      }
    }
  }

  const getFreshnessColor = (rating: number) => {
    if (rating >= 8) return "text-emerald-600 dark:text-emerald-400"
    if (rating >= 5) return "text-amber-600 dark:text-amber-400"
    return "text-red-600 dark:text-red-400"
  }

  const getFreshnessBarColor = (rating: number) => {
    if (rating >= 8) return "bg-emerald-600"
    if (rating >= 5) return "bg-amber-500"
    return "bg-red-500"
  }

  const getQualityBadgeColor = (grade: string) => {
    switch (grade?.toLowerCase()) {
      case "excellent":
        return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
      case "good":
        return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300"
      case "fair":
        return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300"
      default:
        return "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300"
    }
  }

  const getUseIcon = (use: string) => {
    const lower = use.toLowerCase()
    if (lower.includes("face") || lower.includes("hair")) return <Droplets className="h-3 w-3" />
    if (lower.includes("compost") || lower.includes("fertilizer")) return <Leaf className="h-3 w-3" />
    return <Utensils className="h-3 w-3" />
  }

  if (!t) return null

  const remainingToList = analysisResult
    ? analysisResult.fruits.length - listedIndices.length
    : 0

  const isGrocerInNoida = grocerCoords
    ? isWithinNoidaRegion(grocerCoords.latitude, grocerCoords.longitude)
    : false

  const selectNoidaSector = (latitude: number, longitude: number, label: string) => {
    const chosen: UserLocation = {
      latitude,
      longitude,
      accuracy: 100,
      timestamp: Date.now(),
      label,
    }
    saveUserLocation(chosen)
    setGrocerCoords(chosen)
    setAnalysisError(null)
  }

  return (
    <div className="bg-botanical-subtle min-h-screen bg-background">
      {/* Header Strip */}
      <div className="bg-botanical-hero text-white">
        <div className="mx-auto max-w-5xl px-4 pb-14 pt-6 sm:px-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              asChild
              className="-ml-2 rounded-full text-white/90 hover:bg-white/15 hover:text-white"
            >
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t.back}
              </Link>
            </Button>
            <ThemeToggle className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:border-white/40 [&_svg]:text-white" />
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-md">
                <Store className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {t.grocerGuild}
                </h1>
                <p className="mt-1 text-sm text-emerald-100/85">
                  Upload 4 photos — we analyze every image together and group different fruits automatically
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-2 text-xs font-medium text-white ring-1 ring-white/20 backdrop-blur-sm">
                <MapPin className="h-3.5 w-3.5 text-emerald-200" />
                <span>{grocerCoords ? getLocationStatus(grocerCoords) : "Location pending"}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20 backdrop-blur-sm">
                <Trophy className="h-4 w-4 text-emerald-200" />
                <span>{xpEarned} {t.xpEarned}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="mx-auto -mt-6 max-w-5xl px-4 pb-16 sm:px-6">
        {!isGrocerInNoida && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-300">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>
                  {grocerCoords
                    ? "Detected location is outside Noida — choose your Noida sector to publish listings:"
                    : "Select your Noida sector so nearby buyers within 2.5 km can see your listings:"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {NOIDA_SECTORS.map((sector) => (
                  <button
                    key={sector.label}
                    type="button"
                    onClick={() => selectNoidaSector(sector.latitude, sector.longitude, sector.label)}
                    className="rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-950/60 dark:text-amber-200"
                  >
                    {sector.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Upload Section */}
          <div className="lg:col-span-3">
            <Card className="card-fresh overflow-hidden rounded-3xl border-border bg-card">
              <CardHeader className="border-b border-border/60 bg-secondary/40">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <Camera className="h-5 w-5 text-primary" />
                  {t.uploadPhotos}
                </CardTitle>
                <CardDescription>
                  Upload 4 angles of one fruit or up to 4 different fruits for separate AI scoring
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6">
                <div className="mb-6 grid grid-cols-2 gap-4">
                  {ANGLE_LABELS.map((label, index) => (
                    <div key={index} className="relative">
                      <p className="mb-2 text-xs font-semibold text-muted-foreground">
                        Photo {index + 1} • {label}
                      </p>
                      {!currentImages[index] ? (
                        <div
                          onDrop={(e) => handleDrop(e, index)}
                          onDragOver={(e) => { e.preventDefault(); setIsDragging(index) }}
                          onDragLeave={(e) => { e.preventDefault(); setIsDragging(null) }}
                          onClick={() => fileInputRefs.current[index]?.click()}
                          className={`flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all ${
                            isDragging === index
                              ? "border-primary bg-secondary/70"
                              : "border-border bg-muted/30 hover:border-primary/45 hover:bg-secondary/40"
                          }`}
                        >
                          <Upload className={`mb-2 h-6 w-6 ${isDragging === index ? "text-primary" : "text-muted-foreground/60"}`} />
                          <p className="px-2 text-center text-xs font-medium text-muted-foreground">
                            Click or drag photo
                          </p>
                        </div>
                      ) : (
                        <div className="relative aspect-square overflow-hidden rounded-2xl border border-primary/40 shadow-sm">
                          <Image
                            src={currentImages[index]!}
                            alt={label}
                            fill
                            className="object-cover"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute right-2 top-2 h-7 w-7 rounded-full shadow-md"
                            onClick={() => clearImage(index)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                          <div className="absolute bottom-2 left-2">
                            <Badge className="rounded-full bg-primary text-xs text-primary-foreground">
                              <Check className="mr-1 h-3 w-3" />
                              Ready
                            </Badge>
                          </div>
                        </div>
                      )}
                      <input
                        ref={(el) => { fileInputRefs.current[index] = el }}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], index)}
                        className="hidden"
                      />
                    </div>
                  ))}
                </div>

                {/* Progress indicator */}
                <div className="mb-5">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-muted-foreground">Photos uploaded</span>
                    <span className="font-semibold text-primary">{uploadedCount}/4</span>
                  </div>
                  <Progress value={(uploadedCount / 4) * 100} className="h-2" />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {uploadedCount > 0 && (
                    <Button
                      variant="outline"
                      onClick={clearAllImages}
                      className="rounded-full border-border px-5"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset
                    </Button>
                  )}
                  <Button
                    onClick={analyzeImages}
                    disabled={uploadedCount < 4 || isAnalyzing}
                    className="flex-1 rounded-full bg-primary py-6 text-base font-semibold text-primary-foreground shadow-md shadow-primary/15 hover:bg-primary/90"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {analysisStep === 1 && "Scanning all 4 images..."}
                        {analysisStep === 2 && "Detecting fruit types..."}
                        {analysisStep === 3 && "Analyzing freshness..."}
                        {analysisStep === 4 && "Finalizing..."}
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        {t.analyzeAI} (All 4 Photos)
                      </>
                    )}
                  </Button>
                </div>

                {analysisError && (
                  <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <p className="font-semibold">Unable to complete AI analysis</p>
                      <p className="mt-0.5 text-xs opacity-90">{analysisError}</p>
                    </div>
                  </div>
                )}

                {/* Analysis Results (Single or Multiple Detected Fruits) */}
                {analysisResult && (
                  <div className="mt-6 space-y-5">
                    {/* Summary Banner */}
                    <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-secondary/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                          <Layers className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-foreground">
                            {analysisResult.fruits.length > 1
                              ? `${analysisResult.fruits.length} Distinct Fruits Detected`
                              : `${analysisResult.fruits[0]?.fruitType} Detected Across All 4 Angles`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {analysisResult.summary}
                          </p>
                        </div>
                      </div>

                      {analysisResult.fruits.length > 1 && remainingToList > 1 && (
                        <Button
                          onClick={confirmAllListings}
                          size="sm"
                          className="shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <Check className="mr-1.5 h-3.5 w-3.5" />
                          List All ({remainingToList})
                        </Button>
                      )}
                    </div>

                    {/* Per-fruit Result Cards */}
                    {analysisResult.fruits.map((fruit, fruitIndex) => {
                      const isListed = listedIndices.includes(fruitIndex)
                      const currentPrice = adjustedPrices[fruitIndex] ?? fruit.priceEstimate ?? 100
                      const currentQty = quantities[fruitIndex] ?? 1

                      return (
                        <div
                          key={`${fruit.fruitType}-${fruitIndex}`}
                          className={`rounded-2xl border p-5 transition-all ${
                            isListed
                              ? "border-emerald-300 bg-emerald-50/60 opacity-75 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                              : "border-primary/20 bg-secondary/35"
                          }`}
                        >
                          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                            <h3 className="flex items-center gap-2 text-lg font-bold text-primary">
                              <Sparkles className="h-4 w-4" />
                              {fruit.fruitType}
                            </h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="rounded-full text-xs">
                                {fruit.imageIndices.length} photo{fruit.imageIndices.length !== 1 ? "s" : ""}
                              </Badge>
                              {isListed && (
                                <Badge className="rounded-full bg-emerald-600 text-white">
                                  <Check className="mr-1 h-3 w-3" />
                                  Listed
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Matched Photo Thumbnails */}
                          <div className="mb-4 flex flex-wrap gap-2">
                            {fruit.imageIndices.map((imgIdx) => {
                              const src = analysisResult.sourceImages[imgIdx]
                              if (!src) return null
                              return (
                                <div
                                  key={imgIdx}
                                  className="relative h-14 w-14 overflow-hidden rounded-xl border border-border bg-muted"
                                >
                                  <Image
                                    src={src}
                                    alt={`${fruit.fruitType} photo ${imgIdx + 1}`}
                                    fill
                                    className="object-cover"
                                  />
                                  <span className="absolute bottom-0.5 right-0.5 rounded bg-black/70 px-1 text-[10px] font-medium text-white">
                                    #{imgIdx + 1}
                                  </span>
                                </div>
                              )
                            })}
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">{t.category}</span>
                              <Badge
                                variant="outline"
                                className={
                                  fruit.category === "climacteric"
                                    ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300"
                                    : "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300"
                                }
                              >
                                {fruit.category}
                              </Badge>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Quality Grade</span>
                              <Badge variant="outline" className={getQualityBadgeColor(fruit.qualityGrade)}>
                                {fruit.qualityGrade}
                              </Badge>
                            </div>

                            <div>
                              <div className="mb-2 flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">{t.freshnessScore}</span>
                                <span className={`text-xl font-bold ${getFreshnessColor(fruit.rating)}`}>
                                  {fruit.rating}/10
                                </span>
                              </div>
                              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                                <div
                                  className={`h-full rounded-full transition-all ${getFreshnessBarColor(fruit.rating)}`}
                                  style={{ width: `${fruit.rating * 10}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">{t.shelfLife}</span>
                              <span className="font-semibold text-foreground">{fruit.shelfLife}</span>
                            </div>

                            <div className="space-y-3 rounded-xl bg-card p-4 ring-1 ring-border">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">{t.price}</span>
                                <span className="text-lg font-bold text-primary">Rs. {currentPrice}/kg</span>
                              </div>
                              <Slider
                                value={[currentPrice]}
                                min={Math.max(0, (fruit.priceEstimate || 100) - 45)}
                                max={(fruit.priceEstimate || 100) + 45}
                                step={5}
                                disabled={isListed}
                                onValueChange={(value) =>
                                  setAdjustedPrices(prev => ({ ...prev, [fruitIndex]: value[0] }))
                                }
                                className="w-full"
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Rs. {Math.max(0, (fruit.priceEstimate || 100) - 45)}</span>
                                <span className="font-medium text-primary">Suggested: Rs. {fruit.priceEstimate}</span>
                                <span>Rs. {(fruit.priceEstimate || 100) + 45}</span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-muted-foreground">Quantity Available (kg)</Label>
                              <div className="flex items-center gap-3">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  disabled={isListed}
                                  className="h-9 w-9 rounded-full"
                                  onClick={() =>
                                    setQuantities(prev => ({
                                      ...prev,
                                      [fruitIndex]: Math.max(1, (prev[fruitIndex] ?? 1) - 1),
                                    }))
                                  }
                                >
                                  -
                                </Button>
                                <Input
                                  type="number"
                                  value={currentQty}
                                  disabled={isListed}
                                  onChange={(e) =>
                                    setQuantities(prev => ({
                                      ...prev,
                                      [fruitIndex]: Math.max(1, parseInt(e.target.value) || 1),
                                    }))
                                  }
                                  className="w-20 text-center"
                                  min={1}
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  disabled={isListed}
                                  className="h-9 w-9 rounded-full"
                                  onClick={() =>
                                    setQuantities(prev => ({
                                      ...prev,
                                      [fruitIndex]: (prev[fruitIndex] ?? 1) + 1,
                                    }))
                                  }
                                >
                                  +
                                </Button>
                                <span className="text-sm text-muted-foreground">kg</span>
                              </div>
                            </div>

                            <div className="rounded-xl bg-card p-3.5 ring-1 ring-border">
                              <p className="text-sm text-muted-foreground">{fruit.verdict}</p>
                            </div>

                            <div>
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {t.recommendedUses}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {fruit.recommendedUses?.map((use, i) => (
                                  <Badge key={i} variant="secondary" className="rounded-full font-medium">
                                    {getUseIcon(use)}
                                    <span className="ml-1.5">{use}</span>
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <Button
                              onClick={() => confirmSingleListing(fruitIndex)}
                              disabled={isListed}
                              className="w-full rounded-full bg-primary py-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                            >
                              <Check className="mr-2 h-4 w-4" />
                              {isListed
                                ? `${fruit.fruitType} Listed`
                                : `${t.confirmListing} ${fruit.fruitType} (+50 XP)`}
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Listed Produce */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                <Store className="h-5 w-5 text-primary" />
                {t.yourListings}
              </h2>
              <Link
                href="/buyer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                View in Buyer
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {justListedBanner && (
              <div className="mb-4 flex items-center justify-between gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                <span className="font-medium">{justListedBanner}</span>
                <Link href="/buyer" className="shrink-0 font-bold underline">
                  Open Buyer
                </Link>
              </div>
            )}

            {uploadedFruits.length === 0 ? (
              <Card className="card-fresh rounded-3xl border-border bg-card">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
                    <ImageIcon className="h-7 w-7" />
                  </div>
                  <h3 className="mb-1 font-semibold text-foreground">{t.noListings}</h3>
                  <p className="max-w-xs text-sm text-muted-foreground">
                    Upload 4 photos of your produce to score freshness and publish locally.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {uploadedFruits.filter(f => !f.sold).map((fruit) => (
                  <Card key={fruit.id} className="card-fresh overflow-hidden rounded-2xl border-border bg-card">
                    <CardContent className="p-4">
                      <div className="mb-3 grid grid-cols-4 gap-1.5">
                        {fruit.images.slice(0, 4).map((img, i) => (
                          <div key={i} className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                            <Image
                              src={img}
                              alt={`${fruit.fruitName} view ${i + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex items-start justify-between">
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{fruit.fruitName}</h3>
                            <Badge className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                              <Check className="mr-1 h-3 w-3" />
                              Live
                            </Badge>
                          </div>
                          <div className="mb-2 flex items-center gap-3 text-sm text-muted-foreground">
                            <span className={`font-medium ${getFreshnessColor(fruit.freshness)}`}>
                              {t.freshness}: {fruit.freshness}/10
                            </span>
                            <span className="font-semibold text-foreground">Rs. {fruit.price}/kg</span>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              fruit.category === "climacteric"
                                ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300"
                                : "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300"
                            }
                          >
                            {fruit.category}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-primary">
                          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                          +50 XP
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
