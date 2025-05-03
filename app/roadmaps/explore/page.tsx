"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Clock, Users, BookOpen, Loader2 } from "lucide-react"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"

interface Roadmap {
  id: string
  title: string
  description: string
  skill_category: string
  duration_weeks: number
  created_at: string
  created_by: string
  creator_name?: string
  modules_count?: number
  enrolled_count?: number
}

export default function ExploreRoadmapsPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("newest")
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([])
  const [recommendedRoadmaps, setRecommendedRoadmaps] = useState<Roadmap[]>([])
  const [roadmapsByCategory, setRoadmapsByCategory] = useState<Record<string, Roadmap[]>>({})

  useEffect(() => {
    fetchRoadmaps()
  }, [sortBy])

  const fetchRoadmaps = async () => {
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/login")
        return
      }

      // Get user profile for interests
      const { data: profile } = await supabase
        .from("profiles")
        .select("interests, role")
        .eq("user_id", user.id)
        .single()

      // Get user's enrolled roadmaps (both active and completed)
      const { data: userRoadmaps } = await supabase
        .from("user_roadmaps")
        .select("roadmap_id")
        .eq("user_id", user.id)

      const userRoadmapIds = userRoadmaps?.map((ur) => ur.roadmap_id) || []

      // Get recommended roadmaps based on interests
      const { data: recommended } = await supabase
        .from("roadmaps")
        .select(`
          *,
          modules:modules(count),
          enrolled:user_roadmaps(count)
        `)
        .not("id", "in", userRoadmapIds) // Exclude user's enrolled roadmaps
        .limit(6)

      // Get all roadmaps with additional data
      const { data: all } = await supabase
        .from("roadmaps")
        .select(`
          *,
          modules:modules(count),
          enrolled:user_roadmaps(count)
        `)
        .not("id", "in", userRoadmapIds) // Exclude user's enrolled roadmaps
        .order(sortBy === "newest" ? "created_at" : "title", { ascending: sortBy === "newest" ? false : true })

      if (recommended) {
        // Filter recommended roadmaps based on interests if they exist
        const filteredRecommended = profile?.interests && profile.interests.length > 0
          ? recommended.filter(r => profile.interests.includes(r.skill_category))
          : recommended

        setRecommendedRoadmaps(filteredRecommended.map(r => ({
          ...r,
          modules_count: r.modules?.[0]?.count || 0,
          enrolled_count: r.enrolled?.[0]?.count || 0
        })))
      }

      if (all) {
        setRoadmaps(all.map(r => ({
          ...r,
          modules_count: r.modules?.[0]?.count || 0,
          enrolled_count: r.enrolled?.[0]?.count || 0
        })))

        // Group roadmaps by category
        const byCategory: Record<string, Roadmap[]> = {}
        all.forEach((roadmap) => {
          if (!byCategory[roadmap.skill_category]) {
            byCategory[roadmap.skill_category] = []
          }
          byCategory[roadmap.skill_category].push({
            ...roadmap,
            modules_count: roadmap.modules?.[0]?.count || 0,
            enrolled_count: roadmap.enrolled?.[0]?.count || 0
          })
        })
        setRoadmapsByCategory(byCategory)
      }
    } catch (error) {
      toast({
        title: "Error fetching roadmaps",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredRoadmaps = roadmaps.filter(roadmap => 
    roadmap.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    roadmap.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    roadmap.skill_category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const RoadmapCard = ({ roadmap }: { roadmap: Roadmap }) => (
    <Card key={roadmap.id} className="h-full">
      <CardHeader>
        <CardTitle>{roadmap.title}</CardTitle>
        <CardDescription>{roadmap.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{roadmap.duration_weeks} weeks</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>{roadmap.modules_count || 0} modules</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{roadmap.enrolled_count || 0} enrolled</span>
          </div>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{roadmap.skill_category}</span>
        </div>
        <Link href={`/roadmaps/${roadmap.id}/start`}>
          <Button className="w-full">Start Roadmap</Button>
        </Link>
      </CardContent>
    </Card>
  )

  return (
    <DashboardLayout>
      <div className="container p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Explore Roadmaps</h1>
            <p className="text-muted-foreground">Discover new learning paths and skills</p>
          </div>
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="title">Alphabetical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search roadmaps..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Tabs defaultValue="recommended" className="space-y-4">
          <TabsList>
            <TabsTrigger value="recommended">Recommended</TabsTrigger>
            <TabsTrigger value="all">All Roadmaps</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="recommended" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : recommendedRoadmaps.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recommendedRoadmaps.map((roadmap) => (
                  <RoadmapCard key={roadmap.id} roadmap={roadmap} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium">No recommended roadmaps</h3>
                <p className="text-muted-foreground">Try exploring all roadmaps instead</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : filteredRoadmaps.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredRoadmaps.map((roadmap) => (
                  <RoadmapCard key={roadmap.id} roadmap={roadmap} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium">No roadmaps found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : Object.keys(roadmapsByCategory).length > 0 ? (
              Object.entries(roadmapsByCategory).map(([category, roadmaps]) => (
                <div key={category} className="space-y-4">
                  <h2 className="text-xl font-semibold">{category}</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {roadmaps.map((roadmap) => (
                      <RoadmapCard key={roadmap.id} roadmap={roadmap} />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium">No categories available</h3>
                <p className="text-muted-foreground">Check back later for new content</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
