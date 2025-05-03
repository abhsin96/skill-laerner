import { createServerSupabaseClient, getSession } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, CheckCircle, Circle, Clock, ExternalLink, MessageSquare } from "lucide-react"
import Link from "next/link"
import ModuleProgressButton from "./module-progress-button"
import DiscussionList from "./discussion-list"

export default async function ModulePage({ params }: { params: { id: string } }) {
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

  // Get user progress for this module
  const { data: progress } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", session.user.id)
    .eq("module_id", params.id)
    .single()

  if (!progress) {
    // Create progress entry if it doesn't exist
    await supabase.from("user_progress").insert({
      user_id: session.user.id,
      module_id: params.id,
      status: "not_started",
    })

    redirect(`/modules/${params.id}`)
  }

  // Get resources for this module
  const { data: resources } = await supabase
    .from("resources")
    .select("*")
    .eq("module_id", params.id)
    .order("created_at", { ascending: true })

  // Get discussions for this module
  const { data: discussions } = await supabase
    .from("discussions")
    .select(`
      *,
      profiles:user_id (
        id,
        user_id
      ),
      comment_count:comments(count)
    `)
    .eq("module_id", params.id)
    .order("created_at", { ascending: false })

  return (
    <DashboardLayout>
      <div className="container p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Link href={`/roadmaps/${module.roadmap_id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{module.title}</h1>
            <p className="text-muted-foreground">
              <Link href={`/roadmaps/${module.roadmap_id}`} className="hover:underline">
                {module.roadmaps.title}
              </Link>
              {" • "}
              Week {module.week_number}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Module Status</CardTitle>
              <div className="flex items-center gap-1 text-sm">
                {progress.status === "completed" ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-primary">Completed</span>
                  </>
                ) : progress.status === "in_progress" ? (
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
            <CardDescription>{module.description}</CardDescription>
          </CardHeader>
          <CardFooter>
            <ModuleProgressButton
              userId={session.user.id}
              moduleId={params.id}
              currentStatus={progress.status}
              xpReward={module.xp_reward}
            />
          </CardFooter>
        </Card>

        <Tabs defaultValue="resources" className="space-y-4">
          <TabsList>
            <TabsTrigger value="resources">Learning Resources</TabsTrigger>
            <TabsTrigger value="discussions">Discussions</TabsTrigger>
          </TabsList>

          <TabsContent value="resources" className="space-y-4">
            {resources && resources.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {resources.map((resource) => (
                  <Card key={resource.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{resource.title}</CardTitle>
                      <CardDescription>
                        {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{resource.description}</p>
                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="w-full">
                          Access Resource <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium">No resources available</h3>
                <p className="text-muted-foreground">This module doesn't have any resources yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="discussions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Module Discussions</h2>
              <Link href={`/modules/${params.id}/discussions/new`}>
                <Button>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  New Discussion
                </Button>
              </Link>
            </div>

            <DiscussionList discussions={discussions || []} moduleId={params.id} userId={session.user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
