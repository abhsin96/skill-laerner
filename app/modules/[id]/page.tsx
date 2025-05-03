"use client"

import { useEffect, useState, use } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, CheckCircle, Circle, Clock, ExternalLink, MessageSquare, Video } from "lucide-react"
import Link from "next/link"
import { ModuleProgressButton } from "./module-progress-button"
import DiscussionList from "./discussion-list"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"

interface Resource {
  id: string
  title: string
  description: string
  type: "blog" | "quiz" | "video"
  url: string
}

interface Progress {
  id: string
  user_id: string
  module_id: string
  status: "not_started" | "in_progress" | "completed"
  completed_at: string | null
  created_at: string
}

export default function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(true)
  const [module, setModule] = useState<any>(null)
  const [resources, setResources] = useState<Resource[]>([])
  const [discussions, setDiscussions] = useState<any[]>([])
  const [progress, setProgress] = useState<Progress | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<Resource | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    fetchModuleData()
  }, [resolvedParams.id])

  const fetchModuleData = async () => {
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/login")
        return
      }

      setUserId(user.id)

      // Get module details
      const { data: moduleData } = await supabase
        .from("modules")
        .select(`
          *,
          roadmaps:roadmap_id (
            id,
            title
          )
        `)
        .eq("id", resolvedParams.id)
        .single()

      if (!moduleData) {
        router.push("/dashboard")
        return
      }

      setModule(moduleData)

      // Check if user has access to this module's roadmap
      const { data: userRoadmap } = await supabase
        .from("user_roadmaps")
        .select("*")
        .eq("user_id", user.id)
        .eq("roadmap_id", moduleData.roadmap_id)
        .single()

      if (!userRoadmap) {
        router.push(`/roadmaps/${moduleData.roadmap_id}/start`)
        return
      }

      // Get user progress for this module
      const { data: progressData } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("module_id", resolvedParams.id)
        .single()

      if (!progressData) {
        // Create progress entry if it doesn't exist
        const { data: newProgress } = await supabase.from("user_progress").insert({
          user_id: user.id,
          module_id: resolvedParams.id,
          status: "not_started",
        }).select().single()
        setProgress(newProgress)
      } else {
        setProgress(progressData)
      }

      // Get resources for this module
      const { data: resourcesData } = await supabase
        .from("resources")
        .select("*")
        .eq("module_id", resolvedParams.id)
        .order("created_at", { ascending: true })

      setResources(resourcesData || [])

      // Get discussions for this module
      const { data: discussionsData } = await supabase
        .from("discussions")
        .select(`
          *,
          profiles:user_id (
            id,
            user_id
          ),
          comment_count:comments(count)
        `)
        .eq("module_id", resolvedParams.id)
        .order("created_at", { ascending: false })

      setDiscussions(discussionsData || [])
    } catch (error) {
      toast({
        title: "Error loading module",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVideoAccess = async (resource: Resource) => {
    try {
      setSelectedVideo(resource)
      
      // Extract the filename from the URL
      const fileName = resource.url.split("/").pop()
      if (!fileName) {
        throw new Error("Invalid video URL")
      }

      // Get the video URL from Supabase storage
      const { data, error } = await supabase.storage
        .from('contentvideo')
        .createSignedUrl(fileName, 3600) // URL valid for 1 hour

      if (error) {
        console.error("Storage error:", error)
        throw error
      }

      if (!data?.signedUrl) {
        throw new Error("Failed to generate video URL")
      }

      setVideoUrl(data.signedUrl)
    } catch (error: any) {
      console.error("Video access error:", error)
      toast({
        title: "Error loading video",
        description: error.message || "Please try again later",
        variant: "destructive",
      })
      setSelectedVideo(null)
      setVideoUrl(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="container p-4 md:p-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : module ? (
          <>
            <div className="flex items-center gap-2">
              <Link href={`/roadmaps/${module.roadmap_id}`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{module.title}</h1>
                <p className="text-muted-foreground">
                  <Link href={`/roadmaps/${module.roadmap_id}`} className="hover:underline">
                    {module.roadmaps.title}
                  </Link>
                  {" • "}
                  Week {module.week_number}
                </p>
              </div>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Module Status</CardTitle>
                  <div className="flex items-center gap-1 text-sm">
                    {progress?.status === "completed" ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span className="text-primary">Completed</span>
                      </>
                    ) : progress?.status === "in_progress" ? (
                      <>
                        <Clock className="h-4 w-4 text-amber-500" />
                        <span className="text-amber-500">In Progress</span>
                      </>
                    ) : (
                      <>
                        <Circle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Not Started</span>
                      </>
                    )}
                  </div>
                </div>
                <CardDescription>{module.description}</CardDescription>
              </CardHeader>
              <CardFooter>
                {userId && progress && (
                  <ModuleProgressButton
                    userId={userId}
                    moduleId={resolvedParams.id}
                    currentStatus={progress.status}
                    xpReward={module.xp_reward}
                    onStatusChange={(newStatus) => {
                      setProgress(prev => prev ? {
                        ...prev,
                        status: newStatus,
                        completed_at: newStatus === "completed" ? new Date().toISOString() : null
                      } : null)
                    }}
                  />
                )}
              </CardFooter>
            </Card>

            <Tabs defaultValue="resources" className="space-y-4">
              <TabsList>
                <TabsTrigger value="resources">Learning Resources</TabsTrigger>
                <TabsTrigger value="discussions">Discussions</TabsTrigger>
              </TabsList>

              <TabsContent value="resources" className="space-y-4">
                {resources && resources.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {resources.map((resource) => (
                      <Card key={resource.id}>
                        <CardHeader>
                          <CardTitle className="text-base">{resource.title}</CardTitle>
                          <CardDescription>
                            {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">{resource.description}</p>
                          {resource.type === "video" ? (
                            <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={() => handleVideoAccess(resource)}
                            >
                              <Video className="mr-2 h-4 w-4" />
                              Watch Video
                            </Button>
                          ) : (
                            <a href={resource.url} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" className="w-full">
                                Access Resource <ExternalLink className="ml-2 h-4 w-4" />
                              </Button>
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium">No resources available</h3>
                    <p className="text-muted-foreground">This module doesn't have any resources yet.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="discussions" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Module Discussions</h2>
                  <Link href={`/modules/${resolvedParams.id}/discussions/new`}>
                    <Button>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      New Discussion
                    </Button>
                  </Link>
                </div>

                <div className="space-y-4">
                  <DiscussionList 
                    discussions={discussions || []} 
                    moduleId={resolvedParams.id} 
                    userId={userId || ''} 
                  />
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">Module not found</h3>
            <p className="text-muted-foreground">The module you're looking for doesn't exist or you don't have access to it.</p>
            <Button className="mt-4" onClick={() => router.push('/dashboard')}>
              Return to Dashboard
            </Button>
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => {
        setSelectedVideo(null)
        setVideoUrl(null)
      }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedVideo?.title}</DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full">
            {videoUrl && (
              <video
                src={videoUrl}
                controls
                className="w-full h-full rounded-lg"
                autoPlay
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2">{selectedVideo?.description}</p>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
