import { createServerSupabaseClient, getSession } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import NewDiscussionForm from "./new-discussion-form"

export default async function NewDiscussionPage({ params }: { params: { id: string } }) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const supabase = createServerSupabaseClient()

  // Get module details
  const { data: module } = await supabase
    .from("modules")
    .select(`
      *,
      roadmaps:roadmap_id (
        id,
        title
      )
    `)
    .eq("id", params.id)
    .single()

  if (!module) {
    redirect("/dashboard")
  }

  // Check if user has access to this module's roadmap
  const { data: userRoadmap } = await supabase
    .from("user_roadmaps")
    .select("*")
    .eq("user_id", session.user.id)
    .eq("roadmap_id", module.roadmap_id)
    .single()

  if (!userRoadmap) {
    redirect(`/roadmaps/${module.roadmap_id}/start`)
  }

  return (
    <DashboardLayout>
      <div className="container p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Link href={`/modules/${params.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">New Discussion</h1>
            <p className="text-muted-foreground">
              <Link href={`/modules/${params.id}`} className="hover:underline">
                {module.title}
              </Link>
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Start a New Discussion</CardTitle>
            <CardDescription>Ask questions or share insights about this module with other learners</CardDescription>
          </CardHeader>
          <CardContent>
            <NewDiscussionForm userId={session.user.id} moduleId={params.id} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
