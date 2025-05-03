"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

const INTERESTS = [
  "Web Development",
  "Mobile Development",
  "UI/UX Design",
  "Data Science",
  "Machine Learning",
  "DevOps",
  "Cloud Computing",
  "Cybersecurity",
  "Blockchain",
  "Game Development",
  "Digital Marketing",
  "Product Management",
]

const TIME_OPTIONS = [
  { value: 5, label: "5 hours" },
  { value: 10, label: "10 hours" },
  { value: 15, label: "15 hours" },
  { value: 20, label: "20+ hours" },
]

interface ProfileSetupFormProps {
  userId: string
}

export default function ProfileSetupForm({ userId }: ProfileSetupFormProps) {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [userRole, setUserRole] = useState<"learner" | "content_curator">("learner")
  const [formData, setFormData] = useState({
    learning_goals: "",
    weekly_learning_time: 5,
  })

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", userId)
        .single()

      if (data) {
        setUserRole(data.role)
      }
    }

    fetchUserRole()
  }, [userId, supabase])

  const handleInterestChange = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((item) => item !== interest) : [...prev, interest],
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleTimeChange = (value: number) => {
    setFormData({
      ...formData,
      weekly_learning_time: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedInterests.length === 0) {
      toast({
        title: "Please select at least one interest",
        variant: "destructive",
      })
      return
    }

    if (userRole === "learner" && !formData.learning_goals) {
      toast({
        title: "Please enter your learning goals",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const updateData = {
        interests: selectedInterests,
        ...(userRole === "learner" && {
          learning_goals: formData.learning_goals,
          weekly_learning_time: formData.weekly_learning_time,
        }),
        ...(userRole === "content_curator" && {
          specialization: selectedInterests,
          learning_goals: "Content Curator",
        }),
      }

      const { data, error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("user_id", userId)
        .select()
        .single()

      if (error) {
        throw error
      }

      if (!data) {
        throw new Error("Failed to update profile")
      }

      toast({
        title: "Profile updated successfully",
      })

      await new Promise((resolve) => setTimeout(resolve, 1000))
      
      router.push("/dashboard")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Label>
          {userRole === "learner"
            ? "What are you interested in learning?"
            : "What are your areas of expertise?"}
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {INTERESTS.map((interest) => (
            <div key={interest} className="flex items-center space-x-2">
              <Checkbox
                id={interest}
                checked={selectedInterests.includes(interest)}
                onCheckedChange={() => handleInterestChange(interest)}
              />
              <Label htmlFor={interest} className="font-normal">
                {interest}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {userRole === "learner" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="learning_goals">What are your learning goals?</Label>
            <Textarea
              id="learning_goals"
              name="learning_goals"
              placeholder="I want to learn..."
              rows={3}
              value={formData.learning_goals}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label>How much time can you dedicate to learning each week?</Label>
            <div className="grid grid-cols-2 gap-2">
              {TIME_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={formData.weekly_learning_time === option.value ? "default" : "outline"}
                  onClick={() => handleTimeChange(option.value)}
                  className="w-full"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
          </>
        ) : (
          "Complete Profile"
        )}
      </Button>
    </form>
  )
}
