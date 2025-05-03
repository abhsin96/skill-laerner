import { createServerSupabaseClient, getSession } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, CheckCircle, Circle, Clock } from "lucide-react"
import Link from "next/link"

export default async function RoadmapPage({ params }: { params: { id: string } }) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const supabase = createServerSupabaseClient()

  // Check if user has this roadmap
  const { data: userRoadmap } = await supabase
    .from("user_roadmaps")
    .select("*")
    .eq("user_id", session.user.id)
    .eq("roadmap_id", params.id)
    .single()

  if (!userRoadmap) {
    redirect(`/roadmaps/${params.id}/start`)
  }

  // Get roadmap details
  const { data: roadmap } = await supabase.from("roadmaps").select("*").eq("id", params.id).single()

  if (!roadmap) {
    redirect("/roadmaps")
  }

  // Get modules with progress for this roadmap
  const { data: modules } = await supabase
    .from("modules")
    .select(`
      *,
      user_progress:user_progress!inner(
        id,
        status,
        completed_at
      )
    `)
    .eq("roadmap_id", params.id)
    .eq("user_progress.user_id", session.user.id)
    .order("week_number", { ascending: true })

  // Calculate progress
  const totalModules = modules?.length || 0
  const completedModules = modules?.filter((m) => m.user_progress[0].status === "completed").length || 0

  const progressPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0

  return (
    <DashboardLayout>
      <div className="container p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/roadmaps">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{roadmap.title}</h1>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Your Progress</CardTitle>
            <CardDescription>
              {progressPercentage}% complete ({completedModules}/{totalModules} modules)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progressPercentage} className="h-2" />
          </CardContent>
        </Card>

        <Tabs defaultValue="modules" className="space-y-4">
          <TabsList>
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="discussions">Discussions</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="modules" className="space-y-4">
            {modules && modules.length > 0 ? (
              <div className="space-y-4">
                {modules.map((module) => {
                  const progress = module.user_progress[0]
                  const isCompleted = progress.status === "completed"
                  const isInProgress = progress.status === "in_progress"

                  return (
                    <Card key={module.id} className={isCompleted ? "border-primary/50" : ""}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            Week {module.week_number}: {module.title}
                          </CardTitle>
                          <div className="flex items-center gap-1 text-sm">
                            {isCompleted ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-primary" />
                                <span className="text-primary">Completed</span>
                              </>
                            ) : isInProgress ? (
                              <>
                                <Clock className="h-4 w-4 text-amber-500" />
                                <span className="text-amber-500">In Progress</span>
                              </>
                            ) : (
                              <>
                                <Circle className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Not Started</span>
                              </>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                        <Link href={`/modules/${module.id}`}>
                          <Button variant={isCompleted ? "outline" : "default"} className="w-full">
                            {isCompleted ? "Review Module" : isInProgress ? "Continue Module" : "Start Module"}
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium">No modules available</h3>
                <p className="text-muted-foreground">This roadmap doesn't have any modules yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="discussions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Roadmap Discussions</CardTitle>
                <CardDescription>Connect with others learning the same skills</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8 text-muted-foreground">
                  Discussions are available at the module level. Select a module to view or start discussions.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Additional Resources</CardTitle>
                <CardDescription>Supplementary materials for this roadmap</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8 text-muted-foreground">
                  Resources are available at the module level. Select a module to access learning resources.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
