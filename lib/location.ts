"use client"

export interface UserLocation {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
  label?: string
}

export interface NoidaSector {
  label: string
  latitude: number
  longitude: number
}

// Geographic bounding box covering Noida (Gautam Buddha Nagar, UP)
export const NOIDA_BOUNDS = {
  minLat: 28.45,
  maxLat: 28.66,
  minLng: 77.29,
  maxLng: 77.48,
} as const

export const NOIDA_SECTORS: NoidaSector[] = [
  { label: "Sector 18, Noida", latitude: 28.5708, longitude: 77.3261 },
  { label: "Sector 62, Noida", latitude: 28.6279, longitude: 77.3649 },
  { label: "Sector 50, Noida", latitude: 28.5719, longitude: 77.3622 },
  { label: "Sector 137, Noida", latitude: 28.5046, longitude: 77.4119 },
]

export function isWithinNoidaRegion(latitude: number, longitude: number): boolean {
  return (
    latitude >= NOIDA_BOUNDS.minLat &&
    latitude <= NOIDA_BOUNDS.maxLat &&
    longitude >= NOIDA_BOUNDS.minLng &&
    longitude <= NOIDA_BOUNDS.maxLng
  )
}

const LOCATION_KEY = "terraloop_user_location"

// Calculate distance between two coordinates in kilometers using Haversine formula
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c * 100) / 100
}

// Save user location to localStorage
export function saveUserLocation(location: UserLocation): void {
  if (typeof window === "undefined") return
  localStorage.setItem(LOCATION_KEY, JSON.stringify(location))
  window.dispatchEvent(new Event("locationUpdated"))
}

// Get saved user location from localStorage
export function getSavedLocation(): UserLocation | null {
  if (typeof window === "undefined") return null

  const stored = localStorage.getItem(LOCATION_KEY)
  if (!stored) return null

  try {
    const location = JSON.parse(stored) as UserLocation
    const maxAge = 24 * 60 * 60 * 1000
    if (Date.now() - location.timestamp > maxAge) {
      localStorage.removeItem(LOCATION_KEY)
      return null
    }
    if (typeof location.latitude !== "number" || typeof location.longitude !== "number") {
      return null
    }
    return location
  } catch {
    return null
  }
}

// Clear saved location
export function clearSavedLocation(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(LOCATION_KEY)
  window.dispatchEvent(new Event("locationUpdated"))
}

export const clearUserLocation = clearSavedLocation

function mapGeolocationError(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location permission denied. Allow location access or pick a Noida sector below."
    case error.POSITION_UNAVAILABLE:
      return "Location information is unavailable on this device."
    case error.TIMEOUT:
      return "Location request timed out."
    default:
      return "Unable to detect location."
  }
}

// Auto-detect location with automatic low-accuracy fallback when high-accuracy times out
export function autoDetectLocation(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"))
      return
    }

    const onSuccess = (position: GeolocationPosition) => {
      const userLocation: UserLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now(),
      }
      saveUserLocation(userLocation)
      resolve(userLocation)
    }

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (firstError) => {
        if (firstError.code === firstError.PERMISSION_DENIED) {
          reject(new Error(mapGeolocationError(firstError)))
          return
        }

        navigator.geolocation.getCurrentPosition(
          onSuccess,
          (secondError) => {
            reject(new Error(mapGeolocationError(secondError)))
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 300000,
          }
        )
      },
      {
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 60000,
      }
    )
  })
}

// Get human-readable location status
export function getLocationStatus(location: UserLocation | null): string {
  if (!location) return "Location not available"
  if (location.label) return location.label
  return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
}
