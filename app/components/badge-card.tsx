import { Badge } from "@/app/lib/badges"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface BadgeCardProps {
  badge: Badge
  progress: number
  earned?: boolean
  earnedAt?: Date
}

export function BadgeCard({ badge, progress, earned, earnedAt }: BadgeCardProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className={`relative overflow-hidden ${earned ? "border-primary" : ""}`}>
            {earned && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-2 py-1 text-xs font-medium">
                Earned
              </div>
            )}
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{badge.icon}</span>
                <CardTitle className="text-lg">{badge.name}</CardTitle>
              </div>
              <CardDescription>{badge.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
                {earned && earnedAt && (
                  <p className="text-xs text-muted-foreground text-right">
                    Earned on {earnedAt.toLocaleDateString()}
                  </p>
                )}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">XP Reward</span>
                  <span className="font-medium">+{badge.xp_reward} XP</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">
            {badge.criteria.type === "modules_completed" && `Complete ${badge.criteria.value} modules`}
            {badge.criteria.type === "roadmaps_completed" && `Complete ${badge.criteria.value} roadmaps`}
            {badge.criteria.type === "discussions_created" && `Create ${badge.criteria.value} discussions`}
            {badge.criteria.type === "comments_made" && `Make ${badge.criteria.value} comments`}
            {badge.criteria.type === "xp_earned" && `Earn ${badge.criteria.value} XP`}
            {badge.criteria.type === "consecutive_days" && `Learn for ${badge.criteria.value} consecutive days`}
            {badge.criteria.type === "perfect_week" && "Complete all modules in a week"}
            {badge.criteria.type === "early_bird" && "Complete a module before 9 AM"}
            {badge.criteria.type === "night_owl" && "Complete a module after 9 PM"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 