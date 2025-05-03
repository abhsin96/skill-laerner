"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter, useSearchParams } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft, Loader2, MessageSquare, Send } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { formatDistanceToNow } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
    id: string
    title: string
    week_number: number
    roadmap?: {
      id: string
      title: string
    }
  }
  roadmap?: {
    id: string
    title: string
  }
  comments?: Comment[]
}

export default function DiscussionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()
  const [isLoading, setIsLoading] = useState(true)
  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [newComments, setNewComments] = useState<{ [key: string]: string }>({})
  const [expandedDiscussions, setExpandedDiscussions] = useState<{ [key: string]: boolean }>({})
  const [selectedRoadmap, setSelectedRoadmap] = useState<string>("all")
  const [roadmaps, setRoadmaps] = useState<{ id: string; title: string }[]>([])

  useEffect(() => {
    // Get roadmap ID from URL if present
    const roadmapId = searchParams.get("id")
    if (roadmapId) {
      setSelectedRoadmap(roadmapId)
    }
  }, [searchParams])

  useEffect(() => {
    fetchData()
  }, [selectedRoadmap])

  const fetchData = async () => {
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

      if (!profile || profile.role !== "content_curator") {
        router.push("/dashboard")
        return
      }

      // Get content curator's roadmaps
      const { data: roadmapsData } = await supabase
        .from("roadmaps")
        .select("id, title")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false })

      if (roadmapsData) {
        setRoadmaps(roadmapsData)
      }

      // Get discussions
      let query = supabase
        .from("discussions")
        .select(`
          *,
          author:profiles(user_id),
          replies:comments(count),
          module:modules!discussions_module_id_fkey(
            id,
            title,
            week_number,
            roadmap:roadmaps(
              id,
              title
            )
          )
        `)
        .order("created_at", { ascending: false })

      // Apply roadmap filter if a specific roadmap is selected
      if (selectedRoadmap !== "all") {
        query = query.eq("module.roadmap.id", selectedRoadmap)
      }

      const { data: discussionsData } = await query

      if (discussionsData) {
        setDiscussions(discussionsData.map(d => ({
          ...d,
          replies_count: d.replies?.[0]?.count || 0,
          roadmap: d.module?.roadmap
        })))
      }
    } catch (error) {
      toast({
        title: "Error loading discussions",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
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
  
  const filteredDiscussions = selectedRoadmap === "all"
    ? discussions
    : discussions.filter(d => d.module?.roadmap?.id === selectedRoadmap)

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container p-4 md:p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="container p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Discussions</h1>
            <p className="text-muted-foreground">Monitor and participate in roadmap discussions</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Discussions</CardTitle>
                <CardDescription>View and participate in discussions across your roadmaps</CardDescription>
              </div>
              <Select value={selectedRoadmap} onValueChange={setSelectedRoadmap}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by roadmap" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roadmaps</SelectItem>
                  {roadmaps.map((roadmap) => (
                    <SelectItem key={roadmap.id} value={roadmap.id}>
                      {roadmap.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {filteredDiscussions.length > 0 ? (
              <div className="space-y-4">
                {filteredDiscussions.map((discussion) => (
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
                            <Link href={`/roadmaps/${discussion.module?.roadmap?.id}`} className="hover:underline">
                              {discussion.module?.roadmap?.title}
                            </Link>
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
                <h3 className="text-lg font-medium">No discussions found</h3>
                <p className="text-muted-foreground">
                  {selectedRoadmap === "all" 
                    ? "There are no discussions in your roadmaps yet."
                    : "There are no discussions in this roadmap yet."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 