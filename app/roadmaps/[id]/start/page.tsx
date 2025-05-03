import { createServerSupabaseClient, getSession } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, BookOpen, Calendar, Clock, Target } from "lucide-react"
import Link from "next/link"
import StartRoadmapForm from "./start-roadmap-form"

export default async function StartRoadmapPage({ params }: { params: { id: string } }) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const supabase = createServerSupabaseClient()

  // Check if user already has this roadmap
  const { data: existingRoadmap } = await supabase
    .from("user_roadmaps")
    .select("*")
    .eq("user_id", session.user.id)
    .eq("roadmap_id", params.id)
    .single()

  if (existingRoadmap) {
    redirect(`/roadmaps/${params.id}`)
  }

  // Get roadmap details
  const { data: roadmap } = await supabase.from("roadmaps").select("*").eq("id", params.id).single()

  if (!roadmap) {
    redirect("/roadmaps/explore")
  }

  // Get modules for this roadmap
  const { data: modules } = await supabase
    .from("modules")
    .select("*")
    .eq("roadmap_id", params.id)
    .order("week_number", { ascending: true })

  return (
    <DashboardLayout>
      <div className="container p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/roadmaps/explore">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{roadmap.title}</h1>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Roadmap Overview</CardTitle>
                <CardDescription>{roadmap.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <BookOpen className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Category</div>
                      <div className="text-sm text-muted-foreground">{roadmap.skill_category}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Duration</div>
                      <div className="text-sm text-muted-foreground">{roadmap.duration_weeks} weeks</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Target className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Modules</div>
                      <div className="text-sm text-muted-foreground">{modules?.length || 0} learning modules</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Created</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(roadmap.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">What You'll Learn</h2>
              <div className="space-y-4">
                {modules && modules.length > 0 ? (
                  modules.map((module, index) => (
                    <Card key={module.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">
                          Week {module.week_number}: {module.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted-foreground">No modules available for this roadmap.</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Start This Roadmap</CardTitle>
                <CardDescription>Begin your learning journey</CardDescription>
              </CardHeader>
              <CardContent>
                <StartRoadmapForm userId={session.user.id} roadmapId={params.id} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
