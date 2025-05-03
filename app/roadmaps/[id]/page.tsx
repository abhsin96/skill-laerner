"use client"

import { useEffect, useState, use } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter, useSearchParams } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, CheckCircle, Circle, Clock, MessageSquare, Plus, Send, Video } from "lucide-react"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  discussion_id: string
  user: {
    user_id: string
  }
}

interface Discussion {
  id: string
  title: string
  content: string
  created_at: string
  user_id: string
  roadmap_id: string
  author: {
    user_id: string
  }
  replies_count: number
  module?: {
    week_number: number
  }
  comments?: Comment[]
}

interface Module {
  id: string
  title: string
  description: string
  week_number: number
  user_progress: {
    id: string
    status: string
    completed_at: string | null
  }[]
  resources: Resource[]
}

interface Resource {
  id: string
  title: string
  description: string
  type: "blog" | "quiz" | "video"
  url: string
}

export default function RoadmapPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(true)
  const [roadmap, setRoadmap] = useState<any>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [newDiscussion, setNewDiscussion] = useState({ title: "", content: "", module_id: "" })
  const [isCreatingDiscussion, setIsCreatingDiscussion] = useState(false)
  const [newComments, setNewComments] = useState<{ [key: string]: string }>({})
  const [expandedDiscussions, setExpandedDiscussions] = useState<{ [key: string]: boolean }>({})
  const [isContentCurator, setIsContentCurator] = useState(false)
  const [defaultTab, setDefaultTab] = useState("modules")
  const [selectedVideo, setSelectedVideo] = useState<Resource | null>(null)

  useEffect(() => {
    fetchRoadmapData()
  }, [resolvedParams.id])

  useEffect(() => {
    // Set default tab based on URL parameter
    const tab = searchParams.get("tab")
    if (tab === "discussions") {
      setDefaultTab("discussions")
    }
  }, [searchParams])

  const fetchRoadmapData = async () => {
    try {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/login")
        return
      }

      // Check if user is a content curator
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single()

      // Redirect content curators to edit page
      if (profile?.role === "content_curator") {
        router.push(`/roadmaps/${resolvedParams.id}/edit`)
        return
      }

      // Check if user has this roadmap
      const { data: userRoadmap } = await supabase
        .from("user_roadmaps")
        .select("*")
        .eq("user_id", user.id)
        .eq("roadmap_id", resolvedParams.id)
        .single()

      if (!userRoadmap) {
        router.push(`/roadmaps/${resolvedParams.id}/start`)
        return
      }

      // Get roadmap details
      const { data: roadmapData } = await supabase
        .from("roadmaps")
        .select("*")
        .eq("id", resolvedParams.id)
        .single()

      if (!roadmapData) {
        router.push("/roadmaps")
        return
      }

      setRoadmap(roadmapData)

      // Get modules with progress
      const { data: modulesData } = await supabase
        .from("modules")
        .select(`
          *,
          user_progress:user_progress!inner(
            id,
            status,
            completed_at
          )
        `)
        .eq("roadmap_id", resolvedParams.id)
        .eq("user_progress.user_id", user.id)
        .order("week_number", { ascending: true })
        
      if (modulesData) {
        setModules(modulesData)
      }

      // Get discussions
      const { data: discussionsData } = await supabase
        .from("discussions")
        .select(`
          *,
          author:profiles(user_id),
          replies:comments(count),
          module:modules!discussions_module_id_fkey(
            id,
            title,
            week_number
          )
        `)
        .in("module_id", modulesData?.map(m => m.id) || [])
        .order("created_at", { ascending: false })

      if (discussionsData) {
        setDiscussions(discussionsData.map(d => ({
          ...d,
          replies_count: d.replies?.[0]?.count || 0
        })))
      }
    } catch (error) {
      toast({
        title: "Error loading roadmap",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateDiscussion = async () => {
    try {
      setIsCreatingDiscussion(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/login")
        return
      }

      const { error } = await supabase
        .from("discussions")
        .insert({
          title: newDiscussion.title,
          content: newDiscussion.content,
          module_id: newDiscussion.module_id,
          user_id: user.id
        })

      if (error) throw error

      toast({
        title: "Discussion created",
        description: "Your discussion has been posted successfully",
      })

      setNewDiscussion({ title: "", content: "", module_id: "" })
      fetchRoadmapData()
    } catch (error: any) {
      toast({
        title: "Error creating discussion",
        description: error.message || "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsCreatingDiscussion(false)
    }
  }

  const fetchComments = async (discussionId: string) => {
    try {
      const { data: comments } = await supabase
        .from("comments")
        .select(`
          *,
          user:profiles!comments_user_id_fkey(user_id)
        `)
        .eq("discussion_id", discussionId)
        .order("created_at", { ascending: true })

      if (comments) {
        setDiscussions(prev => prev.map(d => 
          d.id === discussionId 
            ? { ...d, comments: comments }
            : d
        ))
      }
    } catch (error) {
      toast({
        title: "Error loading comments",
        description: "Please try again later",
        variant: "destructive",
      })
    }
  }

  const handleAddComment = async (discussionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/login")
        return
      }

      const commentContent = newComments[discussionId]
      if (!commentContent?.trim()) return

      const { error } = await supabase
        .from("comments")
        .insert({
          content: commentContent,
          discussion_id: discussionId,
          user_id: user.id
        })

      if (error) throw error

      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully",
      })

      setNewComments(prev => ({ ...prev, [discussionId]: "" }))
      fetchComments(discussionId)
    } catch (error: any) {
      toast({
        title: "Error adding comment",
        description: error.message || "Please try again later",
        variant: "destructive",
      })
    }
  }

  const toggleDiscussion = (discussionId: string) => {
    setExpandedDiscussions(prev => {
      const newState = { ...prev, [discussionId]: !prev[discussionId] }
      if (newState[discussionId]) {
        fetchComments(discussionId)
      }
      return newState
    })
  }

  // Calculate progress
  const totalModules = modules?.length || 0
  const completedModules = modules?.filter((m) => m.user_progress[0].status === "completed").length || 0
  const progressPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0

  return (
    <DashboardLayout>
      <div className="container p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Link href={isContentCurator ? "/dashboard" : "/roadmaps"}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{roadmap?.title}</h1>
            <p className="text-muted-foreground">{roadmap?.description}</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Your Progress</CardTitle>
            <CardDescription>
              {progressPercentage}% complete ({completedModules}/{totalModules} modules)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progressPercentage} className="h-2" />
          </CardContent>
        </Card>

        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="discussions">
              <MessageSquare className="h-4 w-4 mr-2" />
              Discussions
            </TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="modules" className="space-y-4">
            {modules && modules.length > 0 ? (
              <div className="space-y-4">
                {modules.map((module) => {
                  const progress = module.user_progress[0]
                  const isCompleted = progress.status === "completed"
                  const isInProgress = progress.status === "in_progress"

                  return (
                    <Card key={module.id} className={isCompleted ? "border-primary/50" : ""}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">
                            Week {module.week_number}: {module.title}
                          </CardTitle>
                          <div className="flex items-center gap-1 text-sm">
                            {isCompleted ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-primary" />
                                <span className="text-primary">Completed</span>
                              </>
                            ) : isInProgress ? (
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
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                        <Link href={`/modules/${module.id}`}>
                          <Button variant={isCompleted ? "outline" : "default"} className="w-full">
                            {isCompleted ? "Review Module" : isInProgress ? "Continue Module" : "Start Module"}
                          </Button>
                        </Link>
                        <div className="space-y-4">
                          <h3 className="font-semibold">Resources</h3>
                          <div className="grid gap-4">
                            {module?.resources?.map((resource) => (
                              <Card key={resource.id}>
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                      <h4 className="font-medium">{resource.title}</h4>
                                      <p className="text-sm text-muted-foreground">{resource.description}</p>
                                    </div>
                                    {resource.type === "video" ? (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedVideo(resource)}
                                      >
                                        <Video className="h-4 w-4 mr-2" />
                                        Watch Video
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        asChild
                                      >
                                        <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                          {resource.type === "blog" ? "Read Article" : "Take Quiz"}
                                        </a>
                                      </Button>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium">No modules available</h3>
                <p className="text-muted-foreground">This roadmap doesn't have any modules yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="discussions" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Roadmap Discussions</CardTitle>
                    <CardDescription>Connect with others learning the same skills</CardDescription>
                  </div>
                  <Button onClick={() => setIsCreatingDiscussion(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Discussion
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {isCreatingDiscussion && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Create New Discussion</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Input
                          placeholder="Discussion title"
                          value={newDiscussion.title}
                          onChange={(e) => setNewDiscussion({ ...newDiscussion, title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                          value={newDiscussion.module_id}
                          onChange={(e) => setNewDiscussion({ ...newDiscussion, module_id: e.target.value })}
                        >
                          <option value="">Select a module</option>
                          {modules.map((module) => (
                            <option key={module.id} value={module.id}>
                              Week {module.week_number}: {module.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Textarea
                          placeholder="What would you like to discuss?"
                          value={newDiscussion.content}
                          onChange={(e) => setNewDiscussion({ ...newDiscussion, content: e.target.value })}
                          rows={4}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsCreatingDiscussion(false)
                            setNewDiscussion({ title: "", content: "", module_id: "" })
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCreateDiscussion}
                          disabled={!newDiscussion.title || !newDiscussion.content || !newDiscussion.module_id}
                        >
                          Post Discussion
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {discussions.length > 0 ? (
                  <div className="space-y-4">
                    {discussions.map((discussion) => (
                      <Card key={discussion.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-base">{discussion.title}</CardTitle>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback>
                                    {discussion.author?.user_id?.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span>User {discussion.author?.user_id?.slice(0, 8)}</span>
                                <span>•</span>
                                <span>Week {discussion.module?.week_number}</span>
                                <span>•</span>
                                <span>{formatDistanceToNow(new Date(discussion.created_at), { addSuffix: true })}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MessageSquare className="h-4 w-4" />
                              <span>{discussion.replies_count} replies</span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-muted-foreground">{discussion.content}</p>
                          
                          <Button
                            variant="ghost"
                            className="w-full"
                            onClick={() => toggleDiscussion(discussion.id)}
                          >
                            {expandedDiscussions[discussion.id] ? "Hide Comments" : "Show Comments"}
                          </Button>

                          {expandedDiscussions[discussion.id] && (
                            <div className="space-y-4 mt-4">
                              {discussion.comments?.map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                      {comment.user?.user_id?.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium">User {comment.user?.user_id?.slice(0, 8)}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{comment.content}</p>
                                  </div>
                                </div>
                              ))}

                              <div className="flex gap-2 mt-4">
                                <Textarea
                                  placeholder="Write a comment..."
                                  value={newComments[discussion.id] || ""}
                                  onChange={(e) => setNewComments(prev => ({ ...prev, [discussion.id]: e.target.value }))}
                                  className="flex-1"
                                  rows={2}
                                />
                                <Button
                                  size="icon"
                                  onClick={() => handleAddComment(discussion.id)}
                                  disabled={!newComments[discussion.id]?.trim()}
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No discussions yet</h3>
                    <p className="text-muted-foreground">Be the first to start a discussion!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Additional Resources</CardTitle>
                <CardDescription>Supplementary materials for this roadmap</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8 text-muted-foreground">
                  Resources are available at the module level. Select a module to access learning resources.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Video Player Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedVideo?.title}</DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full">
            <video
              src={selectedVideo?.url}
              controls
              className="w-full h-full rounded-lg"
              autoPlay
            >
              Your browser does not support the video tag.
            </video>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{selectedVideo?.description}</p>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
