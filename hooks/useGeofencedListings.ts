"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  autoDetectLocation,
  calculateDistanceKm,
  getSavedLocation,
  isWithinNoidaRegion,
  saveUserLocation,
} from "@/lib/location"
import { getAvailableListings, type GrocerListing } from "@/lib/store"

export interface GeoListing {
  id: string
  fruit_name: string
  category: "climacteric" | "non-climacteric"
  freshness: number
  shelf_life: string | null
  verdict: string | null
  images: string[]
  recommended_uses: string[]
  grocer_name: string
  grocer_phone: string
  grocer_location: string
  price: number
  base_price: number
  price_margin: number
  quantity: number
  sold: boolean
  listed_at: string
  latitude: number
  longitude: number
  distance_km?: number
}

export interface GeoLocation {
  latitude: number
  longitude: number
  accuracy: number
  label?: string
}

export interface UseGeofencedListingsOptions {
  radiusKm?: number
  enableRealTimeTracking?: boolean
  minMovementMeters?: number
}

export interface UseGeofencedListingsReturn {
  listings: GeoListing[]
  isLoading: boolean
  error: string | null
  location: GeoLocation | null
  locationError: string | null
  isLocationTracking: boolean
  isInNoidaRegion: boolean
  refetch: () => Promise<void>
  startTracking: () => void
  stopTracking: () => void
  setManualLocation: (latitude: number, longitude: number, label?: string) => void
}

function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  return calculateDistanceKm(lat1, lon1, lat2, lon2) * 1000
}

function localListingToGeo(
  listing: GrocerListing,
  userLat?: number,
  userLng?: number
): GeoListing {
  const hasCoords =
    typeof listing.latitude === "number" && typeof listing.longitude === "number"
  const hasUserLoc = typeof userLat === "number" && typeof userLng === "number"

  const distanceKm =
    hasCoords && hasUserLoc
      ? calculateDistanceKm(userLat!, userLng!, listing.latitude!, listing.longitude!)
      : hasUserLoc
      ? 0
      : undefined

  return {
    id: listing.id,
    fruit_name: listing.fruitName,
    category: listing.category,
    freshness: listing.freshness,
    shelf_life: listing.shelfLife || null,
    verdict: listing.verdict || null,
    images: listing.images || [],
    recommended_uses: listing.recommendedUses || [],
    grocer_name: listing.grocerName,
    grocer_phone: listing.grocerPhone,
    grocer_location: listing.grocerLocation,
    price: listing.price,
    base_price: listing.basePrice,
    price_margin: listing.priceMargin,
    quantity: listing.quantity || 1,
    sold: listing.sold,
    listed_at: new Date(listing.listedAt).toISOString(),
    latitude: listing.latitude ?? userLat ?? 0,
    longitude: listing.longitude ?? userLng ?? 0,
    distance_km: distanceKm,
  }
}

