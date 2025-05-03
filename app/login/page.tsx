import { createServerSupabaseClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import LoginForm from "./login-form"
import Link from "next/link"
import { BookOpen } from "lucide-react"

export default async function LoginPage() {
  const supabase = createServerSupabaseClient()
  const { data } = await supabase.auth.getSession()

  if (data.session) {
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
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Log in to continue your learning journey</p>
        </div>
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
