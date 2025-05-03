import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Trophy } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface AchievementSummaryProps {
  xpEarned: number
  badgesEarned: number
  totalBadges: number
  recentBadges: Array<{
    id: string
    name: string
    icon: string
    earnedAt: Date
  }>
}

export function AchievementSummary({
  xpEarned,
  badgesEarned,
  totalBadges,
  recentBadges,
}: AchievementSummaryProps) {
 
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total XP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{xpEarned}</div>
            <p className="text-sm text-muted-foreground">Keep learning to earn more XP</p>
          </CardContent>
        </Card>

        {/* <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Badges Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{badgesEarned}</div>
            <p className="text-sm text-muted-foreground">
              Out of {totalBadges} total badges
            </p>
          </CardContent>
        </Card> */}

        {/* <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Achievement Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Overall</span>
                <span>{Math.round((badgesEarned / totalBadges) * 100)}%</span>
              </div>
              <Progress value={Math.round((badgesEarned / totalBadges) * 100)} />
            </div>
          </CardContent>
        </Card> */}
      </div>

      {recentBadges.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Achievements</CardTitle>
                <CardDescription>Your latest earned badges</CardDescription>
              </div>
              <Link href="/achievements">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentBadges.map((badge) => (
                <Card key={badge.id} className="border-primary">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{badge.icon}</span>
                      <CardTitle className="text-base">{badge.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Earned on {badge.earnedAt.toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 