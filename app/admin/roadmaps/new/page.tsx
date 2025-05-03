import { createServerSupabaseClient, getSession } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import RoadmapForm from "../roadmap-form"

export default async function NewRoadmapPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const supabase = createServerSupabaseClient()

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", session.user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  return (
    <DashboardLayout>
      <div className="container p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/admin/roadmaps">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Create New Roadmap</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Roadmap Details</CardTitle>
            <CardDescription>Create a new learning roadmap for users</CardDescription>
          </CardHeader>
          <CardContent>
            <RoadmapForm userId={session.user.id} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
