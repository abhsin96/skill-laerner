"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import CommentForm from "./comment-form"

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: {
    user_id: string
  }
}

interface CommentListProps {
  comments: Comment[]
  replies: Record<string, Comment[]>
  userId: string
  discussionId: string
}

export default function CommentList({ comments, replies, userId, discussionId }: CommentListProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [showRepliesFor, setShowRepliesFor] = useState<Record<string, boolean>>({})

  const toggleReplies = (commentId: string) => {
    setShowRepliesFor((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }))
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => {
        const commentReplies = replies[comment.id] || []
        const hasReplies = commentReplies.length > 0
        const isShowingReplies = showRepliesFor[comment.id]

        return (
          <div key={comment.id} className="space-y-2">
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{comment.profiles.user_id === userId ? "ME" : "U"}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{comment.profiles.user_id === userId ? "You" : "User"}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p>{comment.content}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                >
                  Reply
                </Button>
                {hasReplies && (
                  <Button variant="ghost" size="sm" onClick={() => toggleReplies(comment.id)}>
                    <MessageSquare className="mr-1 h-4 w-4" />
                    {commentReplies.length} {commentReplies.length === 1 ? "reply" : "replies"}
                    {isShowingReplies ? " (hide)" : ""}
                  </Button>
                )}
              </CardFooter>
            </Card>

            {replyingTo === comment.id && (
              <div className="ml-12">
                <Card>
                  <CardContent className="pt-4">
                    <CommentForm
                      userId={userId}
                      discussionId={discussionId}
                      parentId={comment.id}
                      onCancel={() => setReplyingTo(null)}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {hasReplies && isShowingReplies && (
              <div className="ml-12 space-y-2">
                {commentReplies.map((reply) => (
                  <Card key={reply.id}>
                    <CardContent className="pt-4">
                      <div className="flex gap-4">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{reply.profiles.user_id === userId ? "ME" : "U"}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{reply.profiles.user_id === userId ? "You" : "User"}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(reply.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm">{reply.content}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
