"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { getSavedLocation, saveUserLocation, clearUserLocation, type UserLocation } from "@/lib/location"
import { apiFetch } from "@/lib/api"

// Session storage key
const SESSION_KEY = "terraloop_session"
const USER_KEY = "terraloop_user"
const TOKEN_KEY = "terraloop_token"

// User profile interface
export interface UserProfile {
  id: number
  phone: string
  email: string
  name: string
  role: "grocer" | "buyer"
  profile_image_url: string | null
  isVerified: boolean
  verifiedAt?: number
}

// Session interface
export interface UserSession {
  userId: string
  phone: string
  name: string
  role: "grocer" | "buyer"
  isVerified: boolean
  createdAt: number
  expiresAt: number
}

export interface RegisterInput {
  name: string
  phone: string
  email: string
  password: string
  role: "grocer" | "buyer"
  profile_image_url?: string | null
}

interface AuthResponse {
  token: string
  user: Omit<UserProfile, "isVerified" | "verifiedAt">
}

// Context state interface
interface UserContextState {
  // Auth state
  user: UserProfile | null
  session: UserSession | null
  isAuthenticated: boolean
  isLoading: boolean
  
  // Location state
  currentLocation: UserLocation | null
  isLocationTracking: boolean
  locationError: string | null
  
  // Auth actions
  login: (identifier: string, password: string) => Promise<UserProfile>
  register: (input: RegisterInput) => Promise<UserProfile>
  updateUserName: (name: string) => Promise<void>
  logout: () => void
  
  // Location actions
  startLocationTracking: () => void
  stopLocationTracking: () => void
  
  // Geofencing config (easily adjustable)
  GEOFENCE_RADIUS_KM: number
}

// Default values
const defaultContext: UserContextState = {
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  currentLocation: null,
  isLocationTracking: false,
  locationError: null,
  login: async () => { throw new Error("Authentication is unavailable") },
  register: async () => { throw new Error("Registration is unavailable") },
  updateUserName: async () => {},
  logout: () => {},
  startLocationTracking: () => {},
  stopLocationTracking: () => {},
  GEOFENCE_RADIUS_KM: 2.5, // Default 2.5km radius - easily adjustable
}

// Create context
const UserContext = createContext<UserContextState>(defaultContext)

// Geofence radius - easily adjustable
const GEOFENCE_RADIUS_KM = 2.5

// Session duration (7 days in milliseconds)
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<UserSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [currentLocation, setCurrentLocation] = useState<UserLocation | null>(null)
  const [isLocationTracking, setIsLocationTracking] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [watchId, setWatchId] = useState<number | null>(null)

  // Check for existing session on mount
  useEffect(() => {
    const rehydrateSession = () => {
      try {
        const storedSession = localStorage.getItem(SESSION_KEY)
        const storedUser = localStorage.getItem(USER_KEY)
        
        if (storedSession && storedUser) {
          const parsedSession: UserSession = JSON.parse(storedSession)
          const parsedUser: UserProfile = JSON.parse(storedUser)
          
          // Check if session is still valid
          if (parsedSession.expiresAt > Date.now() && localStorage.getItem(TOKEN_KEY)) {
            setSession(parsedSession)
            setUser(parsedUser)
            
            // Auto-start location tracking if verified
            if (parsedUser.isVerified) {
              const savedLocation = getSavedLocation()
              if (savedLocation) {
                setCurrentLocation(savedLocation)
              }
              // Start tracking for real-time updates
              startLocationTrackingInternal()
            }
          } else {
            // Session expired, clear it
            clearSession()
          }
        }
      } catch (error) {
        console.error("Error rehydrating session:", error)
        clearSession()
      } finally {
        setIsLoading(false)
      }
    }

    rehydrateSession()
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Internal location tracking function
  const startLocationTrackingInternal = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser")
      return
    }

    setIsLocationTracking(true)
    setLocationError(null)

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        }
        setCurrentLocation(newLocation)
        saveUserLocation(newLocation)
        setLocationError(null)
      },
      (error) => {
        let errorMessage = "Unable to get location"
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied"
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable"
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out"
            break
        }
        setLocationError(errorMessage)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // 1 minute cache
      }
    )

    setWatchId(id)
  }, [])

  // Clear session helper
  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem("terraloop_name")
    localStorage.removeItem("terraloop_phone")
    clearUserLocation()
    setSession(null)
    setUser(null)
  }, [])

  const saveAuth = useCallback((token: string, profile: AuthResponse["user"]) => {
    const verifiedUser: UserProfile = { ...profile, isVerified: true, verifiedAt: Date.now() }
    const newSession: UserSession = {
      userId: String(verifiedUser.id),
      phone: verifiedUser.phone,
      name: verifiedUser.name,
      role: verifiedUser.role,
      isVerified: true,
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_DURATION,
    }

    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession))
    localStorage.setItem(USER_KEY, JSON.stringify(verifiedUser))
    localStorage.setItem("terraloop_phone", verifiedUser.phone)
    localStorage.setItem("terraloop_name", verifiedUser.name)
    setUser(verifiedUser)
    setSession(newSession)
    return verifiedUser
  }, [])

  const login = useCallback(async (identifier: string, password: string) => {
    const result = await apiFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    })
    const authenticatedUser = saveAuth(result.token, result.user)
    startLocationTrackingInternal()
    return authenticatedUser
  }, [saveAuth, startLocationTrackingInternal])

  const register = useCallback(async (input: RegisterInput) => {
    const result = await apiFetch<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    })
    const authenticatedUser = saveAuth(result.token, result.user)
    startLocationTrackingInternal()
    return authenticatedUser
  }, [saveAuth, startLocationTrackingInternal])

  // Update user display name
  const updateUserName = useCallback(async (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const { user: updatedUser } = await apiFetch<{ user: AuthResponse["user"] }>("/api/users/me", {
      method: "PUT",
      body: JSON.stringify({ name: trimmed }),
    })
    const verifiedUser: UserProfile = { ...updatedUser, isVerified: true }
    localStorage.setItem("terraloop_name", trimmed)
    localStorage.setItem(USER_KEY, JSON.stringify(verifiedUser))
    setUser(verifiedUser)
    setSession(prev => {
      if (!prev) return prev
      const updated = { ...prev, name: trimmed }
      localStorage.setItem(SESSION_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  // Logout action
  const logout = useCallback(() => {
    // Stop location tracking
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    setIsLocationTracking(false)
    setCurrentLocation(null)
    
    // Clear session
    clearSession()
  }, [watchId, clearSession])

  // Start location tracking (public method)
  const startLocationTracking = useCallback(() => {
    startLocationTrackingInternal()
  }, [startLocationTrackingInternal])

  // Stop location tracking
  const stopLocationTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    setIsLocationTracking(false)
  }, [watchId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [watchId])

  const value: UserContextState = {
    user,
    session,
    isAuthenticated: !!session && session.expiresAt > Date.now(),
    isLoading,
    currentLocation,
    isLocationTracking,
    locationError,
    login,
    register,
    updateUserName,
    logout,
    startLocationTracking,
    stopLocationTracking,
    GEOFENCE_RADIUS_KM,
  }

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

// Custom hook to use the context
export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}

// Export the geofence radius constant for use elsewhere
export { GEOFENCE_RADIUS_KM }
