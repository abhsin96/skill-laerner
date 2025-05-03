"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Plus, Trash2 } from "lucide-react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Module {
  title: string
  description: string
  week_number: number
  xp_reward: number
  resources: Resource[]
}

interface Resource {
  title: string
  description: string
  type: "blog" | "quiz" | "video"
  url: string
}

export default function CreateRoadmapPage() {
  const router = useRouter()
  const { supabase } = useSupabase()
  const [isLoading, setIsLoading] = useState(false)
  const [modules, setModules] = useState<Module[]>([
    {
      title: "",
      description: "",
      week_number: 1,
      xp_reward: 100,
      resources: [{ title: "", description: "", type: "blog", url: "" }],
    },
  ])

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    skill_category: "",
    duration_weeks: 1,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleModuleChange = (index: number, field: keyof Module, value: any) => {
    const newModules = [...modules]
    newModules[index] = {
      ...newModules[index],
      [field]: value,
    }
    setModules(newModules)
  }

  const handleResourceChange = (moduleIndex: number, resourceIndex: number, field: keyof Resource, value: any) => {
    const newModules = [...modules]
    newModules[moduleIndex].resources[resourceIndex] = {
      ...newModules[moduleIndex].resources[resourceIndex],
      [field]: value,
    }
    setModules(newModules)
  }

  const addModule = () => {
    setModules([
      ...modules,
      {
        title: "",
        description: "",
        week_number: modules.length + 1,
        xp_reward: 100,
        resources: [{ title: "", description: "", type: "blog", url: "" }],
      },
    ])
  }

  const removeModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index))
  }

  const addResource = (moduleIndex: number) => {
    const newModules = [...modules]
    newModules[moduleIndex].resources.push({
      title: "",
      description: "",
      type: "blog",
      url: "",
    })
    setModules(newModules)
  }

  const removeResource = (moduleIndex: number, resourceIndex: number) => {
    const newModules = [...modules]
    newModules[moduleIndex].resources = newModules[moduleIndex].resources.filter((_, i) => i !== resourceIndex)
    setModules(newModules)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error("No user found")
      }

      // Create roadmap
      const { data: roadmap, error: roadmapError } = await supabase
        .from("roadmaps")
        .insert({
          title: formData.title,
          description: formData.description,
          skill_category: formData.skill_category,
          duration_weeks: formData.duration_weeks,
          created_by: user.id,
        })
        .select()
        .single()

      if (roadmapError) throw roadmapError

      // Create modules
      for (const module of modules) {
        const { error: moduleError } = await supabase.from("modules").insert({
          roadmap_id: roadmap.id,
          title: module.title,
          description: module.description,
          week_number: module.week_number,
          xp_reward: module.xp_reward,
        })

        if (moduleError) throw moduleError

        // Get the created module
        const { data: createdModule } = await supabase
          .from("modules")
          .select("id")
          .eq("title", module.title)
          .eq("roadmap_id", roadmap.id)
          .single()

        if (!createdModule) {
          throw new Error("Failed to create module")
        }

        // Create resources for the module
        for (const resource of module.resources) {
          const { error: resourceError } = await supabase.from("resources").insert({
            module_id: createdModule.id,
            title: resource.title,
            description: resource.description,
            type: resource.type,
            url: resource.url,
          })

          if (resourceError) throw resourceError
        }
      }

      toast({
        title: "Roadmap created successfully",
      })

      router.push("/dashboard")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error creating roadmap",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="container p-4 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Create New Roadmap</h1>
            <p className="text-muted-foreground">Design a comprehensive learning path for your students</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Roadmap Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Web Development Fundamentals"
                  required
                  value={formData.title}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe what students will learn in this roadmap"
                  required
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skill_category">Skill Category</Label>
                <Select
                  value={formData.skill_category}
                  onValueChange={(value) => setFormData({ ...formData, skill_category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Web Development">Web Development</SelectItem>
                    <SelectItem value="Mobile Development">Mobile Development</SelectItem>
                    <SelectItem value="Data Science">Data Science</SelectItem>
                    <SelectItem value="Machine Learning">Machine Learning</SelectItem>
                    <SelectItem value="DevOps">DevOps</SelectItem>
                    <SelectItem value="Cloud Computing">Cloud Computing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration_weeks">Duration (weeks)</Label>
                <Input
                  id="duration_weeks"
                  name="duration_weeks"
                  type="number"
                  min="1"
                  required
                  value={formData.duration_weeks}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Modules</h2>
              <Button type="button" variant="outline" onClick={addModule}>
                <Plus className="h-4 w-4 mr-2" />
                Add Module
              </Button>
            </div>

            {modules.map((module, moduleIndex) => (
              <Card key={moduleIndex}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Module {moduleIndex + 1}</CardTitle>
                    {modules.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeModule(moduleIndex)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={module.title}
                      onChange={(e) => handleModuleChange(moduleIndex, "title", e.target.value)}
                      placeholder="Module title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={module.description}
                      onChange={(e) => handleModuleChange(moduleIndex, "description", e.target.value)}
                      placeholder="Module description"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Week Number</Label>
                      <Input
                        type="number"
                        min="1"
                        value={module.week_number}
                        onChange={(e) => handleModuleChange(moduleIndex, "week_number", parseInt(e.target.value))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>XP Reward</Label>
                      <Input
                        type="number"
                        min="0"
                        value={module.xp_reward}
                        onChange={(e) => handleModuleChange(moduleIndex, "xp_reward", parseInt(e.target.value))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">Resources</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addResource(moduleIndex)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Resource
                      </Button>
                    </div>

                    {module.resources.map((resource, resourceIndex) => (
                      <div key={resourceIndex} className="space-y-4 p-4 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Resource {resourceIndex + 1}</h4>
                          {module.resources.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeResource(moduleIndex, resourceIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input
                            value={resource.title}
                            onChange={(e) => handleResourceChange(moduleIndex, resourceIndex, "title", e.target.value)}
                            placeholder="Resource title"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={resource.description}
                            onChange={(e) => handleResourceChange(moduleIndex, resourceIndex, "description", e.target.value)}
                            placeholder="Resource description"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                              value={resource.type}
                              onValueChange={(value) => handleResourceChange(moduleIndex, resourceIndex, "type", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="blog">Blog</SelectItem>
                                <SelectItem value="quiz">Quiz</SelectItem>
                                <SelectItem value="video">Video</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>URL</Label>
                            <Input
                              value={resource.url}
                              onChange={(e) => handleResourceChange(moduleIndex, resourceIndex, "url", e.target.value)}
                              placeholder="Resource URL"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Roadmap...
              </>
            ) : (
              "Create Roadmap"
            )}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  )
} 