"use client"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { updateUserStats } from "@/app/lib/badge-service"

interface ModuleProgressButtonProps {
  userId: string
  moduleId: string
  currentStatus: "not_started" | "in_progress" | "completed" | null
  xpReward?: number
  onStatusChange?: (status: "not_started" | "in_progress" | "completed") => void
}

export function ModuleProgressButton({
  userId,
  moduleId,
  currentStatus,
  xpReward,
  onStatusChange,
}: ModuleProgressButtonProps) {
  const [status, setStatus] = useState<"not_started" | "in_progress" | "completed" | null>(currentStatus)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleUpdateProgress = async () => {
    try {
      setIsLoading(true)
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to update progress.",
          variant: "destructive",
        })
        return
      }

      const now = new Date()
      const hour = now.getHours()
      const isEarlyBird = hour >= 5 && hour < 9
      const isNightOwl = hour >= 22 || hour < 5

      let newStatus: "not_started" | "in_progress" | "completed" = "not_started"
      if (status === "not_started") {
        newStatus = "in_progress"
      } else if (status === "in_progress") {
        newStatus = "completed"
      }

      // First, check if there's an existing progress entry
      const { data: existingProgress, error: checkError } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("module_id", moduleId)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError
      }

      let error
      if (existingProgress) {
        // Update existing progress
        const { error: updateError } = await supabase
          .from("user_progress")
          .update({
            status: newStatus,
            completed_at: newStatus === "completed" ? now.toISOString() : null,
          })
          .eq("user_id", userId)
          .eq("module_id", moduleId)
        error = updateError
      } else {
        // Insert new progress
        const { error: insertError } = await supabase
          .from("user_progress")
          .insert({
            user_id: userId,
            module_id: moduleId,
            status: newStatus,
            started_at: newStatus === "in_progress" ? now.toISOString() : null,
            completed_at: newStatus === "completed" ? now.toISOString() : null,
          })
        error = insertError
      }

      if (error) {
        throw error
      }

      // Update user stats and check for badges
      await updateUserStats(userId, {
        modulesCompleted: newStatus === "completed" ? 1 : 0,
        earlyBirdCompletions: newStatus === "completed" && isEarlyBird ? 1 : 0,
        nightOwlCompletions: newStatus === "completed" && isNightOwl ? 1 : 0,
      })

      setStatus(newStatus)
      onStatusChange?.(newStatus)

      toast({
        title: "Success",
        description: `Module marked as ${newStatus.replace("_", " ")}`,
      })

      router.refresh()
    } catch (error: any) {
      console.error("Error updating progress:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update progress. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getButtonText = () => {
    switch (status) {
      case "in_progress":
        return "Mark as Completed"
      case "completed":
        return "Completed"
      default:
        return "Start Module"
    }
  }

  const getButtonVariant = () => {
    switch (status) {
      case "in_progress":
        return "default"
      case "completed":
        return "secondary"
      default:
        return "default"
    }
  }

  return (
    <Button
      onClick={handleUpdateProgress}
      disabled={status === "completed" || isLoading}
      variant={getButtonVariant()}
      className="w-full"
    >
      {isLoading ? "Updating..." : getButtonText()}
    </Button>
  )
}
