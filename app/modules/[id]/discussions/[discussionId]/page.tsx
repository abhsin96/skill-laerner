import { createServerSupabaseClient, getSession } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import CommentForm from "./comment-form"
import CommentList from "./comment-list"

export default async function DiscussionPage({
  params,
}: {
  params: { id: string; discussionId: string }
}) {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  const supabase = createServerSupabaseClient()

  // Get discussion details
  const { data: discussion } = await supabase
    .from("discussions")
    .select(`
      *,
      profiles:user_id (
        user_id
      ),
      modules:module_id (
        id,
        title,
        roadmap_id
      )
    `)
    .eq("id", params.discussionId)
    .eq("module_id", params.id)
    .single()

  if (!discussion) {
    redirect(`/modules/${params.id}`)
  }

  // Check if user has access to this module's roadmap
  const { data: userRoadmap } = await supabase
    .from("user_roadmaps")
    .select("*")
    .eq("user_id", session.user.id)
    .eq("roadmap_id", discussion.modules.roadmap_id)
    .single()

  if (!userRoadmap) {
    redirect(`/roadmaps/${discussion.modules.roadmap_id}/start`)
  }

  // Get comments for this discussion
  const { data: comments } = await supabase
    .from("comments")
    .select(`
      *,
      profiles:user_id (
        user_id
      )
    `)
    .eq("discussion_id", params.discussionId)
    .is("parent_id", null)
    .order("created_at", { ascending: true })

  // Get all replies
  const { data: replies } = await supabase
    .from("comments")
    .select(`
      *,
      profiles:user_id (
        user_id
      )
    `)
    .eq("discussion_id", params.discussionId)
    .not("parent_id", "is", null)
    .order("created_at", { ascending: true })

  // Organize replies by parent comment
  const repliesByParent: Record<string, any[]> = {}

  replies?.forEach((reply) => {
    if (!repliesByParent[reply.parent_id]) {
      repliesByParent[reply.parent_id] = []
    }
    repliesByParent[reply.parent_id].push(reply)
  })

  return (
    <DashboardLayout>
      <div className="container p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-2">
          <Link href={`/modules/${params.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Discussion</h1>
            <p className="text-muted-foreground">
              <Link href={`/modules/${params.id}`} className="hover:underline">
                {discussion.modules.title}
              </Link>
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{discussion.title}</CardTitle>
                <CardDescription>
                  Posted on {new Date(discussion.created_at).toLocaleDateString()} by
                  {discussion.profiles.user_id === session.user.id ? " you" : " another learner"}
                </CardDescription>
              </div>
              <Avatar className="h-10 w-10">
                <AvatarFallback>{discussion.profiles.user_id === session.user.id ? "ME" : "U"}</AvatarFallback>
              </Avatar>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <p>{discussion.content}</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Comments</h2>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add a Comment</CardTitle>
            </CardHeader>
            <CardContent>
              <CommentForm userId={session.user.id} discussionId={params.discussionId} />
            </CardContent>
          </Card>

          <CommentList
            comments={comments || []}
            replies={repliesByParent}
            userId={session.user.id}
            discussionId={params.discussionId}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}
