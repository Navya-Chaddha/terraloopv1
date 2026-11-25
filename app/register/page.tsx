"use client"

import { ChangeEvent, FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Camera, Eye, EyeOff, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { useUser } from "@/contexts/UserContext"
import { compressPhoto } from "@/lib/image-client"

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useUser()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"buyer" | "grocer">("buyer")
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      setProfileImage(await compressPhoto(file, 480))
      setError(null)
    } catch (photoError) {
      setProfileImage(null)
      setError(photoError instanceof Error ? photoError.message : "Could not read the selected photo.")
      event.target.value = ""
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      const user = await register({
        name: name.trim(),
        phone,
        email: email.trim(),
        password,
        role,
        profile_image_url: profileImage,
      })
      router.push(user.role === "grocer" ? "/grocer" : "/buyer")
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not create your account.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-botanical-subtle min-h-screen bg-background">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 pt-6">
        <Link
          href="/"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-secondary"
          aria-label="Back to home"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto max-w-md px-4 py-10">
        <div className="mb-7 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Join TerraLoop</h1>
          <p className="mt-2 text-sm text-muted-foreground">Create a buyer or grocer account.</p>
        </div>

        <Card className="card-fresh rounded-2xl border-border bg-card">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-foreground">Full name or shop name</label>
                <input
                  id="name"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  minLength={2}
                  maxLength={100}
                  required
                  className="h-12 w-full rounded-xl border border-border bg-input px-4 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-medium text-foreground">Indian mobile number</label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
                  required
                  className="h-12 w-full rounded-xl border border-border bg-input px-4 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="10-digit mobile number"
                />
              </div>
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="h-12 w-full rounded-xl border border-border bg-input px-4 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="role" className="mb-2 block text-sm font-medium text-foreground">Account type</label>
                <select
                  id="role"
                  value={role}
                  onChange={(event) => setRole(event.target.value as "buyer" | "grocer")}
                  className="h-12 w-full rounded-xl border border-border bg-input px-4 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="buyer">Buyer</option>
                  <option value="grocer">Grocer</option>
                </select>
              </div>
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-foreground">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    className="h-12 w-full rounded-xl border border-border bg-input px-4 pr-12 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="At least 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="profile-photo" className="mb-2 block text-sm font-medium text-foreground">
                  Profile photo <span className="text-muted-foreground">(optional)</span>
                </label>
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="profile-photo"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                  >
                    <Camera className="h-4 w-4" />
                    Take or choose a photo
                  </label>
                  <input
                    id="profile-photo"
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handlePhoto}
                    className="sr-only"
                  />
                </div>
                {profileImage && (
                  <div className="mt-3 flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={profileImage} alt="Profile photo preview" className="h-16 w-16 rounded-full object-cover" />
                    <button type="button" onClick={() => setProfileImage(null)} className="text-sm font-medium text-primary hover:underline">
                      Remove photo
                    </button>
                  </div>
                )}
              </div>
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create account"}
              </button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">Sign in</Link>
        </p>
      </main>
    </div>
  )
}
