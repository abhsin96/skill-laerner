export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  criteria: BadgeCriteria
  xp_reward: number
  category: BadgeCategory
}

export interface BadgeCriteria {
  type: BadgeCriteriaType
  value: number
  timeframe?: string // e.g., "7d" for 7 days, "30d" for 30 days
}

export type BadgeCategory = 
  | "learning" 
  | "engagement" 
  | "mastery" 
  | "social" 
  | "special"

export type BadgeCriteriaType = 
  | "modules_completed"
  | "roadmaps_completed"
  | "discussions_created"
  | "comments_made"
  | "xp_earned"
  | "consecutive_days"
  | "perfect_week"
  | "early_bird"
  | "night_owl"

export const BADGE_ICONS: Record<string, string> = {
  "learning": "🎓",
  "engagement": "💬",
  "mastery": "🏆",
  "social": "👥",
  "special": "⭐",
  "modules_completed": "📚",
  "roadmaps_completed": "🎯",
  "discussions_created": "💭",
  "comments_made": "💬",
  "xp_earned": "✨",
  "consecutive_days": "🔥",
  "perfect_week": "🌟",
  "early_bird": "🌅",
  "night_owl": "🌙"
}

export const DEFAULT_BADGES: Badge[] = [
  {
    id: "first_module",
    name: "First Steps",
    description: "Complete your first module",
    icon: "📚",
    criteria: {
      type: "modules_completed",
      value: 1
    },
    xp_reward: 50,
    category: "learning"
  },
  {
    id: "module_master",
    name: "Module Master",
    description: "Complete 10 modules",
    icon: "📚",
    criteria: {
      type: "modules_completed",
      value: 10
    },
    xp_reward: 200,
    category: "learning"
  },
  {
    id: "roadmap_completer",
    name: "Roadmap Champion",
    description: "Complete your first roadmap",
    icon: "🎯",
    criteria: {
      type: "roadmaps_completed",
      value: 1
    },
    xp_reward: 500,
    category: "mastery"
  },
  {
    id: "discussion_starter",
    name: "Discussion Starter",
    description: "Create your first discussion",
    icon: "💭",
    criteria: {
      type: "discussions_created",
      value: 1
    },
    xp_reward: 100,
    category: "social"
  },
  {
    id: "active_commenter",
    name: "Active Commenter",
    description: "Make 10 comments",
    icon: "💬",
    criteria: {
      type: "comments_made",
      value: 10
    },
    xp_reward: 150,
    category: "engagement"
  },
  {
    id: "xp_collector",
    name: "XP Collector",
    description: "Earn 1000 XP",
    icon: "✨",
    criteria: {
      type: "xp_earned",
      value: 1000
    },
    xp_reward: 200,
    category: "mastery"
  },
  {
    id: "streak_3",
    name: "3-Day Streak",
    description: "Learn for 3 consecutive days",
    icon: "🔥",
    criteria: {
      type: "consecutive_days",
      value: 3
    },
    xp_reward: 100,
    category: "special"
  },
  {
    id: "streak_7",
    name: "7-Day Streak",
    description: "Learn for 7 consecutive days",
    icon: "🔥",
    criteria: {
      type: "consecutive_days",
      value: 7
    },
    xp_reward: 300,
    category: "special"
  },
  {
    id: "perfect_week",
    name: "Perfect Week",
    description: "Complete all modules in a week",
    icon: "🌟",
    criteria: {
      type: "perfect_week",
      value: 1
    },
    xp_reward: 500,
    category: "special"
  },
  {
    id: "early_bird",
    name: "Early Bird",
    description: "Complete a module before 9 AM",
    icon: "🌅",
    criteria: {
      type: "early_bird",
      value: 1
    },
    xp_reward: 100,
    category: "special"
  },
  {
    id: "night_owl",
    name: "Night Owl",
    description: "Complete a module after 9 PM",
    icon: "🌙",
    criteria: {
      type: "night_owl",
      value: 1
    },
    xp_reward: 100,
    category: "special"
  }
]

export function calculateBadgeProgress(
  criteria: BadgeCriteria,
  userStats: {
    modulesCompleted: number
    roadmapsCompleted: number
    discussionsCreated: number
    commentsMade: number
    xpEarned: number
    consecutiveDays: number
    perfectWeeks: number
    earlyBirdCompletions: number
    nightOwlCompletions: number
  }
): number {
  switch (criteria.type) {
    case "modules_completed":
      return Math.min((userStats.modulesCompleted / criteria.value) * 100, 100)
    case "roadmaps_completed":
      return Math.min((userStats.roadmapsCompleted / criteria.value) * 100, 100)
    case "discussions_created":
      return Math.min((userStats.discussionsCreated / criteria.value) * 100, 100)
    case "comments_made":
      return Math.min((userStats.commentsMade / criteria.value) * 100, 100)
    case "xp_earned":
      return Math.min((userStats.xpEarned / criteria.value) * 100, 100)
    case "consecutive_days":
      return Math.min((userStats.consecutiveDays / criteria.value) * 100, 100)
    case "perfect_week":
      return Math.min((userStats.perfectWeeks / criteria.value) * 100, 100)
    case "early_bird":
      return Math.min((userStats.earlyBirdCompletions / criteria.value) * 100, 100)
    case "night_owl":
      return Math.min((userStats.nightOwlCompletions / criteria.value) * 100, 100)
    default:
      return 0
  }
} 