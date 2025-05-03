import { createServerSupabaseClient, getSession } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Clock, Target, Trophy } from "lucide-react"
import Link from "next/link"

export default async function ProfilePage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const supabase = createServerSupabaseClient()

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", session.user.id).single()

  if (!profile) {
    redirect("/profile-setup")
  }

  // Get user's XP
  const { data: xpData } = await supabase.from("xp_transactions").select("amount").eq("user_id", session.user.id)

  const totalXp = xpData?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0

  // Get user's badges
  const { data: badges } = await supabase
    .from("user_badges")
    .select(`
      *,
      badges:badge_id (
        id,
        name,
        description,
        image_url
      )
    `)
    .eq("user_id", session.user.id)
    .limit(3)

  // Get user's active roadmaps
  const { data: activeRoadmaps } = await supabase
    .from("user_roadmaps")
    .select(`
      *,
      roadmaps:roadmap_id (
        id,
        title,
        skill_category
      )
    `)
    .eq("user_id", session.user.id)
    .eq("completed", false)
    .limit(3)

  // Get user's completed modules
  const { data: completedModules } = await supabase
    .from("user_progress")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("status", "completed")

  const completedModulesCount = completedModules?.length || 0

  return (
    <DashboardLayout>
      <div className="container p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
            <p className="text-muted-foreground">View and manage your profile information</p>
          </div>
          <Link href="/profile/edit">
            <Button>Edit Profile</Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="h-24 w-24 mx-auto">
                  <AvatarFallback className="text-2xl">
                    {session.user.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="mt-4">{session.user.email}</CardTitle>
                <CardDescription>{profile.role === "content_curator" ? "Content Curator" : "Learner"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.role !== "content_curator" && <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{totalXp}</div>
                    <div className="text-sm text-muted-foreground">Total XP</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{completedModulesCount}</div>
                    <div className="text-sm text-muted-foreground">Modules Completed</div>
                  </div>
                </div>}

                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-2">{profile.role !== "content_curator" ? "Interests" : "Skills"}</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests?.map((interest: string) => (
                      <Badge key={interest} variant="secondary">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6">
            {profile.role !== "content_curator" && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Learning Goals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{profile.learning_goals}</p>

                    <div className="mt-4 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{profile.weekly_learning_time} hours per week</span>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Active Roadmaps</h2>
                    <Link href="/roadmaps">
                      <Button variant="ghost" size="sm">
                        View All
                      </Button>
                    </Link>
                  </div>

                  {activeRoadmaps && activeRoadmaps.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {activeRoadmaps.map((roadmap) => (
                        <Card key={roadmap.id}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">{roadmap.roadmaps.title}</CardTitle>
                            <CardDescription>{roadmap.roadmaps.skill_category}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Link href={`/roadmaps/${roadmap.roadmap_id}`}>
                              <Button variant="outline" size="sm" className="w-full">
                                <BookOpen className="mr-2 h-4 w-4" />
                                Continue Learning
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-6">
                        <p className="text-muted-foreground mb-4">You don't have any active roadmaps</p>
                        <Link href="/roadmaps/explore">
                          <Button>
                            <Target className="mr-2 h-4 w-4" />
                            Explore Roadmaps
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Recent Badges</h2>
                    <Link href="/achievements">
                      <Button variant="ghost" size="sm">
                        View All
                      </Button>
                    </Link>
                  </div>

                  {badges && badges.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-3">
                      {badges.map((badge) => (
                        <Card key={badge.id}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">{badge.badges.name}</CardTitle>
                              <Trophy className="h-5 w-5 text-primary" />
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-2">{badge.badges.description}</p>
                            <div className="text-xs text-muted-foreground">
                              Earned on {new Date(badge.earned_at).toLocaleDateString()}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-6">
                        <p className="text-muted-foreground mb-4">You haven't earned any badges yet</p>
                        <Link href="/achievements">
                          <Button>
                            <Trophy className="mr-2 h-4 w-4" />
                            View Achievements
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
