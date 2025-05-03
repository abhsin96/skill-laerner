import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Badge, DEFAULT_BADGES, calculateBadgeProgress } from "./badges"

export async function checkAndAwardBadges(userId: string) {
  const supabase = createClientComponentClient()

  // Get user's stats
  const { data: userStats } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (!userStats) return

  // Get user's earned badges
  const { data: earnedBadges } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId)

  const earnedBadgeIds = new Set(earnedBadges?.map((b) => b.badge_id) || [])

  // Check each badge
  for (const badge of DEFAULT_BADGES) {
    if (earnedBadgeIds.has(badge.id)) continue

    const progress = calculateBadgeProgress(badge.criteria, {
      modulesCompleted: userStats.modules_completed || 0,
      roadmapsCompleted: userStats.roadmaps_completed || 0,
      discussionsCreated: userStats.discussions_created || 0,
      commentsMade: userStats.comments_made || 0,
      xpEarned: userStats.xp_earned || 0,
      consecutiveDays: userStats.consecutive_days || 0,
      perfectWeeks: userStats.perfect_weeks || 0,
      earlyBirdCompletions: userStats.early_bird_completions || 0,
      nightOwlCompletions: userStats.night_owl_completions || 0,
    })

    if (progress >= 100) {
      // Award badge
      await supabase.from("user_badges").insert({
        user_id: userId,
        badge_id: badge.id,
        earned_at: new Date().toISOString(),
      })

      // Award XP
      await supabase.from("xp_transactions").insert({
        user_id: userId,
        amount: badge.xp_reward,
        type: "badge",
        description: `Earned ${badge.name} badge`,
      })

      // Update user's total XP
      await supabase
        .from("user_stats")
        .update({
          xp_earned: (userStats.xp_earned || 0) + badge.xp_reward,
        })
        .eq("user_id", userId)
    }
  }
}

export async function updateUserStats(
  userId: string,
  update: {
    modulesCompleted?: number
    roadmapsCompleted?: number
    discussionsCreated?: number
    commentsMade?: number
    xpEarned?: number
    consecutiveDays?: number
    perfectWeeks?: number
    earlyBirdCompletions?: number
    nightOwlCompletions?: number
  }
) {
  const supabase = createClientComponentClient()

  // Get current stats
  const { data: currentStats } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .single()

  // Update stats
  await supabase
    .from("user_stats")
    .upsert({
      user_id: userId,
      modules_completed: (currentStats?.modules_completed || 0) + (update.modulesCompleted || 0),
      roadmaps_completed: (currentStats?.roadmaps_completed || 0) + (update.roadmapsCompleted || 0),
      discussions_created: (currentStats?.discussions_created || 0) + (update.discussionsCreated || 0),
      comments_made: (currentStats?.comments_made || 0) + (update.commentsMade || 0),
      xp_earned: (currentStats?.xp_earned || 0) + (update.xpEarned || 0),
      consecutive_days: update.consecutiveDays || currentStats?.consecutive_days || 0,
      perfect_weeks: (currentStats?.perfect_weeks || 0) + (update.perfectWeeks || 0),
      early_bird_completions: (currentStats?.early_bird_completions || 0) + (update.earlyBirdCompletions || 0),
      night_owl_completions: (currentStats?.night_owl_completions || 0) + (update.nightOwlCompletions || 0),
    })

  // Check for new badges
  await checkAndAwardBadges(userId)
}

export async function getUserBadges(userId: string) {
  const supabase = createClientComponentClient()

  // Get user's earned badges
  const { data: earnedBadges } = await supabase
    .from("user_badges")
    .select("*")
    .eq("user_id", userId)

  // Get user's stats
  const { data: userStats } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
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

  return badgesWithProgress
} 