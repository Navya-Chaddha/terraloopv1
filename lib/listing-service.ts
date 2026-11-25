import { apiFetch } from "@/lib/api"
import { classifyFruitCategory } from "@/lib/fruit-category"
import type { GrocerListing } from "@/lib/store"

interface MySqlListing {
  id: number
  product_name: string
  category: string
  quantity: number | string
  original_price: number | string
  discounted_price: number | string
  image_url: string | null
  images: string | null
  analysis_json: string | null
  location: string | null
  latitude: number | string | null
  longitude: number | string | null
  status: string
  created_at: string | Date
  grocer_name: string
  grocer_phone: string
}

export interface CreateListingInput {
  fruitName: string
  category: "climacteric" | "non-climacteric"
  freshness: number
  shelfLife: string
  verdict: string
  images: string[]
  recommendedUses: string[]
  grocerLocation: string
  price: number
  basePrice: number
  quantity: number
  latitude: number
  longitude: number
}

function parseAnalysis(value: string | null): Record<string, unknown> {
  if (!value) return {}
  try {
    const parsed: unknown = JSON.parse(value)
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {}
  } catch {
    return {}
  }
}

function mapListing(row: MySqlListing): GrocerListing {
  const analysis = parseAnalysis(row.analysis_json)
  let images: string[] = []
  if (row.images) {
    try {
      const parsed: unknown = JSON.parse(row.images)
      if (Array.isArray(parsed)) {
        images = parsed.filter((image): image is string => typeof image === "string")
      }
    } catch {
      images = []
    }
  }
  if (images.length === 0 && row.image_url) images = [row.image_url]
  const createdAt = new Date(row.created_at)
  const price = Number(row.discounted_price)

  return {
    id: String(row.id),
    fruitName: row.product_name,
    category: classifyFruitCategory(row.product_name, row.category),
    freshness: Number(analysis.freshness) || 7,
    shelfLife: typeof analysis.shelfLife === "string" ? analysis.shelfLife : "",
    verdict: typeof analysis.verdict === "string" ? analysis.verdict : "",
    images,
    recommendedUses: Array.isArray(analysis.recommendedUses)
      ? analysis.recommendedUses.filter((item): item is string => typeof item === "string")
      : [],
    grocerName: row.grocer_name,
    grocerPhone: row.grocer_phone,
    grocerLocation: row.location || "",
    price,
    basePrice: Number(row.original_price),
    priceMargin: Number(row.original_price) - price,
    quantity: Number(row.quantity),
    listedAt: Number.isNaN(createdAt.getTime()) ? Date.now() : createdAt.getTime(),
    sold: row.status !== "available",
    latitude: row.latitude === null ? undefined : Number(row.latitude),
    longitude: row.longitude === null ? undefined : Number(row.longitude),
  }
}

export async function createListing(input: CreateListingInput): Promise<GrocerListing> {
  const image = input.images[0] || ""
  const { listing } = await apiFetch<{ listing: MySqlListing }>("/api/listings", {
    method: "POST",
    body: JSON.stringify({
      product_name: input.fruitName,
      category: input.category,
      description: input.verdict,
      quantity: input.quantity,
      unit: "kg",
      original_price: input.basePrice,
      discounted_price: input.price,
      image_url: image,
      images: input.images,
      freshness: input.freshness,
      shelfLife: input.shelfLife,
      verdict: input.verdict,
      recommendedUses: input.recommendedUses,
      location: input.grocerLocation,
      latitude: input.latitude,
      longitude: input.longitude,
    }),
  })
  return mapListing(listing)
}

export async function getGrocerListingsFromApi(): Promise<GrocerListing[]> {
  const { listings } = await apiFetch<{ listings: MySqlListing[] }>("/api/listings/my")
  return listings.map(mapListing)
}
