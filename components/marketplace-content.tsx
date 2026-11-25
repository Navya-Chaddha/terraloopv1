"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import Image from "next/image"
import QRCode from "react-qr-code"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import { AuthPromptDialog } from "@/components/auth-prompt-dialog"
import { useUser } from "@/contexts/UserContext"
import {
  ArrowLeft,
  ShoppingCart,
  Leaf,
  Sun,
  Snowflake,
  Info,
  CheckCircle2,
  XCircle,
  Star,
  Trophy,
  User,
  Phone,
  MapPin,
  Plus,
  Minus,
  X,
  QrCode,
  Package,
  Locate,
  Navigation,
  AlertCircle,
  Loader2,
  ShieldCheck,
  LogIn,
} from "lucide-react"
import { getCategoryInfo } from "@/lib/fruit-data"
import {
  addToCart,
  getCart,
  removeFromCart,
  updateCartQuantity,
  getCartCount,
  getCartTotal,
  initiatePurchase,
  getCurrentUser,
  type CartItem,
  type PurchaseOrder,
} from "@/lib/store"
import { useMarketplaceListings } from "@/hooks/useGeofencedListings"
import { NOIDA_SECTORS } from "@/lib/location"

interface MarketplaceContentProps {
  initialCategory: "climacteric" | "non-climacteric" | null
}

interface MarketplaceItem {
  id: string
  type: "fruit" | "listing"
  name: string
  category: "climacteric" | "non-climacteric"
  image: string
  description: string
  price: number
  unit: string
  freshness: number
  inStock: boolean
  quantity: number
  sellerName: string
  sellerPhone: string
  sellerAddress: string
  distanceKm?: number
}

