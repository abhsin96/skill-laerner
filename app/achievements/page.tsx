import { createServerSupabaseClient, getSession } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Award, Star, Trophy } from "lucide-react"

export default async function AchievementsPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const supabase = createServerSupabaseClient()

  // Get user's XP
  const { data: xpData } = await supabase.from("xp_transactions").select("amount").eq("user_id", session.user.id)

  const totalXp = xpData?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0

  // Get user's badges
  const { data: userBadges } = await supabase
    .from("user_badges")
    .select(`
      *,
      badges:badge_id (
        id,
        name,
        description,
        image_url,
        badge_type,
        requirement
      )
    `)
    .eq("user_id", session.user.id)

  // Get all available badges
  const { data: allBadges } = await supabase.from("badges").select("*")

  // Separate badges by type
  const earnedBadges = userBadges || []
  const earnedBadgeIds = earnedBadges.map((ub) => ub.badge_id)

  const availableBadges = (allBadges || []).filter((badge) => !earnedBadgeIds.includes(badge.id))

  // Group badges by type
  const groupBadgesByType = (badges: any[]) => {
    return badges.reduce(
      (acc, badge) => {
        const type = badge.badge_type || badge.badges.badge_type
        if (!acc[type]) {
          acc[type] = []
        }
        acc[type].push(badge)
        return acc
      },
      {} as Record<string, any[]>,
    )
  }

  const earnedByType = groupBadgesByType(earnedBadges)
  const availableByType = groupBadgesByType(availableBadges)

  return (
    <DashboardLayout>
      <div className="container p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Achievements</h1>
          <p className="text-muted-foreground">Track your progress and earn badges</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Total XP</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalXp}</div>
              <p className="text-sm text-muted-foreground">Keep learning to earn more XP</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Badges Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{earnedBadges.length}</div>
              <p className="text-sm text-muted-foreground">Out of {(allBadges || []).length} total badges</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Achievement Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall</span>
                  <span>{Math.round((earnedBadges.length / (allBadges?.length || 1)) * 100)}%</span>
                </div>
                <Progress value={Math.round((earnedBadges.length / (allBadges?.length || 1)) * 100)} />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="earned" className="space-y-4">
          <TabsList>
            <TabsTrigger value="earned">Earned Badges ({earnedBadges.length})</TabsTrigger>
            <TabsTrigger value="available">Available Badges ({availableBadges.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="earned" className="space-y-6">
            {Object.keys(earnedByType).length > 0 ? (
              Object.entries(earnedByType).map(([type, badges]) => (
                <div key={type} className="space-y-4">
                  <h2 className="text-xl font-semibold capitalize">{type} Badges</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {badges.map((badge) => (
                      <Card key={badge.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{badge.badges.name}</CardTitle>
                            <Trophy className="h-5 w-5 text-primary" />
                          </div>
                          <CardDescription>{badge.badges.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Earned on</span>
                            <span>{new Date(badge.earned_at).toLocaleDateString()}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No badges earned yet</h3>
                <p className="text-muted-foreground">Complete modules and stay consistent to earn badges</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="available" className="space-y-6">
            {Object.keys(availableByType).length > 0 ? (
              Object.entries(availableByType).map(([type, badges]) => (
                <div key={type} className="space-y-4">
                  <h2 className="text-xl font-semibold capitalize">{type} Badges</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {badges.map((badge) => (
                      <Card key={badge.id} className="opacity-70">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{badge.name}</CardTitle>
                            <Award className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <CardDescription>{badge.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Requirement</span>
                            <span>
                              {badge.requirement}{" "}
                              {badge.badge_type === "streak"
                                ? "days"
                                : badge.badge_type === "progress"
                                  ? "modules"
                                  : "mastery points"}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">You've earned all available badges!</h3>
                <p className="text-muted-foreground">Check back later for new badges to earn</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
