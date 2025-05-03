import { createServerSupabaseClient, getSession } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { BadgeCard } from "../components/badge-card"
import { DEFAULT_BADGES, calculateBadgeProgress } from "@/app/lib/badges"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function AchievementsPage() {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const supabase = createServerSupabaseClient()

  // Get user's earned badges
  const { data: earnedBadges } = await supabase
    .from("user_badges")
    .select("*")
    .eq("user_id", session.user.id)

  // Get user's stats
  const { data: userStats } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", session.user.id)
    .single()

  // Calculate progress for each badge
  const badgesWithProgress = DEFAULT_BADGES.map((badge) => {
    const earnedBadge = earnedBadges?.find((b) => b.badge_id === badge.id)
    const progress = calculateBadgeProgress(badge.criteria, {
      modulesCompleted: userStats?.modules_completed || 0,
      roadmapsCompleted: userStats?.roadmaps_completed || 0,
      discussionsCreated: userStats?.discussions_created || 0,
      commentsMade: userStats?.comments_made || 0,
      xpEarned: userStats?.xp_earned || 0,
      consecutiveDays: userStats?.consecutive_days || 0,
      perfectWeeks: userStats?.perfect_weeks || 0,
      earlyBirdCompletions: userStats?.early_bird_completions || 0,
      nightOwlCompletions: userStats?.night_owl_completions || 0,
    })

    return {
      badge,
      progress,
      earned: !!earnedBadge,
      earnedAt: earnedBadge?.earned_at ? new Date(earnedBadge.earned_at) : undefined,
    }
  })

  // Group badges by category
  const badgesByCategory = badgesWithProgress.reduce(
    (acc, { badge, progress, earned, earnedAt }) => {
      if (!acc[badge.category]) {
        acc[badge.category] = []
      }
      acc[badge.category].push({ badge, progress, earned, earnedAt })
      return acc
    },
    {} as Record<string, typeof badgesWithProgress>
  )
  console.log(userStats)

  return (
    <DashboardLayout>
      <div className="container p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Achievements</h1>
          <p className="text-muted-foreground">Track your progress and earn badges</p>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Badges</TabsTrigger>
            <TabsTrigger value="learning">Learning</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="mastery">Mastery</TabsTrigger>
            <TabsTrigger value="social">Social</TabsTrigger>
            <TabsTrigger value="special">Special</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {Object.entries(badgesByCategory).map(([category, badges]) => (
              <div key={category} className="space-y-4">
                <h2 className="text-xl font-semibold capitalize">{category}</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {badges.map(({ badge, progress, earned, earnedAt }) => (
                    <BadgeCard
                      key={badge.id}
                      badge={badge}
                      progress={progress}
                      earned={earned}
                      earnedAt={earnedAt}
                    />
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          {Object.entries(badgesByCategory).map(([category, badges]) => (
            <TabsContent key={category} value={category} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {badges.map(({ badge, progress, earned, earnedAt }) => (
                  <BadgeCard
                    key={badge.id}
                    badge={badge}
                    progress={progress}
                    earned={earned}
                    earnedAt={earnedAt}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
