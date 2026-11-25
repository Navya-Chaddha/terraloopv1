"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowRight, Phone, Shield, Loader2, MapPin, CheckCircle2, LogOut } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { autoDetectLocation, getSavedLocation, type UserLocation } from "@/lib/location"
import { useUser } from "@/contexts/UserContext"

function getSafeRedirect(redirectParam: string | null): string | null {
  if (!redirectParam) return null
  if (redirectParam.startsWith("/") && !redirectParam.startsWith("//")) {
    return redirectParam
  }
  return null
}

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTarget = getSafeRedirect(searchParams.get("redirect"))

  const {
    user,
    login,
    verifyOTP,
    logout,
    isAuthenticated,
    isLoading: isAuthLoading,
    startLocationTracking,
  } = useUser()
  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [locationStatus, setLocationStatus] = useState<"detecting" | "success" | "error" | "idle">("idle")
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const savedLocation = getSavedLocation()
    if (savedLocation) {
      setUserLocation(savedLocation)
      setLocationStatus("success")
      return
    }

    setLocationStatus("detecting")
    autoDetectLocation()
      .then((location) => {
        setUserLocation(location)
        setLocationStatus("success")
      })
      .catch(() => {
        setLocationStatus("error")
      })
  }, [])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSendOtp = async () => {
    if (phoneNumber.length >= 10) {
      setIsLoading(true)
      await new Promise(resolve => setTimeout(resolve, 600))
      setIsLoading(false)
      setStep("otp")
      setCountdown(30)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleVerifyOtp = async () => {
    const otpValue = otp.join("")
    if (otpValue.length === 6) {
      setIsLoading(true)
      const tempName = "User"
      localStorage.setItem("terraloop_phone", phoneNumber)
      login(phoneNumber, tempName)
      const success = await verifyOTP(otpValue, phoneNumber, tempName)
      setIsLoading(false)

      if (success) {
        startLocationTracking()
        const nameUrl = redirectTarget
          ? `/name?redirect=${encodeURIComponent(redirectTarget)}`
          : "/name"
        router.push(nameUrl)
      }
    }
  }

  const handleResendOtp = () => {
    if (countdown === 0) {
      setCountdown(30)
    }
  }

  return (
    <div className="bg-botanical-subtle relative min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 pt-6">
        <button
          onClick={() =>
            step === "otp"
              ? setStep("phone")
              : router.push(redirectTarget || "/language")
          }
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-secondary"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-medium text-muted-foreground">Step 2 of 3</span>
        <ThemeToggle />
      </header>

      <div className="mx-auto max-w-md px-4 py-12">
        {/* Existing session quick-continue banner (never forces redirect away from login) */}
        {!isAuthLoading && isAuthenticated && user && step === "phone" && (
          <Card className="mb-6 rounded-2xl border-primary/25 bg-secondary/60 shadow-sm">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Active Session
                </p>
                <p className="truncate text-sm font-medium text-foreground">
                  {user.name && user.name !== "User" ? `${user.name} • ` : ""}+91 {user.phone}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => router.push(redirectTarget || "/dashboard")}
                  className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Continue
                </button>
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                  title="Sign out"
                >
                  <LogOut className="h-3 w-3" />
                  Sign out
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "phone" ? (
          <>
            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/15">
                <Phone className="h-7 w-7" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Sign in with Phone
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We&apos;ll send a 6-digit verification code to connect you with nearby grocers
              </p>
            </div>

            <Card className="card-fresh mb-6 rounded-2xl border-border bg-card">
              <CardContent className="p-6">
                <label className="mb-2 block text-sm font-medium text-foreground">
                  Phone Number
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 items-center justify-center rounded-xl border border-border bg-muted px-4">
                    <span className="text-base font-semibold text-foreground">+91</span>
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                    placeholder="9876543210"
                    className="h-12 flex-1 rounded-xl border border-border bg-input px-4 text-base font-medium text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Location indicator */}
                <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/60 px-3.5 py-2.5 text-xs">
                  <span className="text-muted-foreground">Local discovery</span>
                  {locationStatus === "detecting" && (
                    <span className="inline-flex items-center gap-1.5 font-medium text-primary">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Detecting location...
                    </span>
                  )}
                  {locationStatus === "success" && (
                    <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Location ready
                    </span>
                  )}
                  {locationStatus === "error" && (
                    <span className="inline-flex items-center gap-1.5 font-medium text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      Optional — enable later
                    </span>
                  )}
                  {locationStatus === "idle" && userLocation === null && (
                    <span className="text-muted-foreground">Checking...</span>
                  )}
                </div>
              </CardContent>
            </Card>

            <button
              onClick={handleSendOtp}
              disabled={phoneNumber.length < 10 || isLoading}
              className={`group flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-base font-semibold transition-all ${
                phoneNumber.length >= 10 && !isLoading
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
                  : "cursor-not-allowed bg-muted text-muted-foreground"
              }`}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Send Verification Code
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </>
        ) : (
          <>
            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/15">
                <Shield className="h-7 w-7" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Verify OTP
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter any 6-digit code for +91 {phoneNumber}
              </p>
              <p className="mt-1 inline-block rounded-full bg-secondary px-3 py-0.5 text-[11px] font-medium text-secondary-foreground">
                Demo Mode — real SMS OTP requires an SMS provider
              </p>
            </div>

            <Card className="card-fresh mb-6 rounded-2xl border-border bg-card">
              <CardContent className="p-6">
                <div className="flex justify-center gap-2.5">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { otpRefs.current[index] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="h-13 w-11 rounded-xl border border-border bg-input text-center text-xl font-bold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  ))}
                </div>

                <div className="mt-5 text-center">
                  {countdown > 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Resend code in <span className="font-semibold text-primary">{countdown}s</span>
                    </p>
                  ) : (
                    <button
                      onClick={handleResendOtp}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Resend Verification Code
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>

            <button
              onClick={handleVerifyOtp}
              disabled={otp.join("").length < 6 || isLoading}
              className={`group flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-base font-semibold transition-all ${
                otp.join("").length === 6 && !isLoading
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
                  : "cursor-not-allowed bg-muted text-muted-foreground"
              }`}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Verify & Continue
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </>
        )}

        {/* Step indicator */}
        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="h-1.5 w-8 rounded-full bg-primary" />
          <div className="h-1.5 w-8 rounded-full bg-primary" />
          <div className="h-1.5 w-8 rounded-full bg-border" />
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}
