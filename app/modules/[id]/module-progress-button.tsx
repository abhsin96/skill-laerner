"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { CheckCircle, Loader2, Play } from "lucide-react"

interface ModuleProgressButtonProps {
  userId: string
  moduleId: string
  currentStatus: "not_started" | "in_progress" | "completed"
  xpReward: number
  onStatusChange?: (newStatus: "not_started" | "in_progress" | "completed") => void
}

export default function ModuleProgressButton({ 
  userId, 
  moduleId, 
  currentStatus, 
  xpReward,
  onStatusChange 
}: ModuleProgressButtonProps) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState(currentStatus)

  const handleUpdateProgress = async () => {
    setIsLoading(true)

    try {
      let newStatus: "not_started" | "in_progress" | "completed"
      let xpToAward = 0

      if (status === "not_started") {
        newStatus = "in_progress"
      } else if (status === "in_progress") {
        newStatus = "completed"
        xpToAward = xpReward
      } else {
        // Already completed, nothing to do
        setIsLoading(false)
        return
      }

      // First, check if progress entry exists
      const { data: existingProgress, error: checkError } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("module_id", moduleId)
        .single()

      if (checkError && checkError.code !== "PGRST116") { // PGRST116 is "no rows returned" error
        throw checkError
      }

      let progressError
      if (!existingProgress) {
        // Create new progress entry
        const { error } = await supabase
          .from("user_progress")
          .insert({
            user_id: userId,
            module_id: moduleId,
            status: newStatus,
            completed_at: newStatus === "completed" ? new Date().toISOString() : null,
          })
        progressError = error
      } else {
        // Update existing progress
        const { error } = await supabase
          .from("user_progress")
          .update({
            status: newStatus,
            completed_at: newStatus === "completed" ? new Date().toISOString() : null,
          })
          .eq("user_id", userId)
          .eq("module_id", moduleId)
        progressError = error
      }

      if (progressError) {
        throw progressError
      }

      // Update local state
      setStatus(newStatus)
      // Notify parent component
      onStatusChange?.(newStatus)

      // Award XP if module is completed
      if (xpToAward > 0) {
        const { error: xpError } = await supabase.from("xp_transactions").insert({
          user_id: userId,
          amount: xpToAward,
          description: "Completed module",
          module_id: moduleId,
        })

        if (xpError) {
          throw xpError
        }

        toast({
          title: "Module completed!",
          description: `You earned ${xpToAward} XP for completing this module.`,
        })
      } else if (newStatus === "in_progress") {
        toast({
          title: "Module started",
          description: "Your progress has been saved.",
        })
      }

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error updating progress",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "completed") {
    return (
      <Button variant="outline" disabled className="w-full">
        <CheckCircle className="mr-2 h-4 w-4" /> Module Completed
      </Button>
    )
  }

  return (
    <Button onClick={handleUpdateProgress} className="w-full" disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
        </>
      ) : status === "not_started" ? (
        <>
          <Play className="mr-2 h-4 w-4" /> Start Module
        </>
      ) : (
        <>
          <CheckCircle className="mr-2 h-4 w-4" /> Mark as Completed
        </>
      )}
    </Button>
  )
}
