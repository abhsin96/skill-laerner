"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface StartRoadmapFormProps {
  userId: string
  roadmapId: string
}

export default function StartRoadmapForm({ userId, roadmapId }: StartRoadmapFormProps) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [isLoading, setIsLoading] = useState(false)

  const handleStartRoadmap = async () => {
    setIsLoading(true)

    try {
      // Create user roadmap entry
      const { error: roadmapError } = await supabase.from("user_roadmaps").insert({
        user_id: userId,
        roadmap_id: roadmapId,
        start_date: new Date().toISOString(),
        completed: false,
      })

      if (roadmapError) {
        throw roadmapError
      }

      // Get all modules for this roadmap
      const { data: modules, error: modulesError } = await supabase
        .from("modules")
        .select("id")
        .eq("roadmap_id", roadmapId)

      if (modulesError) {
        throw modulesError
      }

      // Create progress entries for each module
      if (modules && modules.length > 0) {
        const progressEntries = modules.map((module) => ({
          user_id: userId,
          module_id: module.id,
          status: "not_started" as const,
        }))

        const { error: progressError } = await supabase.from("user_progress").insert(progressEntries)

        if (progressError) {
          throw progressError
        }
      }

      toast({
        title: "Roadmap started!",
        description: "Your learning journey has begun.",
      })

      router.push(`/roadmaps/${roadmapId}`)
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error starting roadmap",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Ready to start this learning journey? Click the button below to add this roadmap to your dashboard.
      </p>
      <Button onClick={handleStartRoadmap} className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting...
          </>
        ) : (
          "Start Roadmap"
        )}
      </Button>
    </div>
  )
}
