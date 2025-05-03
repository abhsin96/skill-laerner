import { createServerSupabaseClient, getSession } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"

export default async function RoadmapsPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const supabase = createServerSupabaseClient()

  // Get user's active roadmaps
  const { data: activeRoadmaps } = await supabase
    .from("user_roadmaps")
    .select(`
      *,
      roadmaps:roadmap_id (
        id,
        title,
        description,
        skill_category,
        duration_weeks
      )
    `)
    .eq("user_id", session.user.id)
    .eq("completed", false)

  // Get user's completed roadmaps
  const { data: completedRoadmaps } = await supabase
    .from("user_roadmaps")
    .select(`
      *,
      roadmaps:roadmap_id (
        id,
        title,
        description,
        skill_category,
        duration_weeks
      )
    `)
    .eq("user_id", session.user.id)
    .eq("completed", true)

  return (
    <DashboardLayout>
      <div className="container p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Roadmaps</h1>
            <p className="text-muted-foreground">Track and manage your learning roadmaps</p>
          </div>
          <Link href="/roadmaps/explore">
            <Button>Explore New Roadmaps</Button>
          </Link>
        </div>

        <Tabs defaultValue="active" className="space-y-4">
          <TabsList>
            <TabsTrigger value="active">Active ({activeRoadmaps?.length || 0})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedRoadmaps?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeRoadmaps && activeRoadmaps.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeRoadmaps.map((userRoadmap) => (
                  <Card key={userRoadmap.id}>
                    <CardHeader>
                      <CardTitle>{userRoadmap.roadmaps.title}</CardTitle>
                      <CardDescription>{userRoadmap.roadmaps.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{userRoadmap.roadmaps.skill_category}</span>
                        <span className="text-muted-foreground">{userRoadmap.roadmaps.duration_weeks} weeks</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>30%</span>
                        </div>
                        <Progress value={30} />
                      </div>
                      <Link href={`/roadmaps/${userRoadmap.roadmap_id}`}>
                        <Button className="w-full">Continue Learning</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No active roadmaps</h3>
                <p className="text-muted-foreground mb-6">Start a new roadmap to begin your learning journey</p>
                <Link href="/roadmaps/explore">
                  <Button>Explore Roadmaps</Button>
                </Link>
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedRoadmaps && completedRoadmaps.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {completedRoadmaps.map((userRoadmap) => (
                  <Card key={userRoadmap.id}>
                    <CardHeader>
                      <CardTitle>{userRoadmap.roadmaps.title}</CardTitle>
                      <CardDescription>{userRoadmap.roadmaps.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{userRoadmap.roadmaps.skill_category}</span>
                        <span className="text-muted-foreground">
                          Completed on {new Date(userRoadmap.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>100%</span>
                        </div>
                        <Progress value={100} />
                      </div>
                      <Link href={`/roadmaps/${userRoadmap.roadmap_id}`}>
                        <Button variant="outline" className="w-full">
                          Review Roadmap
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium">No completed roadmaps yet</h3>
                <p className="text-muted-foreground">Complete your active roadmaps to see them here</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
