"use client"

import { getSavedLocation } from "@/lib/location"
import { apiFetch } from "@/lib/api"

export interface GrocerListing {
  id: string
  fruitName: string
  category: "climacteric" | "non-climacteric"
  freshness: number
  shelfLife: string
  verdict: string
  images: string[]
  recommendedUses: string[]
  grocerName: string
  grocerPhone: string
  grocerLocation: string
  price: number
  basePrice: number
  priceMargin: number
  quantity: number
  listedAt: number
  sold: boolean
  latitude?: number
  longitude?: number
}

const STORAGE_KEY = "terraloop_grocer_listings"

// Noida sector locations for grocers
const DUMMY_LOCATIONS = [
  "Sector 18, Noida",
  "Sector 62, Noida",
  "Sector 50, Noida",
  "Sector 76, Noida",
  "Sector 137, Noida",
  "Sector 15, Noida",
  "Sector 44, Noida",
  "Sector 104, Noida",
]

// Get random location
export function getRandomLocation(): string {
  return DUMMY_LOCATIONS[Math.floor(Math.random() * DUMMY_LOCATIONS.length)]
}

// Get all listings
export function getAllListings(): GrocerListing[] {
  if (typeof window === "undefined") return []
  
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []
  
  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

// Get available listings (not sold)
export function getAvailableListings(): GrocerListing[] {
  return getAllListings().filter(listing => !listing.sold)
}

// Get listings by category
export function getListingsByCategory(category: "climacteric" | "non-climacteric"): GrocerListing[] {
  return getAvailableListings().filter(listing => listing.category === category)
}

// Add a new listing
export function addListing(
  listing: Omit<GrocerListing, "id" | "listedAt" | "sold" | "basePrice" | "priceMargin" | "quantity"> & { quantity?: number }
): GrocerListing {
  const basePrice = listing.price
  const priceMargin = 45 // Default margin of Rs 45
  const savedLoc = getSavedLocation()

  const newListing: GrocerListing = {
    ...listing,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    listedAt: Date.now(),
    sold: false,
    basePrice,
    priceMargin,
    quantity: listing.quantity || 1,
    latitude: listing.latitude ?? savedLoc?.latitude,
    longitude: listing.longitude ?? savedLoc?.longitude,
  }

  const listings = getAllListings()
  listings.push(newListing)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(listings))
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("marketplaceUpdated"))
  }

  return newListing
}

// Update listing price
export function updateListingPrice(listingId: string, newPrice: number): GrocerListing | null {
  const listings = getAllListings()
  const index = listings.findIndex(l => l.id === listingId)
  
  if (index === -1) return null
  
  const listing = listings[index]
  const minPrice = listing.basePrice - listing.priceMargin
  const maxPrice = listing.basePrice + listing.priceMargin
  
  // Clamp price within allowed range
  listings[index].price = Math.max(minPrice, Math.min(maxPrice, newPrice))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(listings))
  
  return listings[index]
}

// Update listing quantity
export function updateListingQuantity(listingId: string, quantity: number): GrocerListing | null {
  const listings = getAllListings()
  const index = listings.findIndex(l => l.id === listingId)
  
  if (index === -1) return null
  
  listings[index].quantity = Math.max(0, quantity)
  if (listings[index].quantity === 0) {
    listings[index].sold = true
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(listings))
  
  return listings[index]
}

// Purchase a listing (reduce quantity or mark as sold)
export function purchaseListing(listingId: string, quantityPurchased?: number): GrocerListing | null {
  const listings = getAllListings()
  const index = listings.findIndex(l => l.id === listingId)

  if (index === -1) return null

  if (quantityPurchased && listings[index].quantity > quantityPurchased) {
    listings[index].quantity -= quantityPurchased
  } else {
    listings[index].quantity = 0
    listings[index].sold = true
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(listings))
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("marketplaceUpdated"))
  }

  return listings[index]
}

// Get grocer's own listings
export function getGrocerListings(grocerPhone: string): GrocerListing[] {
  return getAllListings().filter(listing => listing.grocerPhone === grocerPhone)
}

// Get recommended uses based on freshness
export function getRecommendedUses(freshness: number): string[] {
  if (freshness >= 8) {
    return ["Fresh Eating", "Salads", "Smoothies", "Desserts", "Gift Baskets"]
  } else if (freshness >= 6) {
    return ["Fresh Juice", "Smoothies", "Cooking", "Baking", "Jams"]
  } else if (freshness >= 4) {
    return ["Cooking", "Baking", "Face Mask", "Hair Mask", "Composting"]
  } else {
    return ["Composting", "Plant Fertilizer", "Animal Feed"]
  }
}

// Get current user info from storage
export function getCurrentUser(): { name: string; phone: string } | null {
  if (typeof window === "undefined") return null
  
  const name = localStorage.getItem("terraloop_name")
  const phone = localStorage.getItem("terraloop_phone")
  
  if (!name || !phone) return null
  return { name, phone }
}

// Save user info
export function saveUserInfo(name: string, phone: string): void {
  localStorage.setItem("terraloop_name", name)
  localStorage.setItem("terraloop_phone", phone)
}

