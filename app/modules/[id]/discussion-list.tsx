"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"

interface Discussion {
  id: string
  title: string
  content: string
  created_at: string
  user_id: string
  profiles: {
    id: string
    user_id: string
  }
  comment_count: [{ count: number }]
}

interface DiscussionListProps {
  discussions: Discussion[]
  moduleId: string
  userId: string
}

export default function DiscussionList({ discussions, moduleId, userId }: DiscussionListProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredDiscussions = discussions.filter(
    (discussion) =>
      discussion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      discussion.content.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (discussions.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium">No discussions yet</h3>
        <p className="text-muted-foreground mb-4">Be the first to start a discussion about this module.</p>
        <Link href={`/modules/${moduleId}/discussions/new`}>
          <button className="text-primary hover:underline">Start a new discussion</button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {filteredDiscussions.map((discussion) => (
        <Link key={discussion.id} href={`/modules/${moduleId}/discussions/${discussion.id}`}>
          <Card className="hover:bg-muted/50 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <CardTitle className="text-base">{discussion.title}</CardTitle>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>{discussion.comment_count[0].count}</span>
                </div>
              </div>
              <CardDescription>
                {new Date(discussion.created_at).toLocaleDateString()} •
                {discussion.profiles.user_id === userId ? " You" : " Another learner"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">{discussion.content}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
