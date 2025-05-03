import { createServerSupabaseClient, getSession } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Clock, Target, Trophy, FileText, CheckCircle, Users, ArrowLeft, MessageSquare } from "lucide-react"
import Link from "next/link"
import { AchievementSummary } from "../components/achievement-summary"
import { DEFAULT_BADGES } from "@/app/lib/badges"

interface Module {
  id: string
  title: string
  description: string
  week_number: number
  xp_reward: number
}

interface Roadmap {
  id: string
  title: string
  description: string
  skill_category: string
  duration_weeks: number
  modules?: Module[]
}

interface UserProgress {
  status: string
  module_id: string
}

export default async function DashboardPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const supabase = createServerSupabaseClient()

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", session.user.id).single()

  if (!profile || !profile.interests || !profile.learning_goals) {
    redirect("/profile-setup")
  }

  // Get user's active roadmaps
  const { data: userRoadmaps } = await supabase
    .from("user_roadmaps")
    .select(`
      *,
      roadmaps:roadmap_id (
        id,
        title,
        description,
        skill_category,
        duration_weeks,
        modules (
          id,
          title,
          description,
          week_number,
          xp_reward
        )
      )
    `)
    .eq("user_id", session.user.id)
    .eq("completed", false)

  // Get user progress for all modules
  const { data: userProgress } = await supabase
    .from("user_progress")
    .select("module_id, status")
    .eq("user_id", session.user.id)

  // Calculate progress for each roadmap
  const roadmapsWithProgress = userRoadmaps?.map(roadmap => {
    const totalModules = roadmap.roadmaps.modules?.length || 0
    const completedModules = roadmap.roadmaps.modules?.filter((module: Module) => 
      userProgress?.some(progress => 
        progress.module_id === module.id && progress.status === "completed"
      )
    ).length || 0
    const progress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0

    return {
      ...roadmap,
      progress
    }
  })

  // Get user's stats
  const { data: userStats } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", session.user.id)
    .single()

  // Get user's earned badges
  const { data: earnedBadges } = await supabase
    .from("user_badges")
    .select("*")
    .eq("user_id", session.user.id)
    .order("earned_at", { ascending: false })
    .limit(3)

  // Get recent badges with details
  const recentBadges = earnedBadges?.map((earnedBadge) => {
    const badge = DEFAULT_BADGES.find((b) => b.id === earnedBadge.badge_id)
    return {
      id: earnedBadge.badge_id,
      name: badge?.name || "",
      icon: badge?.icon || "",
      earnedAt: new Date(earnedBadge.earned_at),
    }
  }) || []

  // Get content curator's uploaded content
  const { data: uploadedContent } = await supabase
    .from("roadmaps")
    .select(`
      *,
      modules (
        id,
        title,
        description,
        week_number,
        xp_reward
      )
    `)
    .eq("created_by", session.user.id)
    .order("created_at", { ascending: false })

  // Get content curator's statistics
  const { data: contentStats } = await supabase
    .from("user_progress")
    .select("status, module_id")
    .in(
      "module_id",
      uploadedContent?.flatMap((roadmap: Roadmap) => roadmap.modules?.map((module: Module) => module.id) || []) || []
    )

  const totalModules = uploadedContent?.reduce((sum, roadmap) => sum + (roadmap.modules?.length || 0), 0) || 0
  const completedModules = contentStats?.filter((stat) => stat.status === "completed").length || 0

  // Get recommended roadmaps based on interests
  const { data: recommendedRoadmaps } = await supabase
    .from("roadmaps")
    .select("*")
    .in("skill_category", profile.interests)
    .not(
      "id",
      "in",
      (userRoadmaps || []).map((ur) => ur.roadmap_id),
    )
    .limit(3)

    console.log(userStats)

  return (
    <DashboardLayout>
      <div className="container p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back!</h1>
            <p className="text-muted-foreground">
              {profile.role === "content_curator"
                ? "Manage your learning content and track engagement"
                : "Track your progress and continue your learning journey"}
            </p>
          </div>
          {profile.role === "learner" && (
            <Link href="/roadmaps/explore">
              <Button>Explore Roadmaps</Button>
            </Link>
          )}
          {profile.role === "content_curator" && (
            <Link href="/roadmaps/create">
              <Button>Create New Roadmap</Button>
            </Link>
          )}
        </div>

        <AchievementSummary
          xpEarned={userStats?.xp_earned || 0}
          badgesEarned={earnedBadges?.length || 0}
          totalBadges={DEFAULT_BADGES.length}
          recentBadges={recentBadges}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {profile.role === "learner" ? (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Active Roadmaps</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userRoadmaps?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {userRoadmaps?.length === 0 ? "Start a new roadmap today!" : "Keep up the good work!"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Weekly Learning</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profile.weekly_learning_time}h</div>
                  <p className="text-xs text-muted-foreground">Your weekly commitment</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Completed Modules</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats?.modules_completed || 0}</div>
                  <p className="text-xs text-muted-foreground">Keep learning to earn more!</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Perfect Weeks</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats?.perfect_weeks || 0}</div>
                  <p className="text-xs text-muted-foreground">Weeks with perfect attendance</p>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{profile.role === "content_curator" ? "Total Created Content" : "Total Roadmaps"}</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{uploadedContent?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">Roadmaps created</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalModules}</div>
                  <p className="text-xs text-muted-foreground">Learning modules created</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Completed Modules</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedModules}</div>
                  <p className="text-xs text-muted-foreground">Modules completed by learners</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">Overall completion rate</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {profile.role === "content_curator" && uploadedContent && uploadedContent.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">{profile.role === "content_curator" ? "Your Created Content" : "Your Roadmaps"}</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {uploadedContent.map((roadmap) => (
                <Card key={roadmap.id}>
                  <CardHeader>
                    <CardTitle>{roadmap.title}</CardTitle>
                    <CardDescription>{roadmap.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{roadmap.skill_category}</span>
                      <span className="text-muted-foreground">{roadmap.duration_weeks} weeks</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link href={`/roadmaps/${roadmap.id}/edit`}>
                        <Button variant="outline" className="w-full">
                          Edit Roadmap
                        </Button>
                      </Link>
                      <Link href={`/discussions?id=${roadmap.id}`}>
                        <Button variant="outline" className="w-full">
                          <MessageSquare className="mr-2 h-4 w-4" />
                          View Discussions
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : null}

        {profile.role === "learner" && userRoadmaps && userRoadmaps.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Your Active Roadmaps</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {roadmapsWithProgress?.map((userRoadmap) => (
                <Card key={userRoadmap.id}>
                  <CardHeader>
                    <CardTitle>{userRoadmap.roadmaps.title}</CardTitle>
                    <CardDescription>{userRoadmap.roadmaps.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{userRoadmap.progress}%</span>
                      </div>
                      <Progress value={userRoadmap.progress} />
                    </div>
                    <Link href={`/roadmaps/${userRoadmap.roadmap_id}`}>
                      <Button variant="outline" className="w-full">
                        Continue Learning
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : null}

        {profile.role === "learner" && recommendedRoadmaps && recommendedRoadmaps.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Recommended for You</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {recommendedRoadmaps.map((roadmap) => (
                <Card key={roadmap.id}>
                  <CardHeader>
                    <CardTitle>{roadmap.title}</CardTitle>
                    <CardDescription>{roadmap.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-sm text-muted-foreground">{roadmap.skill_category}</div>
                      <div className="text-sm text-muted-foreground">{roadmap.duration_weeks} weeks</div>
                    </div>
                    <Link href={`/roadmaps/${roadmap.id}/start`}>
                      <Button className="w-full">Start Roadmap</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  )
}
