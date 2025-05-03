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
}

export default function ModuleProgressButton({ userId, moduleId, currentStatus, xpReward }: ModuleProgressButtonProps) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [isLoading, setIsLoading] = useState(false)

  const handleUpdateProgress = async () => {
    setIsLoading(true)

    try {
      let newStatus: "not_started" | "in_progress" | "completed"
      let xpToAward = 0

      if (currentStatus === "not_started") {
        newStatus = "in_progress"
      } else if (currentStatus === "in_progress") {
        newStatus = "completed"
        xpToAward = xpReward
      } else {
        // Already completed, nothing to do
        setIsLoading(false)
        return
      }

      // Update progress status
      const { error: progressError } = await supabase
        .from("user_progress")
        .update({
          status: newStatus,
          completed_at: newStatus === "completed" ? new Date().toISOString() : null,
        })
        .eq("user_id", userId)
        .eq("module_id", moduleId)

      if (progressError) {
        throw progressError
      }

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

  if (currentStatus === "completed") {
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
      ) : currentStatus === "not_started" ? (
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
