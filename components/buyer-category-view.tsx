"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft,
  Sun,
  Snowflake,
  Leaf,
  ShoppingCart,
  Star,
  Clock,
  Phone,
  MapPin,
  User,
  CheckCircle2,
  X,
  Utensils,
  Droplets,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthPromptDialog } from "@/components/auth-prompt-dialog"
import { useUser } from "@/contexts/UserContext"
import { fruits } from "@/lib/fruit-data"
import { purchaseListing, type GrocerListing } from "@/lib/store"
import { useGeofencedListings } from "@/hooks/useGeofencedListings"
import { type Language, getTranslation } from "@/lib/localization"

interface BuyerCategoryViewProps {
  category: "climacteric" | "non-climacteric"
}

export function BuyerCategoryView({ category }: BuyerCategoryViewProps) {
  const { isAuthenticated } = useUser()
  const { listings: nearbyListings } = useGeofencedListings({
    radiusKm: 2.5,
    enableRealTimeTracking: true,
  })
  const [purchasedItem, setPurchasedItem] = useState<GrocerListing | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false)
  const [authPromptItemName, setAuthPromptItemName] = useState<string | null>(null)
  const [t, setT] = useState<ReturnType<typeof getTranslation> | null>(null)

  const isClimacteric = category === "climacteric"
  const categoryFruits = fruits.filter(f => f.category === category)
  const grocerListings: (GrocerListing & { distanceKm?: number })[] = nearbyListings
    .filter(l => l.category === category && !l.sold)
    .map(l => ({
      id: l.id,
      fruitName: l.fruit_name,
      category: l.category,
      freshness: l.freshness,
      shelfLife: l.shelf_life || "2-3 Days",
      verdict: l.verdict || "",
      images: l.images || [],
      recommendedUses: l.recommended_uses || [],
      grocerName: l.grocer_name,
      grocerPhone: l.grocer_phone,
      grocerLocation: l.grocer_location,
      price: l.price,
      basePrice: l.base_price,
      priceMargin: l.price_margin,
      quantity: l.quantity,
      listedAt: new Date(l.listed_at).getTime(),
      sold: l.sold,
      distanceKm: l.distance_km,
    }))

  useEffect(() => {
    const savedLang = (localStorage.getItem("terraloop_language") as Language) || "en"
    setT(getTranslation(savedLang))
  }, [])

  const handlePurchase = (listing: GrocerListing) => {
    if (!isAuthenticated) {
      setAuthPromptItemName(listing.fruitName)
      setIsAuthPromptOpen(true)
      return
    }

    const purchased = purchaseListing(listing.id)
    if (purchased) {
      setPurchasedItem(purchased)
      setShowModal(true)
    }
  }

  const getUseIcon = (use: string) => {
    const lower = use.toLowerCase()
    if (lower.includes("face") || lower.includes("hair")) return <Droplets className="h-3 w-3" />
    if (lower.includes("compost") || lower.includes("fertilizer")) return <Leaf className="h-3 w-3" />
    return <Utensils className="h-3 w-3" />
  }

  if (!t) return null

  return (
    <div className="bg-botanical-subtle min-h-screen bg-background">
      {/* Purchase Success Modal */}
      {showModal && purchasedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <Card className="relative w-full max-w-md rounded-3xl border-border bg-card shadow-2xl">
            <CardContent className="p-6">
              <button
                onClick={() => setShowModal(false)}
                className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h2 className="mb-1 text-2xl font-bold text-foreground">
                  {t.purchaseSuccess}
                </h2>
                <p className="mb-6 text-sm text-muted-foreground">
                  {purchasedItem.fruitName} reserved for pickup
                </p>
              </div>

              <div className="space-y-3.5 rounded-2xl border border-border bg-muted/40 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-primary">
                  {t.grocerDetails}
                </h3>

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t.grocerName}</p>
                    <p className="text-sm font-semibold text-foreground">{purchasedItem.grocerName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t.grocerPhone}</p>
                    <p className="text-sm font-semibold text-foreground">+91 {purchasedItem.grocerPhone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-primary">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t.pickupLocation}</p>
                    <p className="text-sm font-semibold text-foreground">{purchasedItem.grocerLocation}</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setShowModal(false)}
                className="mt-6 w-full rounded-full bg-primary py-5 font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {t.continue}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header Hero */}
      <div className="bg-botanical-hero text-white">
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-6">
          <div className="mb-6 flex items-center justify-between">
            <Button
              variant="ghost"
              asChild
              className="-ml-2 rounded-full text-white/90 hover:bg-white/15 hover:text-white"
            >
              <Link href="/buyer">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t.back}
              </Link>
            </Button>
            <ThemeToggle className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:border-white/40 [&_svg]:text-white" />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-medium text-emerald-100 ring-1 ring-white/20">
            {isClimacteric ? <Sun className="h-3.5 w-3.5" /> : <Snowflake className="h-3.5 w-3.5" />}
            <span>{isClimacteric ? t.climactericDesc : t.nonClimactericDesc}</span>
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {isClimacteric ? t.climactericFruits : t.nonClimactericFruits}
          </h1>
          <p className="mt-1 text-sm text-emerald-100/85">
            {t.selectProduce}
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Grocer Listings Section */}
        {grocerListings.length > 0 && (
          <div className="mb-12">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-foreground">
              <Leaf className="h-5 w-5 text-primary" />
              Fresh from Local Grocers
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {grocerListings.map((listing) => (
                <Card key={listing.id} className="card-fresh group h-full overflow-hidden rounded-3xl border-border bg-card">
                  <CardContent className="p-0">
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      {listing.images[0] && (
                        <Image
                          src={listing.images[0]}
                          alt={listing.fruitName}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          unoptimized
                        />
                      )}
                      <div className="absolute left-3 top-3">
                        <Badge className="rounded-full bg-primary text-primary-foreground">
                          Fresh Listing
                        </Badge>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between opacity-0 transition-opacity group-hover:opacity-100">
                        <div className="flex items-center gap-1 rounded-full bg-black/75 px-2.5 py-1 text-xs text-white">
                          <Star className="h-3 w-3 fill-emerald-400 text-emerald-400" />
                          {listing.freshness}/10
                        </div>
                        <div className="flex items-center gap-1 rounded-full bg-black/75 px-2.5 py-1 text-xs text-white">
                          <Clock className="h-3 w-3" />
                          {listing.shelfLife}
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="font-bold text-foreground">{listing.fruitName}</h3>
                        <span className="text-lg font-bold text-primary">Rs. {listing.price}</span>
                      </div>

                      <div className="mb-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-primary" />
                          <span>{listing.grocerName}</span>
                        </span>
                        {listing.distanceKm !== undefined && (
                          <span className="font-medium text-emerald-700 dark:text-emerald-400">
                            {listing.distanceKm} km away
                          </span>
                        )}
                      </div>

                      <div className="mb-3">
                        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                          <span>{t.freshness}</span>
                          <span className="font-medium text-primary">{listing.freshness}/10</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${
                              listing.freshness >= 8
                                ? "bg-emerald-600"
                                : listing.freshness >= 5
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${listing.freshness * 10}%` }}
                          />
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {t.recommendedUses}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {listing.recommendedUses.slice(0, 3).map((use, i) => (
                            <Badge key={i} variant="secondary" className="rounded-full text-xs">
                              {getUseIcon(use)}
                              <span className="ml-1">{use}</span>
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={() => handlePurchase(listing)}
                        className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        {t.buyNow}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Default Fruits Grid */}
        <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-foreground">
          {isClimacteric ? (
            <Sun className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          ) : (
            <Snowflake className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          )}
          {t.browseCollection}
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {categoryFruits.map((fruit, index) => (
            <Link
              key={fruit.id}
              href={`/marketplace?category=${category}&fruit=${fruit.id}`}
              className="group block"
            >
              <Card className="card-fresh h-full overflow-hidden rounded-3xl border-border bg-card">
                <CardContent className="p-0">
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <Image
                      src={fruit.image}
                      alt={fruit.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                    <div className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-card/90 text-xs font-bold text-primary shadow-sm ring-1 ring-border">
                      #{index + 1}
                    </div>
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/75 px-2.5 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                      <Star className="h-3 w-3 fill-emerald-400 text-emerald-400" />
                      {fruit.freshness}/10
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-bold text-foreground">{fruit.name}</h3>
                      <span className="text-lg font-bold text-primary">
                        Rs. {fruit.price.toFixed(0)}
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{t.freshness}</span>
                        <span className="font-semibold text-primary">{fruit.freshness}/10</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="freshness-bar h-full rounded-full"
                          style={{ width: `${fruit.freshness * 10}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 rounded-full bg-secondary px-3 py-2 text-xs font-semibold text-secondary-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <ShoppingCart className="h-3.5 w-3.5" />
                      {t.viewMarketplace}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Storage Tip Section */}
        <div
          className={`mt-12 rounded-3xl border p-6 ${
            isClimacteric
              ? "border-amber-200 bg-amber-50/70 dark:border-amber-500/30 dark:bg-amber-500/10"
              : "border-sky-200 bg-sky-50/70 dark:border-sky-500/30 dark:bg-sky-500/10"
          }`}
        >
          <div className="flex items-start gap-4">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                isClimacteric
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                  : "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300"
              }`}
            >
              <Info className="h-5 w-5" />
            </div>
            <div>
              <h3 className="mb-1 text-base font-bold text-foreground">
                {isClimacteric ? "Storage Tip: Natural Ripening" : "Storage Tip: Peak Preservation"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isClimacteric
                  ? "Place climacteric fruits in a breathable paper bag at room temperature with a ripe banana to speed up ripening naturally using ethylene gas."
                  : "Non-climacteric fruits are harvested at peak ripeness and do not ripen further. Refrigerate promptly to preserve texture and sweetness."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <AuthPromptDialog
          isOpen={isAuthPromptOpen}
          onClose={() => setIsAuthPromptOpen(false)}
          itemName={authPromptItemName}
          actionText="purchase produce"
        />
      </Suspense>
    </div>
  )
}
