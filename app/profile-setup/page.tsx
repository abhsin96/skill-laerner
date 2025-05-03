import { createServerSupabaseClient, getSession } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import ProfileSetupForm from "./profile-setup-form"
import { BookOpen } from "lucide-react"
import Link from "next/link"

export default async function ProfileSetupPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const supabase = createServerSupabaseClient()

  // Check if profile is already set up
  const { data: profile } = await supabase
    .from("profiles")
    .select("interests, learning_goals, weekly_learning_time")
    .eq("user_id", session.user.id)
    .single()

  if (profile && profile.interests && profile.learning_goals && profile.weekly_learning_time) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <BookOpen className="h-6 w-6 text-primary" />
        <span className="text-xl font-bold">SkillKart</span>
      </Link>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Complete your profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">Help us personalize your learning experience</p>
        </div>
        <ProfileSetupForm userId={session.user.id} />
      </div>
    </div>
  )
}
