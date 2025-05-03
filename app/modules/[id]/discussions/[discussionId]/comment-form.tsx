"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface CommentFormProps {
  userId: string
  discussionId: string
  parentId?: string
  onCancel?: () => void
}

export default function CommentForm({ userId, discussionId, parentId, onCancel }: CommentFormProps) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [isLoading, setIsLoading] = useState(false)
  const [content, setContent] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      toast({
        title: "Comment cannot be empty",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.from("comments").insert({
        content,
        user_id: userId,
        discussion_id: discussionId,
        parent_id: parentId || null,
      })

      if (error) {
        throw error
      }

      toast({
        title: parentId ? "Reply added" : "Comment added",
        description: "Your comment has been posted successfully.",
      })

      setContent("")
      if (onCancel) {
        onCancel()
      }

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error posting comment",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Textarea
        placeholder={parentId ? "Write a reply..." : "Share your thoughts..."}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={parentId ? 3 : 4}
        required
      />

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {parentId ? "Replying..." : "Posting..."}
            </>
          ) : parentId ? (
            "Reply"
          ) : (
            "Post Comment"
          )}
        </Button>
      </div>
    </form>
  )
}