// Cart functionality
const CART_KEY = "terraloop_cart"

export interface CartItem {
  id: string
  type: "fruit" | "listing"
  name: string
  price: number
  unit: string
  quantity: number
  maxQuantity: number
  image: string
  category: "climacteric" | "non-climacteric"
  sellerName: string
  sellerPhone: string
  sellerAddress: string
}

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return []
  
  const stored = localStorage.getItem(CART_KEY)
  if (!stored) return []
  
  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

export function addToCart(item: Omit<CartItem, "quantity">): boolean {
  const cart = getCart()
  const existingIndex = cart.findIndex(i => i.id === item.id)
  
  if (existingIndex !== -1) {
    // Check if we can add more
    if (cart[existingIndex].quantity >= cart[existingIndex].maxQuantity) {
      return false // Cannot add more than available
    }
    cart[existingIndex].quantity += 1
  } else {
    if (item.maxQuantity < 1) return false
    cart.push({ ...item, quantity: 1 })
  }
  
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  // Dispatch storage event for cross-component sync
  window.dispatchEvent(new Event("cartUpdated"))
  return true
}

export function removeFromCart(itemId: string): void {
  const cart = getCart().filter(item => item.id !== itemId)
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
  window.dispatchEvent(new Event("cartUpdated"))
}

export function updateCartQuantity(itemId: string, quantity: number): boolean {
  const cart = getCart()
  const index = cart.findIndex(i => i.id === itemId)
  
  if (index !== -1) {
    if (quantity <= 0) {
      cart.splice(index, 1)
    } else if (quantity > cart[index].maxQuantity) {
      return false // Cannot exceed max quantity
    } else {
      cart[index].quantity = quantity
    }
    localStorage.setItem(CART_KEY, JSON.stringify(cart))
    window.dispatchEvent(new Event("cartUpdated"))
    return true
  }
  return false
}

export function clearCart(): void {
  localStorage.removeItem(CART_KEY)
  window.dispatchEvent(new Event("cartUpdated"))
}

export function getCartTotal(): number {
  return getCart().reduce((total, item) => total + (item.price * item.quantity), 0)
}

export function getCartCount(): number {
  return getCart().reduce((count, item) => count + item.quantity, 0)
}

// Purchase Order for QR verification
export interface PurchaseOrder {
  id: string
  buyerName: string
  buyerPhone: string
  items: CartItem[]
  total: number
  buyerQR: string
  grocerQR: string
  status: "pending" | "completed"
  createdAt: number
}

const ORDERS_KEY = "terraloop_orders"

export function getOrders(): PurchaseOrder[] {
  if (typeof window === "undefined") return []
  
  const stored = localStorage.getItem(ORDERS_KEY)
  if (!stored) return []
  
  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

// Generate unique QR code content
function generateQRContent(prefix: string): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 8)
  return `${prefix}_${timestamp}_${random}`.toUpperCase()
}

// Initiate purchase - removes items from marketplace immediately and generates QR codes
export async function initiatePurchase(buyerName: string, buyerPhone: string): Promise<PurchaseOrder | null> {
  const cart = getCart()
  if (cart.length === 0) return null
  if (cart.some((item) => item.type !== "listing")) {
    throw new Error("Remove unavailable demo items from your cart before checkout.")
  }

  const { orders: databaseOrders } = await apiFetch<{
    orders: Array<{
      id: number
      listing_id: number
      product_name: string
      image_url: string | null
      quantity: number
      total_price: number | string
    }>
  }>("/api/orders/checkout", {
    method: "POST",
    body: JSON.stringify({
      items: cart.map((item) => ({
        listing_id: Number(item.id),
        quantity: item.quantity,
      })),
    }),
  })
  if (databaseOrders.length !== cart.length) {
    throw new Error("The server returned an incomplete order. Please check your orders before retrying.")
  }

  const orderedItems = databaseOrders.map((order) => {
    const cartItem = cart.find((item) => Number(item.id) === order.listing_id)
    if (!cartItem) throw new Error("The server returned an unexpected listing in the order.")
    return {
      ...cartItem,
      name: order.product_name,
      image: order.image_url || cartItem.image,
      price: Number(order.total_price) / order.quantity,
    }
  })
  const total = databaseOrders.reduce((sum, order) => sum + Number(order.total_price), 0)
  
  // Generate unique QR codes for buyer and grocer
  const buyerQR = generateQRContent("TL_BUY")
  const grocerQR = generateQRContent("TL_SEL")
  
  const order: PurchaseOrder = {
    id: databaseOrders.map((item) => item.id).join("-"),
    buyerName,
    buyerPhone,
    items: orderedItems,
    total,
    buyerQR,
    grocerQR,
    status: "pending",
    createdAt: Date.now(),
  }
  
  const savedOrders = getOrders()
  savedOrders.push(order)
  localStorage.setItem(ORDERS_KEY, JSON.stringify(savedOrders))
  
  clearCart()
  window.dispatchEvent(new Event("marketplaceUpdated"))
  
  return order
}