export function useGeofencedListings(
  options: UseGeofencedListingsOptions = {}
): UseGeofencedListingsReturn {
  const {
    radiusKm = 2.5,
    enableRealTimeTracking = true,
    minMovementMeters = 100,
  } = options

  const [listings, setListings] = useState<GeoListing[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<GeoLocation | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLocationTracking, setIsLocationTracking] = useState(false)

  const lastFetchLocation = useRef<{ lat: number; lng: number } | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const locationRef = useRef<GeoLocation | null>(null)
  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const supabase = useRef(hasSupabaseConfig ? createClient() : null)

  useEffect(() => {
    locationRef.current = location
  }, [location])

  const isInNoidaRegion = location
    ? isWithinNoidaRegion(location.latitude, location.longitude)
    : false

  const fetchListings = useCallback(
    async (lat?: number, lng?: number) => {
      setIsLoading(true)
      setError(null)

      try {
        const hasCoords = typeof lat === "number" && typeof lng === "number"

        // Strict Noida-only geofencing: if user location is known and outside Noida, show no local grocer listings
        if (hasCoords && !isWithinNoidaRegion(lat!, lng!)) {
          setListings([])
          lastFetchLocation.current = { lat: lat!, lng: lng! }
          return
        }

        // 1. Read local grocer listings from localStorage and apply Noida + radiusKm geofence
        const localRaw = getAvailableListings()
        const localGeo = localRaw
          .filter((item) => {
            if (typeof item.latitude === "number" && typeof item.longitude === "number") {
              return isWithinNoidaRegion(item.latitude, item.longitude)
            }
            return true
          })
          .map((item) => localListingToGeo(item, lat, lng))
          .filter((item) => {
            if (!hasCoords) return true
            if (typeof item.distance_km !== "number") return true
            return item.distance_km <= radiusKm
          })

        // 2. Fetch nearby Noida listings from Supabase RPC if configured & inside Noida
        let remoteGeo: GeoListing[] = []
        if (supabase.current && hasCoords) {
          const { data, error: rpcError } = await supabase.current.rpc(
            "get_nearby_listings",
            {
              user_lat: lat,
              user_lng: lng,
              radius_km: radiusKm,
            }
          )
          if (rpcError) {
            setError(rpcError.message)
          } else {
            remoteGeo = ((data as GeoListing[]) || []).filter((item) =>
              isWithinNoidaRegion(Number(item.latitude), Number(item.longitude))
            )
          }
        }

        // 3. Merge local + remote without duplicates
        const syncedIds = new Set(
          localRaw.map((l) => l.supabaseId).filter((id): id is string => Boolean(id))
        )
        const remoteIds = new Set(remoteGeo.map((r) => r.id))
        const uniqueLocal = localGeo.filter(
          (l) => !remoteIds.has(l.id) && !syncedIds.has(l.id)
        )

        const combined = [...uniqueLocal, ...remoteGeo].sort((a, b) => {
          const distA = a.distance_km ?? Number.MAX_SAFE_INTEGER
          const distB = b.distance_km ?? Number.MAX_SAFE_INTEGER
          if (distA !== distB) return distA - distB
          return new Date(b.listed_at).getTime() - new Date(a.listed_at).getTime()
        })

        setListings(combined)
        if (hasCoords) {
          lastFetchLocation.current = { lat: lat!, lng: lng! }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch listings")
      } finally {
        setIsLoading(false)
      }
    },
    [radiusKm]
  )

  const refetch = useCallback(async () => {
    const activeLoc = locationRef.current || getSavedLocation()
    await fetchListings(activeLoc?.latitude, activeLoc?.longitude)
  }, [fetchListings])

  const handlePositionUpdate = useCallback(
    (position: GeolocationPosition) => {
      // Do not overwrite an explicitly chosen Noida preset if user selected one manually
      if (locationRef.current?.label) {
        return
      }

      const newLocation: GeoLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      }

      setLocation(newLocation)
      locationRef.current = newLocation
      setLocationError(null)
      setIsLocationTracking(true)

      saveUserLocation({
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
        accuracy: newLocation.accuracy,
        timestamp: Date.now(),
      })

      const shouldFetch =
        !lastFetchLocation.current ||
        calculateDistanceMeters(
          lastFetchLocation.current.lat,
          lastFetchLocation.current.lng,
          newLocation.latitude,
          newLocation.longitude
        ) >= minMovementMeters

      if (shouldFetch) {
        fetchListings(newLocation.latitude, newLocation.longitude)
      }
    },
    [fetchListings, minMovementMeters]
  )

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsLocationTracking(false)
  }, [])

  const startTracking = useCallback(() => {
    setLocationError(null)

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser")
      return
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }

    setIsLocationTracking(true)

    autoDetectLocation()
      .then((detected) => {
        const geoLoc: GeoLocation = {
          latitude: detected.latitude,
          longitude: detected.longitude,
          accuracy: detected.accuracy,
          label: detected.label,
        }
        setLocation(geoLoc)
        locationRef.current = geoLoc
        setLocationError(null)
        fetchListings(geoLoc.latitude, geoLoc.longitude)
      })
      .catch((err) => {
        if (!locationRef.current) {
          setIsLocationTracking(false)
          setLocationError(err instanceof Error ? err.message : "Unable to detect location")
        }
      })

    if (enableRealTimeTracking) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePositionUpdate,
        () => {
          // Non-fatal watch update error
        },
        {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 60000,
        }
      )
    }
  }, [enableRealTimeTracking, fetchListings, handlePositionUpdate])

  const setManualLocation = useCallback(
    (latitude: number, longitude: number, label?: string) => {
      const manual: GeoLocation = {
        latitude,
        longitude,
        accuracy: 100,
        label,
      }
      saveUserLocation({
        latitude,
        longitude,
        accuracy: 100,
        timestamp: Date.now(),
        label,
      })
      setLocation(manual)
      locationRef.current = manual
      setLocationError(null)
      setIsLocationTracking(true)
      fetchListings(latitude, longitude)
    },
    [fetchListings]
  )

  useEffect(() => {
    const savedLocation = getSavedLocation()
    if (savedLocation) {
      const geoLocation: GeoLocation = {
        latitude: savedLocation.latitude,
        longitude: savedLocation.longitude,
        accuracy: savedLocation.accuracy,
        label: savedLocation.label,
      }
      setLocation(geoLocation)
      locationRef.current = geoLocation
      setIsLocationTracking(true)
      fetchListings(savedLocation.latitude, savedLocation.longitude)
    } else {
      fetchListings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (enableRealTimeTracking && !locationRef.current?.label) {
      startTracking()
    }

    return () => {
      stopTracking()
    }
  }, [enableRealTimeTracking, startTracking, stopTracking])

  useEffect(() => {
    const handleRefresh = () => {
      refetch()
    }

    window.addEventListener("marketplaceUpdated", handleRefresh)
    window.addEventListener("locationUpdated", handleRefresh)
    window.addEventListener("storage", handleRefresh)

    return () => {
      window.removeEventListener("marketplaceUpdated", handleRefresh)
      window.removeEventListener("locationUpdated", handleRefresh)
      window.removeEventListener("storage", handleRefresh)
    }
  }, [refetch])

  return {
    listings,
    isLoading,
    error,
    location,
    locationError,
    isLocationTracking,
    isInNoidaRegion,
    refetch,
    startTracking,
    stopTracking,
    setManualLocation,
  }
}

export function useMarketplaceListings(options?: UseGeofencedListingsOptions) {
  const geofencedData = useGeofencedListings(options)

  const marketplaceItems = geofencedData.listings.map((listing) => ({
    id: listing.id,
    type: "listing" as const,
    name: listing.fruit_name,
    category: listing.category,
    image:
      listing.images[0] ||
      "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=400&fit=crop",
    description: listing.verdict || `Fresh ${listing.fruit_name} from local grocer`,
    price: listing.price,
    unit: "kg",
    freshness: listing.freshness,
    inStock: !listing.sold,
    quantity: listing.quantity || 1,
    sellerName: listing.grocer_name,
    sellerPhone: listing.grocer_phone,
    sellerAddress: listing.grocer_location,
    distanceKm: listing.distance_km,
    latitude: listing.latitude,
    longitude: listing.longitude,
  }))

  return {
    ...geofencedData,
    marketplaceItems,
  }
}