function FreshnessBar({ freshness }: { freshness: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="freshness-bar h-full rounded-full"
          style={{ width: `${freshness * 10}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-primary">{freshness.toFixed(1)}/10</span>
    </div>
  )
}

function FruitCard({
  item,
  onAddToCart,
  cartQuantity,
}: {
  item: MarketplaceItem
  onAddToCart: (item: MarketplaceItem) => void
  cartQuantity: number
}) {
  const canAddMore = cartQuantity < item.quantity

  return (
    <Card className="card-fresh group flex h-full flex-col overflow-hidden rounded-3xl border-border bg-card">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

        {/* Top Left Tags */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge
            variant="secondary"
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium shadow-sm backdrop-blur-md ${
              item.category === "climacteric"
                ? "border-amber-200 bg-amber-50/95 text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/90 dark:text-amber-200"
                : "border-sky-200 bg-sky-50/95 text-sky-800 dark:border-sky-500/40 dark:bg-sky-950/90 dark:text-sky-200"
            }`}
          >
            {item.category === "climacteric" ? (
              <Sun className="mr-1 h-3 w-3" />
            ) : (
              <Snowflake className="mr-1 h-3 w-3" />
            )}
            {item.category === "climacteric" ? "Climacteric" : "Non-Climacteric"}
          </Badge>

          {item.type === "listing" && (
            <Badge className="rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-medium text-primary-foreground shadow-sm">
              Local Grocer
            </Badge>
          )}
        </div>

        {/* Top Right Tags */}
        <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
          {item.inStock ? (
            <Badge className="rounded-full bg-emerald-600/95 px-2.5 py-0.5 text-[11px] font-medium text-white shadow-sm backdrop-blur-md">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              In Stock
            </Badge>
          ) : (
            <Badge variant="destructive" className="rounded-full px-2.5 py-0.5 text-[11px] font-medium shadow-sm">
              <XCircle className="mr-1 h-3 w-3" />
              Sold Out
            </Badge>
          )}

          <Badge
            variant="secondary"
            className="rounded-full border border-border/80 bg-card/90 px-2.5 py-0.5 text-[11px] font-medium text-foreground shadow-sm backdrop-blur-md"
          >
            <Package className="mr-1 h-3 w-3 text-primary" />
            {item.quantity} {item.unit} left
          </Badge>
        </div>

        {/* Rating badge on hover */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/75 px-2.5 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
          <Star className="h-3 w-3 fill-emerald-400 text-emerald-400" />
          {item.freshness.toFixed(1)}/10 Freshness
        </div>
      </div>

      <CardContent className="flex-1 p-5">
        <div className="mb-1.5 flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold tracking-tight text-foreground">
            {item.name}
          </h3>
          <div className="shrink-0 text-right">
            <span className="text-lg font-bold text-primary">Rs. {item.price.toFixed(0)}</span>
            <span className="text-xs text-muted-foreground">/{item.unit}</span>
          </div>
        </div>

        <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {item.description}
        </p>

        <div className="mb-4">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Freshness Rating
          </p>
          <FreshnessBar freshness={item.freshness} />
        </div>

        {/* Seller Info */}
        <div className="space-y-1.5 rounded-2xl border border-border/70 bg-muted/50 p-3">
          <div className="flex items-center gap-2 text-xs text-foreground/85">
            <User className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate font-medium">{item.sellerName}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span>+91 {item.sellerPhone}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate">{item.sellerAddress}</span>
          </div>
          {item.distanceKm !== undefined && (
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <Navigation className="h-3.5 w-3.5 shrink-0" />
              <span>{item.distanceKm} km away</span>
            </div>
          )}
        </div>

        {item.category === "non-climacteric" && (
          <p className="mt-2.5 text-[11px] italic text-sky-700 dark:text-sky-400">
            *First-come, first-served availability at peak ripeness
          </p>
        )}
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <Button
          className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          disabled={!item.inStock || !canAddMore}
          onClick={() => onAddToCart(item)}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {!item.inStock ? "Unavailable" : !canAddMore ? "Max Qty Added" : "Add to Cart"}
        </Button>
      </CardFooter>
    </Card>
  )
}

function CategoryInfoBanner({ category }: { category: "climacteric" | "non-climacteric" }) {
  const info = getCategoryInfo(category)
  const isClimacteric = category === "climacteric"

  return (
    <div
      className={`rounded-2xl border p-5 ${
        isClimacteric
          ? "border-amber-200 bg-amber-50/70 dark:border-amber-500/30 dark:bg-amber-500/10"
          : "border-sky-200 bg-sky-50/70 dark:border-sky-500/30 dark:bg-sky-500/10"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            isClimacteric
              ? "bg-amber-100 dark:bg-amber-500/20"
              : "bg-sky-100 dark:bg-sky-500/20"
          }`}
        >
          {isClimacteric ? (
            <Sun className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          ) : (
            <Snowflake className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          )}
        </div>
        <div className="flex-1">
          <h2
            className={`mb-1 text-base font-bold ${
              isClimacteric ? "text-amber-900 dark:text-amber-300" : "text-sky-900 dark:text-sky-300"
            }`}
          >
            {info.title}
          </h2>
          <p className="mb-3 text-sm text-muted-foreground">{info.description}</p>
          <div className="flex items-start gap-2">
            <Info
              className={`mt-0.5 h-4 w-4 shrink-0 ${
                isClimacteric ? "text-amber-600 dark:text-amber-400" : "text-sky-600 dark:text-sky-400"
              }`}
            />
            <div className="space-y-1">
              {info.tips.map((tip, index) => (
                <p key={index} className="text-xs text-muted-foreground">
                  {tip}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CartSheet({
  cartItems,
  onUpdateQuantity,
  onRemove,
  onProceedToPayment,
  cartTotal,
  isCheckingOut,
  checkoutError,
}: {
  cartItems: CartItem[]
  onUpdateQuantity: (id: string, qty: number) => void
  onRemove: (id: string) => void
  onProceedToPayment: () => void
  cartTotal: number
  isCheckingOut: boolean
  checkoutError: string | null
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto py-4">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <p className="text-base font-semibold text-foreground">Your cart is empty</p>
            <p className="mt-1 text-xs text-muted-foreground">Add fresh fruits from the marketplace to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cartItems.map((item) => (
              <div key={item.id} className="flex gap-3 rounded-2xl border border-border bg-muted/40 p-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">Rs. {item.price}/{item.unit}</p>
                      <p className="text-xs text-primary">Available: {item.maxQuantity} {item.unit}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemove(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-full"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 rounded-full"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.maxQuantity}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="font-bold text-primary">
                      Rs. {(item.price * item.quantity).toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cartItems.length > 0 && (
        <div className="border-t border-border pt-4">
          {checkoutError && (
            <p className="mb-3 text-sm text-destructive" role="alert">
              {checkoutError}
            </p>
          )}
          <div className="mb-4 flex items-center justify-between">
            <span className="text-base font-medium text-foreground">Order Total</span>
            <span className="text-xl font-bold text-primary">Rs. {cartTotal.toFixed(0)}</span>
          </div>
          <Button
            className="w-full rounded-full bg-primary py-6 text-base font-semibold text-primary-foreground hover:bg-primary/90"
            onClick={onProceedToPayment}
            disabled={isCheckingOut}
          >
            {isCheckingOut ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <QrCode className="mr-2 h-4 w-4" />
            )}
            {isCheckingOut ? "Reserving items..." : "Generate Pickup QR"}
          </Button>
        </div>
      )}
    </div>
  )
}

function PaymentDialog({
  isOpen,
  onClose,
  order,
}: {
  isOpen: boolean
  onClose: () => void
  order: PurchaseOrder | null
}) {
  if (!order) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-3xl border-border bg-card text-card-foreground">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <DialogTitle className="text-2xl font-bold text-foreground">
            Order Confirmed
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Show this pickup verification QR code to the grocer when collecting your produce.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Order Summary */}
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
              Order Summary
            </h3>
            <div className="space-y-2 text-sm">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between text-foreground">
                  <span>{item.name} × {item.quantity}</span>
                  <span className="font-medium">Rs. {(item.price * item.quantity).toFixed(0)}</span>
                </div>
              ))}
              <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-bold text-primary">
                <span>Total Amount</span>
                <span>Rs. {order.total.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="rounded-2xl border border-border bg-background p-6 text-center">
            <h4 className="mb-3 text-sm font-semibold text-foreground">
              Pickup Verification QR
            </h4>
            <div className="mx-auto mb-3 inline-block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <QRCode value={order.buyerQR} size={168} />
            </div>
            <p className="text-xs text-muted-foreground">
              Present this code at pickup to verify your reservation
            </p>
            <p className="mt-2 break-all font-mono text-[11px] text-primary">
              {order.buyerQR}
            </p>
          </div>

          {/* Instructions */}
          <div className="rounded-2xl border border-primary/20 bg-secondary/50 p-4">
            <h4 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-primary">
              <CheckCircle2 className="h-4 w-4" />
              How Pickup Works
            </h4>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>1. Visit the grocer&apos;s pickup address shown on your listing</li>
              <li>2. Present this verification QR code at the counter</li>
              <li>3. Complete payment and collect your fresh produce</li>
            </ul>
          </div>

          <Button
            onClick={onClose}
            className="w-full rounded-full bg-primary py-5 font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Done & Continue Shopping
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function LocationStatusBanner({
  isTracking,
  location,
  locationError,
  isLoading,
  isInNoidaRegion,
  listingsCount,
  onStartTracking,
  onSelectPreset,
}: {
  isTracking: boolean
  location: { latitude: number; longitude: number; label?: string } | null
  locationError: string | null
  isLoading: boolean
  isInNoidaRegion: boolean
  listingsCount: number
  onStartTracking: () => void
  onSelectPreset: (lat: number, lng: number, label: string) => void
}) {
  if (location && !isInNoidaRegion) {
    return (
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                Outside Noida Region
              </p>
              <p className="text-xs text-amber-800/85 dark:text-amber-200/80">
                TerraLoop geofencing is currently limited to Noida ({location.latitude.toFixed(4)}, {location.longitude.toFixed(4)} is outside Noida). Select a Noida sector below to view local grocer listings:
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="self-start rounded-full sm:self-center"
            onClick={onStartTracking}
          >
            <Locate className="mr-1.5 h-3.5 w-3.5" />
            Retry GPS
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-amber-200/70 pt-3 dark:border-amber-500/20">
          {NOIDA_SECTORS.map((sector) => (
            <button
              key={sector.label}
              type="button"
              onClick={() => onSelectPreset(sector.latitude, sector.longitude, sector.label)}
              className="rounded-full border border-amber-300 bg-white/85 px-3 py-1 text-xs font-medium text-amber-900 transition-colors hover:bg-white dark:border-amber-500/40 dark:bg-amber-950/50 dark:text-amber-200"
            >
              {sector.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (locationError && !location) {
    return (
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                Location Access Unavailable
              </p>
              <p className="text-xs text-amber-800/85 dark:text-amber-200/80">{locationError}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="self-start rounded-full sm:self-center"
            onClick={onStartTracking}
          >
            <Locate className="mr-1.5 h-3.5 w-3.5" />
            Retry GPS
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-amber-200/70 pt-3 dark:border-amber-500/20">
          <span className="text-[11px] font-medium text-amber-900/80 dark:text-amber-200/80">
            Select a Noida sector (2.5 km radius):
          </span>
          {NOIDA_SECTORS.map((sector) => (
            <button
              key={sector.label}
              type="button"
              onClick={() => onSelectPreset(sector.latitude, sector.longitude, sector.label)}
              className="rounded-full border border-amber-300 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-amber-900 transition-colors hover:bg-white dark:border-amber-500/40 dark:bg-amber-950/50 dark:text-amber-200"
            >
              {sector.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (!isTracking || !location) {
    return (
      <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
          <Navigation className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Enable Location for Noida Grocers</p>
          <p className="text-xs text-muted-foreground">See fresh produce available within 2.5 km in Noida</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="self-start rounded-full border-primary/30 text-primary hover:bg-secondary sm:self-center"
          onClick={onStartTracking}
        >
          <Locate className="mr-1.5 h-3.5 w-3.5" />
          Enable
        </Button>
      </div>
    )
  }

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-primary/20 bg-secondary/60 p-4 sm:flex-row sm:items-center">
      <div className="flex flex-1 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            {isLoading
              ? "Searching Noida grocers..."
              : `Noida Geofence Active • ${listingsCount} nearby listing${listingsCount !== 1 ? "s" : ""} within 2.5 km`}
          </p>
          <p className="text-xs text-muted-foreground">
            {location.label
              ? `${location.label} (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`
              : `Noida Coordinates: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onStartTracking}
        className="self-start rounded-full text-xs text-primary hover:bg-primary/10 sm:self-center"
      >
        <Locate className="mr-1.5 h-3.5 w-3.5" />
        Refresh GPS
      </Button>
    </div>
  )
}

export function MarketplaceContent({ initialCategory }: MarketplaceContentProps) {
  const { isAuthenticated, user: authUser } = useUser()
  const [selectedCategory, setSelectedCategory] = useState<"all" | "climacteric" | "non-climacteric">(
    initialCategory || "all"
  )
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartCount, setCartCount] = useState(0)
  const [cartTotal, setCartTotal] = useState(0)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [isAuthPromptOpen, setIsAuthPromptOpen] = useState(false)
  const [authPromptItemName, setAuthPromptItemName] = useState<string | null>(null)
  const [authPromptAction, setAuthPromptAction] = useState<string>("add items to your cart")

  const {
    marketplaceItems: geofencedItems,
    isLoading: isGeofenceLoading,
    location,
    locationError,
    isLocationTracking,
    isInNoidaRegion,
    startTracking,
    setManualLocation,
  } = useMarketplaceListings({
    radiusKm: 2.5,
    enableRealTimeTracking: true,
    minMovementMeters: 100,
  })

  useEffect(() => {
    const loadCartData = () => {
      setCartItems(getCart())
      setCartCount(getCartCount())
      setCartTotal(getCartTotal())
    }

    loadCartData()

    const handleCartUpdate = () => {
      setCartItems(getCart())
      setCartCount(getCartCount())
      setCartTotal(getCartTotal())
    }

    window.addEventListener("cartUpdated", handleCartUpdate)
    window.addEventListener("storage", loadCartData)

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate)
      window.removeEventListener("storage", loadCartData)
    }
  }, [])

  const grocerItems: MarketplaceItem[] = geofencedItems.map(item => ({
    id: item.id,
    type: "listing" as const,
    name: item.name,
    category: item.category as "climacteric" | "non-climacteric",
    image: item.image,
    description: item.description,
    price: item.price,
    unit: item.unit,
    freshness: item.freshness,
    inStock: item.inStock,
    quantity: item.quantity,
    sellerName: item.sellerName,
    sellerPhone: item.sellerPhone,
    sellerAddress: item.sellerAddress,
    distanceKm: item.distanceKm,
  }))

  const allItems = grocerItems

  const filteredItems =
    selectedCategory === "all"
      ? allItems
      : allItems.filter(item => item.category === selectedCategory)

  const getCartQuantityForItem = (itemId: string): number => {
    const cartItem = cartItems.find(i => i.id === itemId)
    return cartItem?.quantity || 0
  }

  const handleAddToCart = (item: MarketplaceItem) => {
    if (!isAuthenticated) {
      setAuthPromptItemName(item.name)
      setAuthPromptAction("add items to your cart")
      setIsAuthPromptOpen(true)
      return
    }

    const success = addToCart({
      id: item.id,
      type: item.type,
      name: item.name,
      price: item.price,
      unit: item.unit,
      image: item.image,
      category: item.category,
      sellerName: item.sellerName,
      sellerPhone: item.sellerPhone,
      sellerAddress: item.sellerAddress,
      maxQuantity: item.quantity,
    })

    if (!success) {
      alert("Cannot add more than available quantity")
    }
  }

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (!isAuthenticated) {
      setAuthPromptItemName(null)
      setAuthPromptAction("update your cart")
      setIsAuthPromptOpen(true)
      return
    }

    const success = updateCartQuantity(id, quantity)
    if (!success && quantity > 0) {
      alert("Cannot exceed available quantity")
    }
  }

  const handleRemoveFromCart = (id: string) => {
    removeFromCart(id)
  }

  const handleProceedToPayment = async () => {
    if (!isAuthenticated) {
      setIsCartOpen(false)
      setAuthPromptItemName(null)
      setAuthPromptAction("complete your purchase")
      setIsAuthPromptOpen(true)
      return
    }

    const user = getCurrentUser()
    const buyerName = authUser?.name || user?.name || "Buyer"
    const buyerPhone = authUser?.phone || user?.phone || ""
    if (!buyerPhone) {
      setIsCartOpen(false)
      setAuthPromptItemName(null)
      setAuthPromptAction("complete your purchase")
      setIsAuthPromptOpen(true)
      return
    }

    setCheckoutError(null)
    setIsCheckingOut(true)
    try {
      const order = await initiatePurchase(buyerName, buyerPhone)
      if (!order) return
      setPurchaseOrder(order)
      setIsPaymentOpen(true)
      setIsCartOpen(false)
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Could not reserve your cart")
    } finally {
      setIsCheckingOut(false)
    }
  }

  const handleClosePayment = () => {
    setIsPaymentOpen(false)
    setPurchaseOrder(null)
  }

  return (
    <div className="bg-botanical-subtle min-h-screen bg-background">
      {/* Header Hero */}
      <div className="bg-botanical-hero text-white">
        <div className="mx-auto max-w-6xl px-4 pb-12 pt-6 sm:px-6">
          <div className="mb-6 flex items-center justify-between">
            <Button
              variant="ghost"
              asChild
              className="-ml-2 rounded-full text-white/90 hover:bg-white/15 hover:text-white"
            >
              <Link href={isAuthenticated ? "/dashboard" : "/"}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                <span className="sm:hidden">Back</span>
                <span className="hidden sm:inline">
                  {isAuthenticated ? "Back to Dashboard" : "Back to Home"}
                </span>
              </Link>
            </Button>

            <div className="flex items-center gap-2.5">
              {!isAuthenticated && (
                <Button
                  variant="outline"
                  asChild
                  className="rounded-full border-white/25 bg-white/15 px-2.5 text-white hover:bg-white/25 hover:text-white sm:px-4"
                >
                  <Link href="/login?redirect=%2Fmarketplace" aria-label="Sign in">
                    <LogIn className="mr-1.5 h-4 w-4" />
                    <span className="sr-only sm:not-sr-only">Sign In</span>
                  </Link>
                </Button>
              )}
              <div className="hidden items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-medium text-emerald-50 ring-1 ring-white/20 backdrop-blur-sm md:flex">
                <Trophy className="h-3.5 w-3.5 text-emerald-200" />
                <span>+5 XP per order</span>
              </div>

              <ThemeToggle className="border-white/25 bg-white/10 text-white hover:bg-white/20 hover:border-white/40 [&_svg]:text-white" />

              <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="relative rounded-full border-white/25 bg-white/15 text-white hover:bg-white/25 hover:text-white"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span className="ml-2 hidden text-sm font-medium sm:inline">Cart</span>
                    {cartCount > 0 && (
                      <span className="ml-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-[#183d2b]">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="border-border bg-card">
                  <SheetHeader>
                    <SheetTitle className="text-lg font-bold text-foreground">
                      Your Cart
                    </SheetTitle>
                  </SheetHeader>
                  <CartSheet
                    cartItems={cartItems}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemoveFromCart}
                    onProceedToPayment={handleProceedToPayment}
                    cartTotal={cartTotal}
                    isCheckingOut={isCheckingOut}
                    checkoutError={checkoutError}
                  />
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-md">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                TerraLoop Marketplace
              </h1>
              <p className="mt-0.5 text-sm text-emerald-100/85">
                Fresh produce with AI-verified freshness scores and shelf-life ratings
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Marketplace Content */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <LocationStatusBanner
          isTracking={isLocationTracking}
          location={location}
          locationError={locationError}
          isLoading={isGeofenceLoading}
          isInNoidaRegion={isInNoidaRegion}
          listingsCount={geofencedItems.length}
          onStartTracking={startTracking}
          onSelectPreset={setManualLocation}
        />

        {/* Category Filter Tabs */}
        <div className="mb-6">
          <Tabs
            value={selectedCategory}
            onValueChange={(v) => setSelectedCategory(v as typeof selectedCategory)}
          >
            <TabsList className="grid w-full max-w-md grid-cols-3 rounded-full bg-muted p-1">
              <TabsTrigger
                value="all"
                className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                All Produce
              </TabsTrigger>
              <TabsTrigger
                value="climacteric"
                className="gap-1.5 rounded-full data-[state=active]:bg-amber-600 data-[state=active]:text-white"
              >
                <Sun className="h-3.5 w-3.5" />
                Climacteric
              </TabsTrigger>
              <TabsTrigger
                value="non-climacteric"
                className="gap-1.5 rounded-full data-[state=active]:bg-sky-600 data-[state=active]:text-white"
              >
                <Snowflake className="h-3.5 w-3.5" />
                Non-Climacteric
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Category Info Banner */}
        {selectedCategory !== "all" && (
          <div className="mb-6">
            <CategoryInfoBanner category={selectedCategory} />
          </div>
        )}

        {/* Fruit Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <FruitCard
              key={item.id}
              item={item}
              onAddToCart={handleAddToCart}
              cartQuantity={getCartQuantityForItem(item.id)}
            />
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Leaf className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-lg font-semibold text-foreground">No fruits found</p>
            <p className="text-sm text-muted-foreground">Try selecting a different category</p>
          </div>
        )}
      </div>

      <PaymentDialog
        isOpen={isPaymentOpen}
        onClose={handleClosePayment}
        order={purchaseOrder}
      />

      <Suspense fallback={null}>
        <AuthPromptDialog
          isOpen={isAuthPromptOpen}
          onClose={() => setIsAuthPromptOpen(false)}
          itemName={authPromptItemName}
          actionText={authPromptAction}
        />
      </Suspense>
    </div>
  )
}
